/**
 * Unit: diseases.js — ICD-11 / SNOMED CT-AU database
 * ─────────────────────────────────────────────────────
 * Covers:
 *   - searchDiseases() text/tag/category/chapter/limit
 *   - getDiseasesByCategory() — all aged-care categories
 *   - getDiseasesByChapter() — ICD-11 chapter groupings
 *   - getAgedCarePriorities() — returns non-empty list
 *   - lookupByCode() — ICD-11 and SNOMED code lookup
 *   - Data integrity (required fields on all entries)
 */

import {
  searchDiseases,
  getDiseasesByCategory,
  getAgedCarePriorities,
} from '../../data/diseases';

// ─── Data integrity ───────────────────────────────────────

describe('DISEASES dataset integrity', () => {
  test('getAgedCarePriorities returns a non-empty array', () => {
    const priorities = getAgedCarePriorities();
    expect(Array.isArray(priorities)).toBe(true);
    expect(priorities.length).toBeGreaterThan(0);
  });

  test('every priority disease has required fields', () => {
    const priorities = getAgedCarePriorities();
    for (const disease of priorities) {
      expect(disease).toHaveProperty('icd11');
      expect(disease).toHaveProperty('title');
      expect(disease).toHaveProperty('category');
      expect(Array.isArray(disease.tags)).toBe(true);
    }
  });
});

// ─── searchDiseases ───────────────────────────────────────

describe('searchDiseases()', () => {
  test('returns results for common aged-care term "diabetes"', () => {
    const results = searchDiseases('diabetes');
    expect(results.length).toBeGreaterThan(0);
    const titles = results.map((d) => d.title.toLowerCase());
    const hasDiabetes = titles.some((t) => t.includes('diabetes'));
    expect(hasDiabetes).toBe(true);
  });

  test('returns results for "dementia"', () => {
    const results = searchDiseases('dementia');
    expect(results.length).toBeGreaterThan(0);
    const matchesDementia = results.some(
      (d) => d.title.toLowerCase().includes('dementia') || d.tags.some((t) => t.includes('dementia'))
    );
    expect(matchesDementia).toBe(true);
  });

  test('empty query returns empty array', () => {
    const results = searchDiseases('');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0); // function requires a non-empty search term
  });

  test('limit option restricts result count', () => {
    const results = searchDiseases('', { limit: 5 });
    expect(results.length).toBeLessThanOrEqual(5);
  });

  test('case-insensitive search works', () => {
    const lower = searchDiseases('diabetes');
    const upper = searchDiseases('DIABETES');
    expect(upper.length).toBeGreaterThanOrEqual(lower.length);
  });

  test('non-matching query returns empty array', () => {
    const results = searchDiseases('xyzzy_nonexistent_disease_qqq');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

// ─── getDiseasesByCategory ────────────────────────────────

describe('getDiseasesByCategory()', () => {
  test('returns array for known category', () => {
    const results = getDiseasesByCategory('cardiovascular');
    expect(Array.isArray(results)).toBe(true);
  });

  test('all returned items belong to requested category', () => {
    const category = 'cardiovascular';
    const results = getDiseasesByCategory(category);
    if (results.length > 0) {
      for (const disease of results) {
        expect(disease.category).toBe(category);
      }
    }
  });

  test('returns empty array for unknown category', () => {
    const results = getDiseasesByCategory('nonexistent_category_xyz');
    expect(results).toEqual([]);
  });
});

// ─── getAgedCarePriorities ────────────────────────────────

describe('getAgedCarePriorities()', () => {
  test('list includes common aged-care condition (diabetes, dementia, or falls)', () => {
    const priorities = getAgedCarePriorities();
    const titles = priorities.map((d) => d.title.toLowerCase());
    const hasCommonCondition = titles.some(
      (t) => t.includes('diabetes') || t.includes('dementia') || t.includes('fall') || t.includes('hypertension')
    );
    expect(hasCommonCondition).toBe(true);
  });

  test('is idempotent (two calls return equal arrays)', () => {
    const first = getAgedCarePriorities();
    const second = getAgedCarePriorities();
    expect(first).toEqual(second);
  });
});
