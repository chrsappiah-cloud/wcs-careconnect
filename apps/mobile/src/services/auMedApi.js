// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
/**
 * Australian Medical API Services
 *
 * Connects to real, publicly accessible Australian and international
 * medical APIs relevant to aged care / resident monitoring.
 *
 * APIs integrated:
 *  1. RxNorm (NLM) — drug names (open, no key)
 *  2. OpenFDA — adverse drug events (open, rate-limited)
 *  3. WHO ICD-11 — disease classification (open search)
 *  4. HAPI FHIR R4 — public FHIR test server (open)
 *  5. CSIRO Ontoserver (AU FHIR terminology) — SNOMED CT-AU lookups
 */

const RXNORM_BASE = 'https://rxnav.nlm.nih.gov/REST';
const OPENFDA_BASE = 'https://api.fda.gov';
const ICD11_BASE = 'https://id.who.int/icd';
const HAPI_FHIR_BASE = 'https://hapi.fhir.org/baseR4';
const ONTOSERVER_BASE = 'https://tx.dev.hl7.org.au/fhir';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT = 12000;
const MAX_QUERY_LENGTH = 200;

function sanitizeQuery(query) {
  if (typeof query !== 'string') return '';
  return query.trim().slice(0, MAX_QUERY_LENGTH);
}

function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

async function fetchJSON(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeout || DEFAULT_TIMEOUT,
  );

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} – ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 1. RxNorm — Drug lookup  (open, no key)
//    https://lhncbc.nlm.nih.gov/RxNav/APIs/
//    Note: The Interaction API has been retired by NLM.
//    Drug interaction checks now use OpenFDA label data instead.
// ---------------------------------------------------------------------------

/** Search drugs by name — returns array of { rxcui, name, synonym, tty } */
export async function searchDrugs(query) {
  const q = sanitizeQuery(query);
  if (!q) return [];
  const data = await fetchJSON(
    `${RXNORM_BASE}/drugs.json?name=${encodeURIComponent(q)}`,
  );
  const groups = data?.drugGroup?.conceptGroup || [];
  const results = [];
  for (const group of groups) {
    for (const prop of group.conceptProperties || []) {
      results.push({
        rxcui: prop.rxcui,
        name: prop.name,
        synonym: prop.synonym || '',
        tty: prop.tty,
      });
    }
  }
  return results;
}

/** Get drug details by RxCUI */
export async function getDrugByRxcui(rxcui) {
  if (!rxcui || !/^\d+$/.test(String(rxcui))) return null;
  const data = await fetchJSON(
    `${RXNORM_BASE}/rxcui/${encodeURIComponent(rxcui)}/allrelated.json`,
  );
  const groups = data?.allRelatedGroup?.conceptGroup || [];
  const info = { rxcui, brandNames: [], ingredients: [], doseForms: [] };
  for (const g of groups) {
    for (const p of g.conceptProperties || []) {
      if (g.tty === 'BN') info.brandNames.push(p.name);
      else if (g.tty === 'IN' || g.tty === 'MIN') info.ingredients.push(p.name);
      else if (g.tty === 'DF') info.doseForms.push(p.name);
    }
  }
  return info;
}

/**
 * Check interactions between drugs using OpenFDA drug labeling data.
 * The NLM Interaction API has been retired, so we query OpenFDA's
 * drug label endpoint for drug_interactions sections instead.
 */
export async function checkDrugInteractions(drugs = []) {
  if (!Array.isArray(drugs) || drugs.length < 2) return [];
  // Accept either RxCUI strings or drug name strings
  const names = drugs.map((d) => sanitizeQuery(String(d))).filter(Boolean);
  if (names.length < 2) return [];

  const interactions = [];
  // Query OpenFDA drug labels for interaction warnings between each pair
  for (let i = 0; i < names.length && i < 10; i++) {
    try {
      const q = encodeURIComponent(names[i]);
      const data = await fetchJSON(
        `${OPENFDA_BASE}/drug/label.json?search=drug_interactions:"${q}"&limit=3`,
      );
      for (const result of data?.results || []) {
        const interactionText = (result.drug_interactions || []).join(' ');
        // Check if any of the other selected drugs are mentioned
        for (let j = 0; j < names.length; j++) {
          if (i === j) continue;
          if (interactionText.toLowerCase().includes(names[j].toLowerCase())) {
            interactions.push({
              severity: 'N/A',
              description: interactionText.slice(0, 500),
              drugs: [names[i], names[j]],
            });
          }
        }
      }
    } catch {
      // Individual lookup failure — continue with other drugs
    }
  }
  return interactions;
}

/** Suggest spelling corrections for a drug name */
export async function suggestDrugSpelling(query) {
  const q = sanitizeQuery(query);
  if (!q) return [];
  const data = await fetchJSON(
    `${RXNORM_BASE}/spellingsuggestions.json?name=${encodeURIComponent(q)}`,
  );
  return data?.suggestionGroup?.suggestionList?.suggestion || [];
}

// ---------------------------------------------------------------------------
// 2. OpenFDA — Adverse drug events  (open, rate-limited)
//    https://open.fda.gov/apis/drug/event/
// ---------------------------------------------------------------------------

/** Search adverse events for a drug name */
export async function searchAdverseEvents(drugName, limit = 5) {
  const q = sanitizeQuery(drugName);
  if (!q) return [];
  const safeLimit = isPositiveInt(limit) ? Math.min(limit, 100) : 5;
  const data = await fetchJSON(
    `${OPENFDA_BASE}/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(q)}"&limit=${safeLimit}`,
  );
  return (data?.results || []).map((r) => ({
    safetyReportId: r.safetyreportid,
    serious: r.serious === '1',
    seriousnessDescription: [
      r.seriousnessdeath === '1' && 'Death',
      r.seriousnesslifethreatening === '1' && 'Life-threatening',
      r.seriousnesshospitalization === '1' && 'Hospitalisation',
      r.seriousnessdisabling === '1' && 'Disability',
    ].filter(Boolean),
    reactions: (r.patient?.reaction || []).map((rx) => rx.reactionmeddrapt),
    drugs: (r.patient?.drug || []).map((d) => ({
      name: d.medicinalproduct,
      indication: d.drugindication,
      role: d.drugcharacterization,
    })),
    receiveDate: r.receivedate,
  }));
}

/** Get top adverse reactions for a drug (counts) */
export async function topAdverseReactions(drugName, limit = 10) {
  const q = sanitizeQuery(drugName);
  if (!q) return [];
  const safeLimit = isPositiveInt(limit) ? Math.min(limit, 100) : 10;
  const data = await fetchJSON(
    `${OPENFDA_BASE}/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(q)}"&count=patient.reaction.reactionmeddrapt.exact&limit=${safeLimit}`,
  );
  return (data?.results || []).map((r) => ({
    reaction: r.term,
    count: r.count,
  }));
}

// ---------------------------------------------------------------------------
// 3. WHO ICD-11 — Disease / condition classification
//    https://icd.who.int/icdapi  (free token required)
//    We use the linearization endpoint which works without auth for basic search
// ---------------------------------------------------------------------------

/**
 * Search ICD-11 conditions/diseases.
 * The WHO ICD-11 API now requires authentication; we fall back to
 * SNOMED CT clinical-finding search via Ontoserver when ICD-11 is
 * unavailable (401/403), ensuring results are always returned.
 */
export async function searchConditions(query) {
  const q = sanitizeQuery(query);
  if (!q) return [];

  try {
    const data = await fetchJSON(
      `${ICD11_BASE}/release/11/2024-01/mms/search?q=${encodeURIComponent(q)}&subtreeFilterUsesFoundationDescendants=false&includeKeywordResult=false&flatResults=true&highlightingEnabled=false`,
      {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en',
          'API-Version': 'v2',
        },
      },
    );
    return (data?.destinationEntities || []).map((e) => ({
      id: e.id,
      code: e.theCode,
      title: e.title,
      score: e.score,
      chapter: e.chapter,
      source: 'ICD-11',
    }));
  } catch {
    // Fallback: search SNOMED CT clinical findings via Ontoserver
    const findings = await searchSNOMEDFindings(q);
    return findings.map((f) => ({
      id: f.system ? `${f.system}|${f.code}` : f.code,
      code: f.code,
      title: f.display,
      score: undefined,
      chapter: undefined,
      source: 'SNOMED-CT',
    }));
  }
}

// ---------------------------------------------------------------------------
// 4. HAPI FHIR R4 — Public FHIR test server (open, no key)
//    https://hapi.fhir.org/baseR4
// ---------------------------------------------------------------------------

/** Search FHIR Patient resources */
export async function searchFHIRPatients(name) {
  const q = sanitizeQuery(name);
  if (!q) return [];
  const data = await fetchJSON(
    `${HAPI_FHIR_BASE}/Patient?name=${encodeURIComponent(q)}&_count=10&_format=json`,
  );
  return (data?.entry || []).map((e) => ({
    id: e.resource?.id,
    name: formatFHIRName(e.resource?.name?.[0]),
    gender: e.resource?.gender,
    birthDate: e.resource?.birthDate,
  }));
}

/** Search FHIR Medication resources (uses code:text search) */
export async function searchFHIRMedications(query) {
  const q = sanitizeQuery(query);
  if (!q) return [];
  const data = await fetchJSON(
    `${HAPI_FHIR_BASE}/Medication?code:text=${encodeURIComponent(q)}&_count=10&_format=json`,
  );
  return (data?.entry || []).map((e) => ({
    id: e.resource?.id,
    code: e.resource?.code?.coding?.[0]?.display || e.resource?.code?.text,
    form: e.resource?.form?.text,
  }));
}

/** Search FHIR Observation resources (e.g. vital signs) */
export async function searchFHIRObservations(code, count = 10) {
  const q = sanitizeQuery(code);
  if (!q) return [];
  const safeCount = isPositiveInt(count) ? Math.min(count, 100) : 10;
  const data = await fetchJSON(
    `${HAPI_FHIR_BASE}/Observation?code=${encodeURIComponent(q)}&_count=${safeCount}&_sort=-date&_format=json`,
  );
  return (data?.entry || []).map((e) => {
    const r = e.resource;
    return {
      id: r?.id,
      code: r?.code?.coding?.[0]?.display || r?.code?.text,
      value: r?.valueQuantity?.value,
      unit: r?.valueQuantity?.unit,
      effectiveDateTime: r?.effectiveDateTime,
      status: r?.status,
    };
  });
}

function formatFHIRName(name) {
  if (!name) return 'Unknown';
  const given = (name.given || []).join(' ');
  return `${given} ${name.family || ''}`.trim();
}

// ---------------------------------------------------------------------------
// 5. CSIRO Ontoserver — Australian FHIR Terminology (SNOMED CT-AU)
//    https://tx.dev.hl7.org.au/fhir
// ---------------------------------------------------------------------------

/** Lookup SNOMED CT-AU concept by code */
export async function lookupSNOMED(code) {
  if (!code || !/^\d+$/.test(String(code))) return null;
  const data = await fetchJSON(
    `${ONTOSERVER_BASE}/CodeSystem/$lookup?system=http://snomed.info/sct&code=${encodeURIComponent(code)}&_format=json`,
  );
  const params = data?.parameter || [];
  const result = {};
  for (const p of params) {
    if (p.name === 'display') result.display = p.valueString;
    if (p.name === 'name') result.codeSystem = p.valueString;
  }
  result.code = code;
  return result;
}

/** Expand a SNOMED CT-AU ValueSet (search within a set of concepts) */
export async function expandValueSet(valueSetUrl, filter = '', count = 15) {
  if (!valueSetUrl) return [];
  const safeCount = isPositiveInt(count) ? Math.min(count, 100) : 15;
  const safeFilter = sanitizeQuery(filter);
  let url = `${ONTOSERVER_BASE}/ValueSet/$expand?url=${encodeURIComponent(valueSetUrl)}&count=${safeCount}&_format=json`;
  if (safeFilter) url += `&filter=${encodeURIComponent(safeFilter)}`;
  const data = await fetchJSON(url);
  return (data?.expansion?.contains || []).map((c) => ({
    code: c.code,
    display: c.display,
    system: c.system,
  }));
}

/** Search clinical findings in SNOMED CT-AU */
export async function searchSNOMEDFindings(query, count = 15) {
  const q = sanitizeQuery(query);
  if (!q) return [];
  return expandValueSet(
    'http://snomed.info/sct?fhir_vs=isa/404684003',
    q,
    count,
  );
}

/** Search medications in Australian Medicines Terminology (AMT) with
 *  fallback to SNOMED international medicinal product hierarchy */
export async function searchAMTMedications(query, count = 15) {
  const q = sanitizeQuery(query);
  if (!q) return [];
  // Try AMT first (AU extension)
  const amtResults = await expandValueSet(
    'http://snomed.info/sct?fhir_vs=isa/30425011000036101',
    q,
    count,
  );
  if (amtResults.length > 0) return amtResults;
  // Fallback: international SNOMED medicinal product hierarchy
  return expandValueSet(
    'http://snomed.info/sct?fhir_vs=isa/763158003',
    q,
    count,
  );
}

// ---------------------------------------------------------------------------
// Convenience: Aged-care-specific helpers
// ---------------------------------------------------------------------------

/**
 * Comprehensive ICD-11 / SNOMED disease database + search utilities.
 * Re-exported from src/data/diseases.js for backward compatibility.
 */
import {
  DISEASES,
  CATEGORIES as DISEASE_CATEGORIES,
  ICD11_CHAPTERS,
  searchDiseases,
  getDiseasesByCategory,
  getDiseasesByChapter,
  getAgedCarePriorities,
  lookupByCode,
} from '../data/diseases';

export {
  DISEASES,
  DISEASE_CATEGORIES,
  ICD11_CHAPTERS,
  searchDiseases,
  getDiseasesByCategory,
  getDiseasesByChapter,
  getAgedCarePriorities,
  lookupByCode,
};

/** Common aged care conditions — SNOMED codes (backward-compatible format) */
export const AGED_CARE_CONDITIONS = getAgedCarePriorities().map((d) => ({
  code: d.snomed,
  display: d.title,
  icd11: d.icd11,
  category: d.category,
  tags: d.tags,
}));

/** Common aged care medications — pre-built RxCUI codes */
export const COMMON_MEDICATIONS = [
  { rxcui: '6809', name: 'Metformin' },
  { rxcui: '1191', name: 'Aspirin' },
  { rxcui: '29046', name: 'Lisinopril' },
  { rxcui: '10582', name: 'Atorvastatin' },
  { rxcui: '83367', name: 'Amlodipine' },
  { rxcui: '7646', name: 'Omeprazole' },
  { rxcui: '161', name: 'Paracetamol (Acetaminophen)' },
  { rxcui: '3640', name: 'Donepezil' },
  { rxcui: '114979', name: 'Memantine' },
  { rxcui: '32968', name: 'Warfarin' },
  { rxcui: '4815', name: 'Furosemide' },
  { rxcui: '50166', name: 'Clopidogrel' },
];
