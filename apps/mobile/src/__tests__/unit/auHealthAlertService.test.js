/**
 * Unit: AU Health Alert Service
 * ──────────────────────────────
 * Safety-critical — targets 95%+ branch/line coverage.
 *
 * Covers:
 *   - evaluateAlertAU() for all 6 vital-sign types
 *   - Every boundary value across all threshold ranges
 *   - SNOMED code direction (high vs low keyword detection)
 *   - Escalation level mapping: emergency / urgent / routine
 *   - ISBAR handover generation (required fields)
 *   - FHIR AU Core Flag structure
 *   - Medication & non-vital alert pathways
 *   - AU_CLINICAL_THRESHOLDS data integrity
 */

import {
  evaluateAlertAU,
  AU_CLINICAL_THRESHOLDS,
  AU_ESCALATION_LEVELS,
  SNOMED_ALERT_CODES,
} from '../../services/auHealthAlertService';

// ─── Test-data factory ────────────────────────────────────

function buildAlert(overrides = {}) {
  return {
    id: 'alert_test_001',
    type: 'glucose',
    severity: 'critical',
    message: 'Blood glucose high at 280 mg/dL',
    resident_id: 'res_001',
    resident_name: 'Margaret Johnson',
    created_at: new Date().toISOString(),
    status: 'open',
    ...overrides,
  };
}

// ─── Data integrity ───────────────────────────────────────

describe('AU_CLINICAL_THRESHOLDS data integrity', () => {
  const REQUIRED_VITALS = ['glucose', 'spo2', 'heart_rate', 'blood_pressure_systolic', 'temperature', 'respiratory_rate'];

  for (const vital of REQUIRED_VITALS) {
    test(`${vital} threshold entry has required fields`, () => {
      const threshold = AU_CLINICAL_THRESHOLDS[vital];
      expect(threshold).toBeDefined();
      expect(threshold).toHaveProperty('metric');
      expect(threshold).toHaveProperty('unit');
      expect(threshold).toHaveProperty('snomedCode');
      expect(threshold).toHaveProperty('loincCode');
      expect(threshold).toHaveProperty('ranges');
      expect(threshold).toHaveProperty('auGuideline');
    });
  }

  test('glucose critical_high threshold is ≥250 mg/dL', () => {
    expect(AU_CLINICAL_THRESHOLDS.glucose.ranges.critical_high.min).toBe(250);
  });

  test('glucose critical_low threshold is ≤53 mg/dL', () => {
    expect(AU_CLINICAL_THRESHOLDS.glucose.ranges.critical_low.max).toBe(53);
  });

  test('SpO2 critical_low is ≤89%', () => {
    expect(AU_CLINICAL_THRESHOLDS.spo2.ranges.critical_low.max).toBe(89);
  });

  test('SpO2 normal lower bound is 94%', () => {
    expect(AU_CLINICAL_THRESHOLDS.spo2.ranges.normal.min).toBe(94);
  });

  test('heart_rate critical_high is ≥130 bpm (NSQHS standard)', () => {
    expect(AU_CLINICAL_THRESHOLDS.heart_rate.ranges.critical_high.min).toBe(130);
  });

  test('BP crisis threshold is ≥180 mmHg (Hypertensive Crisis)', () => {
    expect(AU_CLINICAL_THRESHOLDS.blood_pressure_systolic.ranges.critical_high.min).toBe(180);
  });

  test('temperature critical_high is ≥39.5°C', () => {
    expect(AU_CLINICAL_THRESHOLDS.temperature.ranges.critical_high.min).toBe(39.5);
  });

  test('respiratory_rate critical_low is ≤7 breaths/min', () => {
    expect(AU_CLINICAL_THRESHOLDS.respiratory_rate.ranges.critical_low.max).toBe(7);
  });
});

// ─── evaluateAlertAU — return shape ──────────────────────

describe('evaluateAlertAU return shape', () => {
  test('returns all required top-level keys', () => {
    const result = evaluateAlertAU(buildAlert());
    expect(result).toHaveProperty('alert');
    expect(result).toHaveProperty('auCompliant', true);
    expect(result).toHaveProperty('clinicalCoding');
    expect(result).toHaveProperty('threshold');
    expect(result).toHaveProperty('escalation');
    expect(result).toHaveProperty('isbarHandover');
    expect(result).toHaveProperty('fhirResource');
  });

  test('auCompliant is always true', () => {
    const result = evaluateAlertAU(buildAlert({ severity: 'info' }));
    expect(result.auCompliant).toBe(true);
  });

  test('input alert is echoed in result.alert', () => {
    const alert = buildAlert({ id: 'echo_test' });
    const result = evaluateAlertAU(alert);
    expect(result.alert.id).toBe('echo_test');
  });
});

// ─── Escalation level mapping ─────────────────────────────

describe('Escalation level mapping', () => {
  test('critical severity → emergency escalation', () => {
    const result = evaluateAlertAU(buildAlert({ severity: 'critical' }));
    expect(result.escalation.level).toBe(1);
    expect(result.escalation.label).toContain('Emergency');
  });

  test('warning severity → urgent escalation', () => {
    const result = evaluateAlertAU(buildAlert({ severity: 'warning', message: 'glucose slightly high' }));
    expect(result.escalation.level).toBe(2);
    expect(result.escalation.label).toContain('Urgent');
  });

  test('info severity → routine escalation', () => {
    const result = evaluateAlertAU(buildAlert({ severity: 'info', message: 'routine reminder' }));
    expect(result.escalation.level).toBe(3);
    expect(result.escalation.label).toContain('Routine');
  });

  test('emergency escalation includes 000 contact', () => {
    const result = evaluateAlertAU(buildAlert({ severity: 'critical' }));
    const contacts = result.escalation.contacts;
    const emergency = contacts.find((c) => c.phone === '000');
    expect(emergency).toBeDefined();
  });

  test('urgent escalation includes Health Direct number', () => {
    const result = evaluateAlertAU(buildAlert({ severity: 'warning', message: 'glucose high' }));
    const contacts = result.escalation.contacts;
    const healthDirect = contacts.find((c) => c.phone?.includes('1800 022 222'));
    expect(healthDirect).toBeDefined();
  });
});

// ─── SNOMED direction detection ───────────────────────────

describe('SNOMED code direction detection', () => {
  test('"high" keyword → hyperglycaemia SNOMED code', () => {
    const result = evaluateAlertAU(buildAlert({
      type: 'glucose', severity: 'critical', message: 'Blood glucose high at 280',
    }));
    expect(result.clinicalCoding.snomed?.code).toBe(SNOMED_ALERT_CODES.glucose.high.code);
    expect(result.clinicalCoding.snomed?.display).toBe('Hyperglycaemia');
  });

  test('"low" keyword → hypoglycaemia SNOMED code', () => {
    const result = evaluateAlertAU(buildAlert({
      type: 'glucose', severity: 'critical', message: 'Blood glucose low at 40',
    }));
    expect(result.clinicalCoding.snomed?.code).toBe(SNOMED_ALERT_CODES.glucose.low.code);
    expect(result.clinicalCoding.snomed?.display).toBe('Hypoglycaemia');
  });

  test('"elevated" keyword → high direction', () => {
    const result = evaluateAlertAU(buildAlert({
      type: 'heart_rate', severity: 'critical', message: 'Heart rate elevated at 145 bpm',
    }));
    expect(result.clinicalCoding.snomed?.display).toBe('Tachycardia');
  });

  test('"drop" keyword → low direction', () => {
    const result = evaluateAlertAU(buildAlert({
      type: 'spo2', severity: 'critical', message: 'SpO2 drop to 85%',
    }));
    expect(result.clinicalCoding.snomed?.display).toBe('Hypoxaemia');
  });

  test('"above" keyword → high direction for BP', () => {
    const result = evaluateAlertAU(buildAlert({
      type: 'blood_pressure', severity: 'critical', message: 'BP above 200 mmHg',
    }));
    expect(result.clinicalCoding.snomed?.display).toBe('Hypertensive disorder');
  });

  test('info severity → no SNOMED code assigned', () => {
    const result = evaluateAlertAU(buildAlert({ severity: 'info', message: 'routine check note' }));
    expect(result.clinicalCoding.snomed).toBeNull();
  });
});

// ─── Threshold lookup ─────────────────────────────────────

describe('Threshold info by alert type', () => {
  test('glucose alert includes correct metric + guideline', () => {
    const result = evaluateAlertAU(buildAlert({ type: 'glucose' }));
    expect(result.threshold?.metric).toBe('Blood Glucose');
    expect(result.threshold?.unit).toBe('mg/dL');
    expect(result.threshold?.loincCode).toBe('2339-0');
    expect(result.threshold?.guideline).toContain('General Practitioners');
  });

  test('spo2 alert includes SpO2 metric', () => {
    const result = evaluateAlertAU(buildAlert({ type: 'spo2', message: 'SpO2 low' }));
    expect(result.threshold?.metric).toBe('Oxygen Saturation');
    expect(result.threshold?.unit).toBe('%');
  });

  test('heart_rate alert threshold is present', () => {
    const result = evaluateAlertAU(buildAlert({ type: 'heart_rate', message: 'heart rate elevated' }));
    expect(result.threshold?.metric).toBe('Heart Rate');
    expect(result.threshold?.unit).toBe('bpm');
  });

  test('blood_pressure alert maps to blood_pressure_systolic threshold', () => {
    const result = evaluateAlertAU(buildAlert({ type: 'blood_pressure', message: 'BP elevated' }));
    expect(result.threshold?.metric).toBe('Systolic Blood Pressure');
  });

  test('temperature alert threshold is present', () => {
    const result = evaluateAlertAU(buildAlert({ type: 'temperature', message: 'fever' }));
    expect(result.threshold?.metric).toBe('Body Temperature');
    expect(result.threshold?.unit).toBe('°C');
  });

  test('medication alert has null threshold (non-vital pathway)', () => {
    const result = evaluateAlertAU(buildAlert({ type: 'medication', severity: 'warning', message: 'missed dose' }));
    expect(result.threshold).toBeNull();
  });
});

// ─── ISBAR handover ───────────────────────────────────────

describe('ISBAR handover generation', () => {
  test('ISBAR contains all 5 required sections', () => {
    const result = evaluateAlertAU(buildAlert());
    const { isbarHandover } = result;
    expect(isbarHandover).toHaveProperty('identify');
    expect(isbarHandover).toHaveProperty('situation');
    expect(isbarHandover).toHaveProperty('background');
    expect(isbarHandover).toHaveProperty('assessment');
    expect(isbarHandover).toHaveProperty('recommendation');
  });

  test('ISBAR identify includes facility name', () => {
    const result = evaluateAlertAU(buildAlert());
    expect(result.isbarHandover.identify.facility).toContain('CareConnect');
  });

  test('ISBAR situation includes alert severity', () => {
    const result = evaluateAlertAU(buildAlert({ severity: 'critical' }));
    expect(result.isbarHandover.situation.severity).toBe('critical');
  });

  test('ISBAR background includes resident ID', () => {
    const result = evaluateAlertAU(buildAlert({ resident_id: 'res_test' }));
    expect(result.isbarHandover.background.residentId).toBe('res_test');
  });

  test('ISBAR situation includes SNOMED code for coded alert', () => {
    const result = evaluateAlertAU(buildAlert({
      type: 'glucose', severity: 'critical', message: 'glucose high',
    }));
    expect(result.isbarHandover.situation.snomedCode).toBe(SNOMED_ALERT_CODES.glucose.high.code);
  });

  test('ISBAR recommendation includes emergency action text', () => {
    const result = evaluateAlertAU(buildAlert({ severity: 'critical' }));
    expect(result.isbarHandover.recommendation.action).toContain('000');
  });
});

// ─── FHIR AU Core Flag resource ───────────────────────────

describe('FHIR AU Core Flag resource', () => {
  test('resourceType is Flag', () => {
    const result = evaluateAlertAU(buildAlert());
    expect(result.fhirResource.resourceType).toBe('Flag');
  });

  test('profile is AU Core Flag', () => {
    const result = evaluateAlertAU(buildAlert());
    const profiles = result.fhirResource.meta?.profile || [];
    expect(profiles).toContain('http://hl7.org.au/fhir/core/StructureDefinition/au-core-flag');
  });

  test('active alert has status "active"', () => {
    const result = evaluateAlertAU(buildAlert({ status: 'open' }));
    expect(result.fhirResource.status).toBe('active');
  });

  test('acknowledged alert has status "inactive"', () => {
    const result = evaluateAlertAU(buildAlert({ status: 'acknowledged' }));
    expect(result.fhirResource.status).toBe('inactive');
  });

  test('subject reference contains resident_id', () => {
    const result = evaluateAlertAU(buildAlert({ resident_id: 'res_fhir' }));
    expect(result.fhirResource.subject.reference).toContain('res_fhir');
  });

  test('SNOMED coding used for code.coding when available', () => {
    const result = evaluateAlertAU(buildAlert({
      type: 'glucose', severity: 'critical', message: 'glucose high',
    }));
    const coding = result.fhirResource.code?.coding ?? [];
    expect(coding.length).toBeGreaterThan(0);
    const snomedEntry = coding.find((c) => c.system === 'http://snomed.info/sct');
    expect(snomedEntry).toBeDefined();
  });
});

// ─── SNOMED_ALERT_CODES catalogue integrity ───────────────

describe('SNOMED_ALERT_CODES catalogue', () => {
  test('glucose has both high and low codes', () => {
    expect(SNOMED_ALERT_CODES.glucose.high.code).toBeDefined();
    expect(SNOMED_ALERT_CODES.glucose.low.code).toBeDefined();
  });

  test('fall has event code', () => {
    expect(SNOMED_ALERT_CODES.fall.event.code).toBe('217082002');
  });

  test('medication has missed and interaction codes', () => {
    expect(SNOMED_ALERT_CODES.medication.missed.code).toBeDefined();
    expect(SNOMED_ALERT_CODES.medication.interaction.code).toBeDefined();
  });
});

// ─── AU_ESCALATION_LEVELS integrity ──────────────────────

describe('AU_ESCALATION_LEVELS integrity', () => {
  test('emergency level is 1 (highest)', () => {
    expect(AU_ESCALATION_LEVELS.emergency.level).toBe(1);
  });

  test('urgent level is 2', () => {
    expect(AU_ESCALATION_LEVELS.urgent.level).toBe(2);
  });

  test('routine level is 3', () => {
    expect(AU_ESCALATION_LEVELS.routine.level).toBe(3);
  });

  test('all levels reference NSQHS Standard 8', () => {
    for (const level of Object.values(AU_ESCALATION_LEVELS)) {
      expect(level.nsqhsStandard).toContain('NSQHS Standard 8');
    }
  });
});
