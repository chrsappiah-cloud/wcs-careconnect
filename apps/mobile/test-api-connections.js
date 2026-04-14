#!/usr/bin/env node
// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
/**
 * CareConnect API Connection Tester
 *
 * Tests connectivity and response validity for all external medical APIs
 * and internal backend endpoints used by the mobile app.
 *
 * Usage: node test-api-connections.js
 */

const TIMEOUT = 15000;
const results = [];

async function fetchJSON(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeout || TIMEOUT,
  );
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...options.headers },
    });
    clearTimeout(timer);
    return {
      status: res.status,
      ok: res.ok,
      data: await res.json().catch(() => null),
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      status: 0,
      ok: false,
      error: err.name === 'AbortError' ? 'TIMEOUT' : err.message,
    };
  }
}

function report(name, result, details = '') {
  const icon = result === 'PASS' ? '✅' : result === 'WARN' ? '⚠️ ' : '❌';
  const line = `${icon} ${name.padEnd(45)} ${result}${details ? `  ${details}` : ''}`;
  console.log(line);
  results.push({ name, result, details });
}

// ────────────────────────────────────────────────────────
// 1. RxNorm (NLM) — Drug lookup
// ────────────────────────────────────────────────────────
async function testRxNorm() {
  console.log('\n── RxNorm (NLM) ──────────────────────────────');

  // Drug search
  const search = await fetchJSON(
    'https://rxnav.nlm.nih.gov/REST/drugs.json?name=metformin',
  );
  if (search.ok && search.data?.drugGroup?.conceptGroup) {
    const groups = search.data.drugGroup.conceptGroup.filter(
      (g) => g.conceptProperties,
    );
    report(
      'RxNorm: searchDrugs(metformin)',
      'PASS',
      `${groups.length} concept groups`,
    );
  } else {
    report(
      'RxNorm: searchDrugs(metformin)',
      'FAIL',
      search.error || `HTTP ${search.status}`,
    );
  }

  // Drug details by RxCUI
  const detail = await fetchJSON(
    'https://rxnav.nlm.nih.gov/REST/rxcui/861004/allrelated.json',
  );
  if (detail.ok && detail.data?.allRelatedGroup) {
    report('RxNorm: getDrugByRxcui(861004)', 'PASS', 'allRelatedGroup present');
  } else {
    report(
      'RxNorm: getDrugByRxcui(861004)',
      'FAIL',
      detail.error || `HTTP ${detail.status}`,
    );
  }

  // Interaction check (now via OpenFDA drug labels, not retired RxNorm API)
  const labelInteract = await fetchJSON(
    'https://api.fda.gov/drug/label.json?search=drug_interactions:"metformin"&limit=1',
  );
  if (labelInteract.ok && labelInteract.data?.results?.length > 0) {
    const hasSection =
      labelInteract.data.results[0].drug_interactions?.length > 0;
    report(
      'OpenFDA: checkDrugInteractions(label)',
      hasSection ? 'PASS' : 'WARN',
      hasSection ? 'interaction text found' : 'no interaction section',
    );
  } else {
    report(
      'OpenFDA: checkDrugInteractions(label)',
      'FAIL',
      labelInteract.error || `HTTP ${labelInteract.status}`,
    );
  }

  // Spelling suggestions
  const spell = await fetchJSON(
    'https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=metformi',
  );
  if (
    spell.ok &&
    spell.data?.suggestionGroup?.suggestionList?.suggestion?.length > 0
  ) {
    report(
      'RxNorm: suggestDrugSpelling',
      'PASS',
      `${spell.data.suggestionGroup.suggestionList.suggestion.length} suggestions`,
    );
  } else {
    report(
      'RxNorm: suggestDrugSpelling',
      spell.ok ? 'WARN' : 'FAIL',
      spell.error || 'no suggestions',
    );
  }
}

// ────────────────────────────────────────────────────────
// 2. OpenFDA — Adverse drug events
// ────────────────────────────────────────────────────────
async function testOpenFDA() {
  console.log('\n── OpenFDA ───────────────────────────────────');

  const events = await fetchJSON(
    'https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"metformin"&limit=3',
  );
  if (events.ok && events.data?.results?.length > 0) {
    report(
      'OpenFDA: searchAdverseEvents(metformin)',
      'PASS',
      `${events.data.results.length} events`,
    );
  } else {
    report(
      'OpenFDA: searchAdverseEvents(metformin)',
      'FAIL',
      events.error || `HTTP ${events.status}`,
    );
  }

  const top = await fetchJSON(
    'https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"metformin"&count=patient.reaction.reactionmeddrapt.exact&limit=5',
  );
  if (top.ok && top.data?.results?.length > 0) {
    report(
      'OpenFDA: topAdverseReactions(metformin)',
      'PASS',
      `top reaction: ${top.data.results[0].term}`,
    );
  } else {
    report(
      'OpenFDA: topAdverseReactions(metformin)',
      'FAIL',
      top.error || `HTTP ${top.status}`,
    );
  }
}

// ────────────────────────────────────────────────────────
// 3. WHO ICD-11 — Disease classification
// ────────────────────────────────────────────────────────
async function testICD11() {
  console.log('\n── WHO ICD-11 ────────────────────────────────');

  const search = await fetchJSON(
    'https://id.who.int/icd/release/11/2024-01/mms/search?q=diabetes&flatResults=true&highlightingEnabled=false',
    { headers: { 'Accept-Language': 'en', 'API-Version': 'v2' } },
  );
  if (search.ok && search.data?.destinationEntities?.length > 0) {
    report(
      'ICD-11: searchConditions(diabetes)',
      'PASS',
      `${search.data.destinationEntities.length} results`,
    );
  } else if (search.status === 401 || search.status === 403) {
    report(
      'ICD-11: searchConditions(diabetes)',
      'WARN',
      `HTTP ${search.status} (auth required — will fallback to SNOMED)`,
    );
  } else {
    report(
      'ICD-11: searchConditions(diabetes)',
      'FAIL',
      search.error || `HTTP ${search.status}`,
    );
  }
}

// ────────────────────────────────────────────────────────
// 4. HAPI FHIR R4 — Public test server
// ────────────────────────────────────────────────────────
async function testHAPIFHIR() {
  console.log('\n── HAPI FHIR R4 ──────────────────────────────');

  const patients = await fetchJSON(
    'https://hapi.fhir.org/baseR4/Patient?name=smith&_count=3&_format=json',
  );
  if (patients.ok && patients.data?.entry?.length > 0) {
    report(
      'FHIR: searchPatients(smith)',
      'PASS',
      `${patients.data.entry.length} patients`,
    );
  } else {
    report(
      'FHIR: searchPatients(smith)',
      patients.status === 0 ? 'FAIL' : 'WARN',
      patients.error || `HTTP ${patients.status}`,
    );
  }

  const meds = await fetchJSON(
    'https://hapi.fhir.org/baseR4/Medication?code:text=aspirin&_count=3&_format=json',
  );
  if (meds.ok) {
    const count = meds.data?.entry?.length ?? 0;
    report(
      'FHIR: searchMedications(aspirin)',
      count > 0 ? 'PASS' : 'WARN',
      `${count} results`,
    );
  } else {
    report(
      'FHIR: searchMedications(aspirin)',
      'FAIL',
      meds.error || `HTTP ${meds.status}`,
    );
  }

  const obs = await fetchJSON(
    'https://hapi.fhir.org/baseR4/Observation?code=85354-9&_count=3&_sort=-date&_format=json',
  );
  if (obs.ok) {
    const count = obs.data?.entry?.length ?? 0;
    report(
      'FHIR: searchObservations(BP)',
      count > 0 ? 'PASS' : 'WARN',
      `${count} observations`,
    );
  } else {
    report(
      'FHIR: searchObservations(BP)',
      'FAIL',
      obs.error || `HTTP ${obs.status}`,
    );
  }
}

// ────────────────────────────────────────────────────────
// 5. CSIRO Ontoserver — SNOMED CT-AU
// ────────────────────────────────────────────────────────
async function testOntoserver() {
  console.log('\n── CSIRO Ontoserver (SNOMED CT-AU) ───────────');

  const lookup = await fetchJSON(
    'https://tx.dev.hl7.org.au/fhir/CodeSystem/$lookup?system=http://snomed.info/sct&code=73211009&_format=json',
  );
  if (lookup.ok && lookup.data?.parameter?.length > 0) {
    const display = lookup.data.parameter.find(
      (p) => p.name === 'display',
    )?.valueString;
    report('Ontoserver: lookupSNOMED(73211009)', 'PASS', display || 'resolved');
  } else {
    report(
      'Ontoserver: lookupSNOMED(73211009)',
      'FAIL',
      lookup.error || `HTTP ${lookup.status}`,
    );
  }

  const findings = await fetchJSON(
    'https://tx.dev.hl7.org.au/fhir/ValueSet/$expand?url=http://snomed.info/sct?fhir_vs=isa/404684003&count=5&filter=hypertension&_format=json',
  );
  if (findings.ok && findings.data?.expansion?.contains?.length > 0) {
    report(
      'Ontoserver: searchSNOMEDFindings(hypertension)',
      'PASS',
      `${findings.data.expansion.contains.length} findings`,
    );
  } else {
    report(
      'Ontoserver: searchSNOMEDFindings(hypertension)',
      'FAIL',
      findings.error || `HTTP ${findings.status}`,
    );
  }

  const amt = await fetchJSON(
    'https://tx.dev.hl7.org.au/fhir/ValueSet/$expand?url=http://snomed.info/sct?fhir_vs=isa/30425011000036101&count=5&filter=paracetamol&_format=json',
  );
  if (amt.ok && amt.data?.expansion?.contains?.length > 0) {
    report(
      'Ontoserver: searchAMTMedications(paracetamol)',
      'PASS',
      `${amt.data.expansion.contains.length} medications`,
    );
  } else {
    // Fallback: international medicinal product hierarchy
    const intl = await fetchJSON(
      'https://tx.dev.hl7.org.au/fhir/ValueSet/$expand?url=http://snomed.info/sct?fhir_vs=isa/763158003&count=5&filter=paracetamol&_format=json',
    );
    if (intl.ok && intl.data?.expansion?.contains?.length > 0) {
      report(
        'Ontoserver: searchAMTMedications(paracetamol)',
        'PASS',
        `${intl.data.expansion.contains.length} meds (intl fallback)`,
      );
    } else {
      report(
        'Ontoserver: searchAMTMedications(paracetamol)',
        'WARN',
        'AMT + intl both empty; dev server may lack data',
      );
    }
  }
}

// ────────────────────────────────────────────────────────
// 6. Internal API (backend via createanything.com)
// ────────────────────────────────────────────────────────
async function testInternalAPI() {
  console.log('\n── Internal Backend API ───────────────────────');
  const base =
    process.env.EXPO_PUBLIC_CREATE_API_URL ||
    process.env.EXPO_PUBLIC_BASE_URL ||
    'https://createanything.com';

  const endpoints = [
    { name: 'GET /api/residents', url: `${base}/api/residents` },
    {
      name: 'GET /api/alerts?status=open',
      url: `${base}/api/alerts?status=open`,
    },
    { name: 'GET /api/tasks?status=all', url: `${base}/api/tasks?status=all` },
    { name: 'GET /api/messages', url: `${base}/api/messages` },
  ];

  for (const ep of endpoints) {
    const res = await fetchJSON(ep.url);
    if (res.ok && Array.isArray(res.data)) {
      report(`Internal: ${ep.name}`, 'PASS', `${res.data.length} items`);
    } else if (res.ok) {
      report(
        `Internal: ${ep.name}`,
        'WARN',
        `HTTP ${res.status}, non-array response`,
      );
    } else if (res.status === 401 || res.status === 403) {
      report(
        `Internal: ${ep.name}`,
        'WARN',
        `HTTP ${res.status} (auth required — expected without JWT)`,
      );
    } else if (res.status === 429) {
      report(
        `Internal: ${ep.name}`,
        'WARN',
        `HTTP ${res.status} (rate-limited — expected without JWT)`,
      );
    } else {
      report(`Internal: ${ep.name}`, 'FAIL', res.error || `HTTP ${res.status}`);
    }
  }
}

// ────────────────────────────────────────────────────────
// Run all tests
// ────────────────────────────────────────────────────────
async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║     CareConnect — API Connection Test Suite          ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`  Timeout: ${TIMEOUT / 1000}s per request`);
  console.log(`  Date:    ${new Date().toISOString()}`);

  await testRxNorm();
  await testOpenFDA();
  await testICD11();
  await testHAPIFHIR();
  await testOntoserver();
  await testInternalAPI();

  // Summary
  const pass = results.filter((r) => r.result === 'PASS').length;
  const warn = results.filter((r) => r.result === 'WARN').length;
  const fail = results.filter((r) => r.result === 'FAIL').length;

  console.log('\n══════════════════════════════════════════════════════════');
  console.log(
    `  SUMMARY: ${pass} passed, ${warn} warnings, ${fail} failed  (${results.length} total)`,
  );
  console.log('══════════════════════════════════════════════════════════\n');

  process.exit(fail > 0 ? 1 : 0);
}

main();
