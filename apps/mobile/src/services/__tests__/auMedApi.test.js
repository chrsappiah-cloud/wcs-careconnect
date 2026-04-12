/**
 * Tests for auMedApi.js — Australian Medical API service layer
 *
 * These tests mock global fetch to verify:
 *  - Input validation (sanitizeQuery, empty/null guards)
 *  - Correct URL construction
 *  - Response parsing
 *  - Error handling (timeout, non-200, malformed JSON)
 *  - Fallback behaviour (ICD-11 → SNOMED, AMT → intl SNOMED)
 */

import {
  searchDrugs,
  getDrugByRxcui,
  checkDrugInteractions,
  suggestDrugSpelling,
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
} from '../auMedApi';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
global.fetch = mockFetch;

function okJSON(body) {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(body),
  });
}

function errorResponse(status, statusText = 'Error') {
  return Promise.resolve({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({}),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('exports AGED_CARE_CONDITIONS array with codes and displays', () => {
    expect(Array.isArray(AGED_CARE_CONDITIONS)).toBe(true);
    expect(AGED_CARE_CONDITIONS.length).toBeGreaterThan(5);
    expect(AGED_CARE_CONDITIONS[0]).toHaveProperty('code');
    expect(AGED_CARE_CONDITIONS[0]).toHaveProperty('display');
  });

  it('exports COMMON_MEDICATIONS array with rxcui and names', () => {
    expect(Array.isArray(COMMON_MEDICATIONS)).toBe(true);
    expect(COMMON_MEDICATIONS.length).toBeGreaterThan(5);
    expect(COMMON_MEDICATIONS[0]).toHaveProperty('rxcui');
    expect(COMMON_MEDICATIONS[0]).toHaveProperty('name');
  });
});

// ---------------------------------------------------------------------------
// Input validation (shared via sanitizeQuery)
// ---------------------------------------------------------------------------

describe('searchDrugs — input validation', () => {
  it('returns [] for empty string', async () => {
    expect(await searchDrugs('')).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns [] for null', async () => {
    expect(await searchDrugs(null)).toEqual([]);
  });

  it('returns [] for undefined', async () => {
    expect(await searchDrugs()).toEqual([]);
  });

  it('returns [] for whitespace-only', async () => {
    expect(await searchDrugs('   ')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// searchDrugs
// ---------------------------------------------------------------------------

describe('searchDrugs', () => {
  it('parses RxNorm response correctly', async () => {
    mockFetch.mockReturnValue(okJSON({
      drugGroup: {
        conceptGroup: [
          {
            tty: 'SBD',
            conceptProperties: [
              { rxcui: '123', name: 'Aspirin 325mg', synonym: 'ASA', tty: 'SBD' },
            ],
          },
        ],
      },
    }));

    const result = await searchDrugs('aspirin');
    expect(result).toEqual([
      { rxcui: '123', name: 'Aspirin 325mg', synonym: 'ASA', tty: 'SBD' },
    ]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain('rxnav.nlm.nih.gov');
    expect(mockFetch.mock.calls[0][0]).toContain('aspirin');
  });

  it('returns [] when groups are empty', async () => {
    mockFetch.mockReturnValue(okJSON({ drugGroup: { conceptGroup: [] } }));
    expect(await searchDrugs('xyz')).toEqual([]);
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockReturnValue(errorResponse(500, 'Server Error'));
    await expect(searchDrugs('aspirin')).rejects.toThrow('HTTP 500');
  });
});

// ---------------------------------------------------------------------------
// getDrugByRxcui
// ---------------------------------------------------------------------------

describe('getDrugByRxcui', () => {
  it('returns null for invalid rxcui', async () => {
    expect(await getDrugByRxcui(null)).toBeNull();
    expect(await getDrugByRxcui('')).toBeNull();
    expect(await getDrugByRxcui('abc')).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('parses allrelated response', async () => {
    mockFetch.mockReturnValue(okJSON({
      allRelatedGroup: {
        conceptGroup: [
          { tty: 'BN', conceptProperties: [{ name: 'Bayer' }] },
          { tty: 'IN', conceptProperties: [{ name: 'Aspirin' }] },
          { tty: 'DF', conceptProperties: [{ name: 'Oral Tablet' }] },
        ],
      },
    }));

    const result = await getDrugByRxcui('1191');
    expect(result.brandNames).toContain('Bayer');
    expect(result.ingredients).toContain('Aspirin');
    expect(result.doseForms).toContain('Oral Tablet');
  });
});

// ---------------------------------------------------------------------------
// checkDrugInteractions (OpenFDA-based)
// ---------------------------------------------------------------------------

describe('checkDrugInteractions', () => {
  it('returns [] for less than 2 drugs', async () => {
    expect(await checkDrugInteractions(['aspirin'])).toEqual([]);
    expect(await checkDrugInteractions([])).toEqual([]);
    expect(await checkDrugInteractions(null)).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('detects interaction when label mentions other drug', async () => {
    mockFetch.mockReturnValue(okJSON({
      results: [
        {
          drug_interactions: ['Concurrent use with warfarin may increase bleeding risk.'],
        },
      ],
    }));

    const result = await checkDrugInteractions(['aspirin', 'warfarin']);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].drugs).toContain('aspirin');
    expect(result[0].drugs).toContain('warfarin');
  });

  it('returns [] when no cross-mention found', async () => {
    mockFetch.mockReturnValue(okJSON({
      results: [{ drug_interactions: ['Take with food.'] }],
    }));

    const result = await checkDrugInteractions(['aspirin', 'warfarin']);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// suggestDrugSpelling
// ---------------------------------------------------------------------------

describe('suggestDrugSpelling', () => {
  it('returns suggestions list', async () => {
    mockFetch.mockReturnValue(okJSON({
      suggestionGroup: {
        suggestionList: { suggestion: ['aspirin', 'aspirin 325'] },
      },
    }));

    const result = await suggestDrugSpelling('asprin');
    expect(result).toEqual(['aspirin', 'aspirin 325']);
  });

  it('returns [] for empty query', async () => {
    expect(await suggestDrugSpelling('')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// searchAdverseEvents
// ---------------------------------------------------------------------------

describe('searchAdverseEvents', () => {
  it('returns [] for empty drug name', async () => {
    expect(await searchAdverseEvents('')).toEqual([]);
  });

  it('parses adverse events', async () => {
    mockFetch.mockReturnValue(okJSON({
      results: [{
        safetyreportid: 'RPT1',
        serious: '1',
        seriousnessdeath: '0',
        seriousnesslifethreatening: '1',
        seriousnesshospitalization: '0',
        seriousnessdisabling: '0',
        patient: {
          reaction: [{ reactionmeddrapt: 'Nausea' }],
          drug: [{ medicinalproduct: 'Aspirin', drugindication: 'Pain', drugcharacterization: '1' }],
        },
        receivedate: '20240101',
      }],
    }));

    const result = await searchAdverseEvents('aspirin');
    expect(result).toHaveLength(1);
    expect(result[0].safetyReportId).toBe('RPT1');
    expect(result[0].serious).toBe(true);
    expect(result[0].seriousnessDescription).toContain('Life-threatening');
    expect(result[0].reactions).toContain('Nausea');
    expect(result[0].drugs[0].name).toBe('Aspirin');
  });
});

// ---------------------------------------------------------------------------
// topAdverseReactions
// ---------------------------------------------------------------------------

describe('topAdverseReactions', () => {
  it('returns [] for empty drug name', async () => {
    expect(await topAdverseReactions('')).toEqual([]);
  });

  it('parses count data', async () => {
    mockFetch.mockReturnValue(okJSON({
      results: [
        { term: 'Nausea', count: 100 },
        { term: 'Headache', count: 50 },
      ],
    }));

    const result = await topAdverseReactions('aspirin');
    expect(result).toHaveLength(2);
    expect(result[0].reaction).toBe('Nausea');
    expect(result[0].count).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// searchConditions (ICD-11 with SNOMED fallback)
// ---------------------------------------------------------------------------

describe('searchConditions', () => {
  it('returns [] for empty query', async () => {
    expect(await searchConditions('')).toEqual([]);
  });

  it('parses ICD-11 response when available', async () => {
    mockFetch.mockReturnValue(okJSON({
      destinationEntities: [
        { id: '123', theCode: 'BA00', title: 'Hypertension', score: 0.9, chapter: '11' },
      ],
    }));

    const result = await searchConditions('hypertension');
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('ICD-11');
    expect(result[0].code).toBe('BA00');
    expect(result[0].title).toBe('Hypertension');
  });

  it('falls back to SNOMED when ICD-11 returns error', async () => {
    // First call (ICD-11) fails
    mockFetch.mockReturnValueOnce(errorResponse(401, 'Unauthorized'));
    // Second call (SNOMED fallback via expandValueSet)
    mockFetch.mockReturnValueOnce(okJSON({
      expansion: {
        contains: [
          { code: '38341003', display: 'Hypertension', system: 'http://snomed.info/sct' },
        ],
      },
    }));

    const result = await searchConditions('hypertension');
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('SNOMED-CT');
    expect(result[0].code).toBe('38341003');
  });
});

// ---------------------------------------------------------------------------
// FHIR searches
// ---------------------------------------------------------------------------

describe('searchFHIRPatients', () => {
  it('returns [] for empty name', async () => {
    expect(await searchFHIRPatients('')).toEqual([]);
  });

  it('parses FHIR Bundle', async () => {
    mockFetch.mockReturnValue(okJSON({
      entry: [{
        resource: {
          id: 'p1',
          name: [{ given: ['John'], family: 'Smith' }],
          gender: 'male',
          birthDate: '1950-01-01',
        },
      }],
    }));

    const result = await searchFHIRPatients('john');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('John Smith');
    expect(result[0].gender).toBe('male');
  });
});

describe('searchFHIRMedications', () => {
  it('returns [] for empty query', async () => {
    expect(await searchFHIRMedications('')).toEqual([]);
  });

  it('uses code:text parameter', async () => {
    mockFetch.mockReturnValue(okJSON({ entry: [] }));
    await searchFHIRMedications('aspirin');
    expect(mockFetch.mock.calls[0][0]).toContain('code:text=');
  });
});

describe('searchFHIRObservations', () => {
  it('returns [] for empty code', async () => {
    expect(await searchFHIRObservations('')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// SNOMED / Ontoserver
// ---------------------------------------------------------------------------

describe('lookupSNOMED', () => {
  it('returns null for invalid code', async () => {
    expect(await lookupSNOMED(null)).toBeNull();
    expect(await lookupSNOMED('')).toBeNull();
    expect(await lookupSNOMED('abc')).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('parses $lookup response', async () => {
    mockFetch.mockReturnValue(okJSON({
      parameter: [
        { name: 'display', valueString: "Alzheimer's disease" },
        { name: 'name', valueString: 'SNOMED CT' },
      ],
    }));

    const result = await lookupSNOMED('26929004');
    expect(result.display).toBe("Alzheimer's disease");
    expect(result.code).toBe('26929004');
  });
});

describe('expandValueSet', () => {
  it('returns [] for null valueSetUrl', async () => {
    expect(await expandValueSet(null)).toEqual([]);
  });

  it('parses expansion results', async () => {
    mockFetch.mockReturnValue(okJSON({
      expansion: {
        contains: [
          { code: '123', display: 'Test', system: 'http://snomed.info/sct' },
        ],
      },
    }));

    const result = await expandValueSet('http://example.com/vs', 'test');
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('123');
  });
});

describe('searchAMTMedications', () => {
  it('returns [] for empty query', async () => {
    expect(await searchAMTMedications('')).toEqual([]);
  });

  it('falls back to international SNOMED when AMT returns empty', async () => {
    // AMT call — empty
    mockFetch.mockReturnValueOnce(okJSON({ expansion: { contains: [] } }));
    // International SNOMED fallback
    mockFetch.mockReturnValueOnce(okJSON({
      expansion: {
        contains: [
          { code: '999', display: 'Aspirin', system: 'http://snomed.info/sct' },
        ],
      },
    }));

    const result = await searchAMTMedications('aspirin');
    expect(result).toHaveLength(1);
    expect(result[0].display).toBe('Aspirin');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('error handling', () => {
  it('throws on HTTP 500', async () => {
    mockFetch.mockReturnValue(errorResponse(500));
    await expect(searchDrugs('aspirin')).rejects.toThrow('HTTP 500');
  });

  it('throws timeout error when fetch is aborted', async () => {
    mockFetch.mockImplementation(() => {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });
    await expect(searchDrugs('aspirin')).rejects.toThrow('Request timed out');
  });
});
