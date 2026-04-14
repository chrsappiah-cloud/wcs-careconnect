// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
/**
 * Advanced auMedApi tests — input validation, edge cases, error handling,
 * timeout behaviour, and data transformation for all 14 API functions.
 */
import {
  searchDrugs,
  getDrugByRxcui,
  suggestDrugSpelling,
  checkDrugInteractions,
  searchAdverseEvents,
  topAdverseReactions,
  searchConditions,
  searchFHIRPatients,
  searchFHIRMedications,
  searchFHIRObservations,
  lookupSNOMED,
  expandValueSet,
  searchSNOMEDFindings,
  searchAMTMedications,
  AGED_CARE_CONDITIONS,
  COMMON_MEDICATIONS,
} from '../../services/auMedApi';

// ─── Setup ─────────────────────────────────────────────────
beforeEach(() => {
  jest.restoreAllMocks();
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

function mockFetchJSON(data, opts = {}) {
  global.fetch.mockResolvedValue({
    ok: opts.ok !== undefined ? opts.ok : true,
    status: opts.status || 200,
    statusText: opts.statusText || 'OK',
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(error) {
  global.fetch.mockRejectedValue(error);
}

function mockFetchHTTPError(status, statusText = 'Error') {
  global.fetch.mockResolvedValue({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({}),
  });
}

// ─── Input Sanitization ────────────────────────────────────
describe('Input sanitization', () => {
  it('searchDrugs returns [] for empty string', async () => {
    expect(await searchDrugs('')).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('searchDrugs returns [] for null', async () => {
    expect(await searchDrugs(null)).toEqual([]);
  });

  it('searchDrugs returns [] for undefined', async () => {
    expect(await searchDrugs(undefined)).toEqual([]);
  });

  it('searchDrugs returns [] for whitespace-only input', async () => {
    expect(await searchDrugs('   ')).toEqual([]);
  });

  it('searchDrugs trims input before sending', async () => {
    mockFetchJSON({ drugGroup: { conceptGroup: [] } });
    await searchDrugs('  aspirin  ');
    expect(global.fetch).toHaveBeenCalled();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('aspirin');
    expect(url).not.toContain('%20%20');
  });

  it('searchDrugs truncates input longer than 200 chars', async () => {
    mockFetchJSON({ drugGroup: { conceptGroup: [] } });
    const longQuery = 'a'.repeat(300);
    await searchDrugs(longQuery);
    const url = global.fetch.mock.calls[0][0];
    // URL-decoded name param should be at most 200 chars
    const nameParam = decodeURIComponent(url.split('name=')[1]);
    expect(nameParam.length).toBeLessThanOrEqual(200);
  });

  it('getDrugByRxcui returns null for invalid rxcui', async () => {
    expect(await getDrugByRxcui('')).toBeNull();
    expect(await getDrugByRxcui(null)).toBeNull();
    expect(await getDrugByRxcui('abc')).toBeNull();
    expect(await getDrugByRxcui(undefined)).toBeNull();
  });

  it('lookupSNOMED returns null for invalid code', async () => {
    expect(await lookupSNOMED('')).toBeNull();
    expect(await lookupSNOMED(null)).toBeNull();
    expect(await lookupSNOMED('abc')).toBeNull();
  });

  it('expandValueSet returns [] when no URL provided', async () => {
    expect(await expandValueSet('')).toEqual([]);
    expect(await expandValueSet(null)).toEqual([]);
  });
});

// ─── searchDrugs response parsing ──────────────────────────
describe('searchDrugs response parsing', () => {
  it('parses RxNorm conceptGroup response correctly', async () => {
    mockFetchJSON({
      drugGroup: {
        conceptGroup: [
          {
            tty: 'SBD',
            conceptProperties: [
              { rxcui: '1191', name: 'Aspirin', synonym: 'ASA', tty: 'SBD' },
            ],
          },
        ],
      },
    });
    const results = await searchDrugs('aspirin');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      rxcui: '1191',
      name: 'Aspirin',
      synonym: 'ASA',
      tty: 'SBD',
    });
  });

  it('handles empty conceptGroup', async () => {
    mockFetchJSON({ drugGroup: { conceptGroup: [] } });
    expect(await searchDrugs('xyz')).toEqual([]);
  });

  it('handles missing conceptProperties gracefully', async () => {
    mockFetchJSON({
      drugGroup: {
        conceptGroup: [{ tty: 'SBD' }], // no conceptProperties
      },
    });
    expect(await searchDrugs('test')).toEqual([]);
  });

  it('handles null drugGroup gracefully', async () => {
    mockFetchJSON({});
    expect(await searchDrugs('test')).toEqual([]);
  });
});

// ─── getDrugByRxcui ────────────────────────────────────────
describe('getDrugByRxcui response parsing', () => {
  it('parses brand names, ingredients, and dose forms', async () => {
    mockFetchJSON({
      allRelatedGroup: {
        conceptGroup: [
          { tty: 'BN', conceptProperties: [{ name: 'Tylenol' }] },
          { tty: 'IN', conceptProperties: [{ name: 'Acetaminophen' }] },
          { tty: 'DF', conceptProperties: [{ name: 'Tablet' }] },
        ],
      },
    });
    const info = await getDrugByRxcui('161');
    expect(info.rxcui).toBe('161');
    expect(info.brandNames).toContain('Tylenol');
    expect(info.ingredients).toContain('Acetaminophen');
    expect(info.doseForms).toContain('Tablet');
  });

  it('returns empty arrays when no related groups', async () => {
    mockFetchJSON({ allRelatedGroup: { conceptGroup: [] } });
    const info = await getDrugByRxcui('161');
    expect(info.brandNames).toEqual([]);
    expect(info.ingredients).toEqual([]);
    expect(info.doseForms).toEqual([]);
  });
});

// ─── checkDrugInteractions ─────────────────────────────────
describe('checkDrugInteractions', () => {
  it('returns [] when fewer than 2 drugs provided', async () => {
    expect(await checkDrugInteractions([])).toEqual([]);
    expect(await checkDrugInteractions(['aspirin'])).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns [] for non-array input', async () => {
    expect(await checkDrugInteractions('aspirin')).toEqual([]);
    expect(await checkDrugInteractions(null)).toEqual([]);
  });

  it('detects interaction when drug name appears in interaction text', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [
            {
              drug_interactions: [
                'Warfarin may increase the anticoagulant effect when taken with Aspirin.',
              ],
            },
          ],
        }),
    });
    const results = await checkDrugInteractions(['aspirin', 'warfarin']);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].drugs).toEqual(
      expect.arrayContaining(['aspirin', 'warfarin']),
    );
  });

  it('returns [] when no interaction text mentions other drugs', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [{ drug_interactions: ['No known interactions.'] }],
        }),
    });
    const results = await checkDrugInteractions(['aspirin', 'metformin']);
    expect(results).toEqual([]);
  });

  it('limits drug pairs to max 10 drugs', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });
    const drugs = Array.from({ length: 15 }, (_, i) => `drug${i}`);
    await checkDrugInteractions(drugs);
    // Should only make fetch calls for first 10 drugs
    expect(global.fetch.mock.calls.length).toBeLessThanOrEqual(10);
  });

  it('continues when individual drug lookup fails', async () => {
    let callCount = 0;
    global.fetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('Network error'));
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });
    });
    // Should not throw
    const results = await checkDrugInteractions(['drug1', 'drug2', 'drug3']);
    expect(results).toEqual([]);
  });
});

// ─── searchAdverseEvents ───────────────────────────────────
describe('searchAdverseEvents', () => {
  it('returns [] for empty query', async () => {
    expect(await searchAdverseEvents('')).toEqual([]);
  });

  it('clamps limit to max 100', async () => {
    mockFetchJSON({ results: [] });
    await searchAdverseEvents('aspirin', 500);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('limit=100');
  });

  it('defaults limit to 5 for invalid values', async () => {
    mockFetchJSON({ results: [] });
    await searchAdverseEvents('aspirin', -1);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('limit=5');
  });

  it('parses adverse event results correctly', async () => {
    mockFetchJSON({
      results: [
        {
          safetyreportid: 'RPT001',
          serious: '1',
          seriousnessdeath: '0',
          seriousnesslifethreatening: '1',
          seriousnesshospitalization: '0',
          seriousnessdisabling: '0',
          patient: {
            reaction: [{ reactionmeddrapt: 'Nausea' }],
            drug: [
              {
                medicinalproduct: 'ASPIRIN',
                drugindication: 'Pain',
                drugcharacterization: '1',
              },
            ],
          },
          receivedate: '20240101',
        },
      ],
    });
    const results = await searchAdverseEvents('aspirin');
    expect(results).toHaveLength(1);
    expect(results[0].safetyReportId).toBe('RPT001');
    expect(results[0].serious).toBe(true);
    expect(results[0].seriousnessDescription).toContain('Life-threatening');
    expect(results[0].reactions).toContain('Nausea');
    expect(results[0].drugs[0].name).toBe('ASPIRIN');
  });
});

// ─── topAdverseReactions ───────────────────────────────────
describe('topAdverseReactions', () => {
  it('returns [] for empty query', async () => {
    expect(await topAdverseReactions('')).toEqual([]);
  });

  it('parses count results correctly', async () => {
    mockFetchJSON({
      results: [
        { term: 'Nausea', count: 1500 },
        { term: 'Headache', count: 1200 },
      ],
    });
    const results = await topAdverseReactions('aspirin', 2);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ reaction: 'Nausea', count: 1500 });
    expect(results[1]).toEqual({ reaction: 'Headache', count: 1200 });
  });

  it('clamps limit to max 100', async () => {
    mockFetchJSON({ results: [] });
    await topAdverseReactions('aspirin', 999);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('limit=100');
  });
});

// ─── suggestDrugSpelling ───────────────────────────────────
describe('suggestDrugSpelling', () => {
  it('returns [] for empty query', async () => {
    expect(await suggestDrugSpelling('')).toEqual([]);
  });

  it('returns suggestion list', async () => {
    mockFetchJSON({
      suggestionGroup: {
        suggestionList: { suggestion: ['aspirin', 'Aspirin 81 MG'] },
      },
    });
    const results = await suggestDrugSpelling('asiprin');
    expect(results).toContain('aspirin');
  });

  it('returns [] when no suggestions', async () => {
    mockFetchJSON({ suggestionGroup: {} });
    expect(await suggestDrugSpelling('xyzabc')).toEqual([]);
  });
});

// ─── searchConditions (ICD-11 + SNOMED fallback) ───────────
describe('searchConditions', () => {
  it('returns [] for empty query', async () => {
    expect(await searchConditions('')).toEqual([]);
  });

  it('parses ICD-11 results with source=ICD-11', async () => {
    mockFetchJSON({
      destinationEntities: [
        {
          id: '1234',
          theCode: 'BA00',
          title: 'Hypertension',
          score: 0.95,
          chapter: '11',
        },
      ],
    });
    const results = await searchConditions('hypertension');
    expect(results).toHaveLength(1);
    expect(results[0].source).toBe('ICD-11');
    expect(results[0].code).toBe('BA00');
    expect(results[0].title).toBe('Hypertension');
  });

  it('falls back to SNOMED when ICD-11 throws', async () => {
    // First call (ICD-11) fails, second call (SNOMED) succeeds
    let callCount = 0;
    global.fetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            expansion: {
              contains: [
                {
                  code: '38341003',
                  display: 'Hypertension',
                  system: 'http://snomed.info/sct',
                },
              ],
            },
          }),
      });
    });
    const results = await searchConditions('hypertension');
    expect(results).toHaveLength(1);
    expect(results[0].source).toBe('SNOMED-CT');
    expect(results[0].code).toBe('38341003');
  });
});

// ─── FHIR functions ────────────────────────────────────────
describe('searchFHIRPatients', () => {
  it('returns [] for empty query', async () => {
    expect(await searchFHIRPatients('')).toEqual([]);
  });

  it('parses FHIR Patient bundle', async () => {
    mockFetchJSON({
      entry: [
        {
          resource: {
            id: 'p1',
            name: [{ family: 'Smith', given: ['John'] }],
            gender: 'male',
            birthDate: '1945-01-01',
          },
        },
      ],
    });
    const results = await searchFHIRPatients('Smith');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('John Smith');
    expect(results[0].gender).toBe('male');
  });

  it('handles missing name gracefully', async () => {
    mockFetchJSON({
      entry: [{ resource: { id: 'p2', gender: 'female' } }],
    });
    const results = await searchFHIRPatients('test');
    expect(results[0].name).toBe('Unknown');
  });
});

describe('searchFHIRMedications', () => {
  it('returns [] for empty query', async () => {
    expect(await searchFHIRMedications('')).toEqual([]);
  });

  it('parses FHIR Medication bundle', async () => {
    mockFetchJSON({
      entry: [
        {
          resource: {
            id: 'm1',
            code: { coding: [{ display: 'Aspirin' }], text: 'Aspirin' },
            form: { text: 'Tablet' },
          },
        },
      ],
    });
    const results = await searchFHIRMedications('aspirin');
    expect(results).toHaveLength(1);
    expect(results[0].code).toBe('Aspirin');
    expect(results[0].form).toBe('Tablet');
  });
});

describe('searchFHIRObservations', () => {
  it('returns [] for empty code', async () => {
    expect(await searchFHIRObservations('')).toEqual([]);
  });

  it('clamps count to max 100', async () => {
    mockFetchJSON({ entry: [] });
    await searchFHIRObservations('85354-9', 500);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('_count=100');
  });

  it('parses Observation values correctly', async () => {
    mockFetchJSON({
      entry: [
        {
          resource: {
            id: 'o1',
            code: { coding: [{ display: 'Blood glucose' }] },
            valueQuantity: { value: 120, unit: 'mg/dL' },
            effectiveDateTime: '2024-01-01',
            status: 'final',
          },
        },
      ],
    });
    const results = await searchFHIRObservations('15074-8');
    expect(results[0].value).toBe(120);
    expect(results[0].unit).toBe('mg/dL');
    expect(results[0].status).toBe('final');
  });
});

// ─── SNOMED / Ontoserver ───────────────────────────────────
describe('lookupSNOMED', () => {
  it('parses lookup parameters correctly', async () => {
    mockFetchJSON({
      parameter: [
        { name: 'display', valueString: "Alzheimer's disease" },
        { name: 'name', valueString: 'SNOMED CT' },
      ],
    });
    const result = await lookupSNOMED('26929004');
    expect(result.code).toBe('26929004');
    expect(result.display).toBe("Alzheimer's disease");
    expect(result.codeSystem).toBe('SNOMED CT');
  });

  it('validates code is numeric string', async () => {
    expect(await lookupSNOMED('abc')).toBeNull();
    expect(await lookupSNOMED('12.34')).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('expandValueSet', () => {
  it('builds correct URL with filter and count', async () => {
    mockFetchJSON({ expansion: { contains: [] } });
    await expandValueSet('http://example.com/vs', 'diabetes', 20);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain(encodeURIComponent('http://example.com/vs'));
    expect(url).toContain('filter=diabetes');
    expect(url).toContain('count=20');
  });

  it('omits filter param when filter is empty', async () => {
    mockFetchJSON({ expansion: { contains: [] } });
    await expandValueSet('http://example.com/vs');
    const url = global.fetch.mock.calls[0][0];
    expect(url).not.toContain('filter=');
  });
});

describe('searchSNOMEDFindings', () => {
  it('returns [] for empty query', async () => {
    expect(await searchSNOMEDFindings('')).toEqual([]);
  });

  it('calls expandValueSet with clinical-finding hierarchy', async () => {
    mockFetchJSON({
      expansion: {
        contains: [
          { code: '73211009', display: 'Diabetes', system: 'http://snomed.info/sct' },
        ],
      },
    });
    const results = await searchSNOMEDFindings('diabetes');
    expect(results).toHaveLength(1);
    expect(results[0].code).toBe('73211009');
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('404684003'); // clinical finding hierarchy
  });
});

describe('searchAMTMedications', () => {
  it('returns [] for empty query', async () => {
    expect(await searchAMTMedications('')).toEqual([]);
  });

  it('returns AMT results when available', async () => {
    mockFetchJSON({
      expansion: {
        contains: [
          { code: '12345', display: 'Paracetamol', system: 'http://snomed.info/sct' },
        ],
      },
    });
    const results = await searchAMTMedications('paracetamol');
    expect(results).toHaveLength(1);
  });

  it('falls back to international SNOMED when AMT is empty', async () => {
    let callCount = 0;
    global.fetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // AMT returns empty
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ expansion: { contains: [] } }),
        });
      }
      // International fallback returns results
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            expansion: {
              contains: [{ code: '99999', display: 'TestDrug', system: 'http://snomed.info/sct' }],
            },
          }),
      });
    });
    const results = await searchAMTMedications('testdrug');
    expect(results).toHaveLength(1);
    expect(results[0].code).toBe('99999');
    expect(callCount).toBe(2); // AMT + fallback
  });
});

// ─── HTTP Error Handling ───────────────────────────────────
describe('HTTP error handling', () => {
  it('searchDrugs throws on HTTP error', async () => {
    mockFetchHTTPError(500, 'Internal Server Error');
    await expect(searchDrugs('aspirin')).rejects.toThrow('HTTP 500');
  });

  it('getDrugByRxcui throws on HTTP error', async () => {
    mockFetchHTTPError(404, 'Not Found');
    await expect(getDrugByRxcui('1191')).rejects.toThrow('HTTP 404');
  });

  it('searchFHIRPatients throws on HTTP error', async () => {
    mockFetchHTTPError(503, 'Service Unavailable');
    await expect(searchFHIRPatients('Smith')).rejects.toThrow('HTTP 503');
  });

  it('lookupSNOMED throws on HTTP error', async () => {
    mockFetchHTTPError(500, 'Error');
    await expect(lookupSNOMED('26929004')).rejects.toThrow('HTTP 500');
  });
});

// ─── Timeout / Abort Handling ──────────────────────────────
describe('Timeout handling', () => {
  it('searchDrugs rejects with timeout message on abort', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    global.fetch.mockRejectedValue(abortError);
    await expect(searchDrugs('aspirin')).rejects.toThrow('Request timed out');
  });

  it('topAdverseReactions rejects with timeout message on abort', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    global.fetch.mockRejectedValue(abortError);
    await expect(topAdverseReactions('aspirin')).rejects.toThrow('Request timed out');
  });
});

// ─── Constants Validation ──────────────────────────────────
describe('Constants deep validation', () => {
  it('AGED_CARE_CONDITIONS has at least 15 items (ICD-11 disease database)', () => {
    expect(AGED_CARE_CONDITIONS.length).toBeGreaterThanOrEqual(15);
  });

  it('each condition has a valid SNOMED code and display name', () => {
    AGED_CARE_CONDITIONS.forEach((c) => {
      expect(c.code).toMatch(/^\d+$/);
      expect(typeof c.display).toBe('string');
      expect(c.display.length).toBeGreaterThan(0);
    });
  });

  it('COMMON_MEDICATIONS has 12 items', () => {
    expect(COMMON_MEDICATIONS).toHaveLength(12);
  });

  it('each medication has a valid RxCUI and name', () => {
    COMMON_MEDICATIONS.forEach((m) => {
      expect(m.rxcui).toMatch(/^\d+$/);
      expect(typeof m.name).toBe('string');
      expect(m.name.length).toBeGreaterThan(0);
    });
  });

  it('no duplicate SNOMED codes in AGED_CARE_CONDITIONS', () => {
    const codes = AGED_CARE_CONDITIONS.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('no duplicate RxCUI codes in COMMON_MEDICATIONS', () => {
    const ids = COMMON_MEDICATIONS.map((m) => m.rxcui);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
