/**
 * Compliance Workflow Tests
 * ─────────────────────────────────────────────────────────
 * Covers the four compliance pillars for CareConnect AU:
 *   1. Alert acknowledgement flow
 *   2. Missed medication handling
 *   3. Required field validation on care forms
 *   4. Audit trail integrity
 *
 * Plus two supporting suites:
 *   5. NSQHS Standard 8 escalation protocol
 *   6. AU clinical threshold classification
 *
 * All tests are pure logic — no React rendering.
 * Domain: Australian Aged Care / ACSQHC / NSQHS Standards.
 */

import { getAUClinicalContext, AU_CLINICAL_THRESHOLDS } from '../../services/auHealthAlertService';
import { mockAlerts } from '../../mockData';

// ─────────────────────────────────────────────────────────
// Test helpers (mirrors alerts.jsx business logic)
// ─────────────────────────────────────────────────────────

/** Build the PATCH body sent by ackMutation.mutationFn */
function buildAckPayload(acknowledgedBy = 'Nurse Sarah') {
  return { status: 'acknowledged', acknowledged_by: acknowledgedBy };
}

/** Build the POST body sent by escalateMutation (no body required, but path must be correct) */
function buildEscalateEndpoint(alertId) {
  return `/api/alerts/${alertId}/escalate`;
}

/** Filter to only open alerts (what the screen displays) */
function getOpenAlerts(alerts) {
  return alerts.filter((a) => a.status === 'open');
}

/** Simulate acknowledging an alert (immutable) */
function acknowledgeAlert(alert, acknowledgedBy = 'Nurse Sarah') {
  return { ...alert, status: 'acknowledged', acknowledged_by: acknowledgedBy, acknowledged_at: new Date().toISOString() };
}

/** Validate required fields for the add-resident form */
function validateResidentForm({ name, room }) {
  const errors = [];
  if (!name || !name.trim()) errors.push('name');
  if (!room || !room.trim()) errors.push('room');
  return { valid: errors.length === 0, errors };
}

/** Classify an alert type for medication-specific handling */
function isMedicationAlert(alert) {
  return alert.type === 'medication';
}

/** Extract numeric value from an alert message (e.g. "267 mg/dL" → 267) */
function extractNumericValue(message) {
  const match = message.match(/(\d+(?:\.\d+)?)\s*(mg\/dL|%|°C|mmHg|bpm)/);
  return match ? parseFloat(match[1]) : null;
}

/** Classify AU clinical threshold for glucose */
function classifyGlucose(mgdl) {
  const ranges = AU_CLINICAL_THRESHOLDS.glucose.ranges;
  if (mgdl >= 250) return { range: 'critical_high', ...ranges.critical_high };
  if (mgdl >= 180) return { range: 'warning_high', ...ranges.warning_high };
  if (mgdl >= 70)  return { range: 'normal', ...ranges.normal };
  if (mgdl >= 54)  return { range: 'warning_low', ...ranges.warning_low };
  return { range: 'critical_low', ...ranges.critical_low };
}

/** Classify AU clinical threshold for SpO2 */
function classifySpO2(pct) {
  const ranges = AU_CLINICAL_THRESHOLDS.spo2.ranges;
  if (pct <= 89) return { range: 'critical_low', ...ranges.critical_low };
  if (pct <= 93) return { range: 'warning_low', ...ranges.warning_low };
  return { range: 'normal', ...ranges.normal };
}

// ─────────────────────────────────────────────────────────
// 1. Alert acknowledgement flow
// ─────────────────────────────────────────────────────────

describe('Alert acknowledgement flow', () => {
  test('ack payload has status "acknowledged" and acknowledged_by', () => {
    const payload = buildAckPayload();
    expect(payload.status).toBe('acknowledged');
    expect(payload.acknowledged_by).toBeTruthy();
    expect(typeof payload.acknowledged_by).toBe('string');
  });

  test('only open alerts appear in the active list', () => {
    const mixed = [
      { id: 1, status: 'open', severity: 'critical' },
      { id: 2, status: 'acknowledged', severity: 'warning' },
      { id: 3, status: 'open', severity: 'info' },
    ];
    const open = getOpenAlerts(mixed);
    expect(open).toHaveLength(2);
    expect(open.every((a) => a.status === 'open')).toBe(true);
  });

  test('acknowledging an alert changes its status immutably', () => {
    const alert = { id: 1, status: 'open', severity: 'critical', resident_id: 3 };
    const acked = acknowledgeAlert(alert);
    expect(acked.status).toBe('acknowledged');
    expect(acked.acknowledged_by).toBe('Nurse Sarah');
    // original untouched
    expect(alert.status).toBe('open');
  });

  test('acknowledged alert is absent from the open list', () => {
    const alert = { id: 1, status: 'open', severity: 'warning' };
    const acked = acknowledgeAlert(alert);
    const remaining = getOpenAlerts([acked]);
    expect(remaining).toHaveLength(0);
  });

  test('acknowledged alert carries an acknowledged_at ISO timestamp', () => {
    const alert = { id: 2, status: 'open', severity: 'info' };
    const acked = acknowledgeAlert(alert);
    expect(acked.acknowledged_at).toBeTruthy();
    expect(() => new Date(acked.acknowledged_at)).not.toThrow();
    expect(new Date(acked.acknowledged_at).getTime()).not.toBeNaN();
  });

  test('escalate endpoint path is correctly formed', () => {
    const endpoint = buildEscalateEndpoint(42);
    expect(endpoint).toBe('/api/alerts/42/escalate');
    expect(endpoint).toMatch(/^\/api\/alerts\/\d+\/escalate$/);
  });
});

// ─────────────────────────────────────────────────────────
// 2. Missed medication handling
// ─────────────────────────────────────────────────────────

describe('Missed medication handling', () => {
  const medAlert = mockAlerts.find((a) => a.type === 'medication');

  test('mock data contains at least one medication alert', () => {
    expect(medAlert).toBeDefined();
    expect(medAlert.type).toBe('medication');
  });

  test('medication alert is classified as a medication type', () => {
    expect(isMedicationAlert(medAlert)).toBe(true);
  });

  test('missed medication alert message names the drug', () => {
    // Message should contain a recognisable drug/medication term
    expect(medAlert.message.toLowerCase()).toMatch(/medication|drug|levodopa|insulin|tablet|mg/i);
  });

  test('medication alert has warning or critical severity', () => {
    expect(['warning', 'critical']).toContain(medAlert.severity);
  });

  test('non-medication alerts are not classified as medication type', () => {
    const nonMed = mockAlerts.filter((a) => a.type !== 'medication');
    expect(nonMed.every((a) => !isMedicationAlert(a))).toBe(true);
  });

  test('multiple medication alerts tracked independently by id', () => {
    const medAlerts = [
      { id: 10, type: 'medication', resident_id: 1, status: 'open' },
      { id: 11, type: 'medication', resident_id: 2, status: 'open' },
    ];
    const ids = medAlerts.map((a) => a.id);
    expect(new Set(ids).size).toBe(2); // unique IDs
    expect(medAlerts[0].resident_id).not.toBe(medAlerts[1].resident_id);
  });

  test('acknowledging one medication alert does not close another', () => {
    const alerts = [
      { id: 10, type: 'medication', status: 'open' },
      { id: 11, type: 'medication', status: 'open' },
    ];
    const acked = acknowledgeAlert(alerts[0]);
    const remaining = getOpenAlerts([acked, alerts[1]]);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(11);
  });
});

// ─────────────────────────────────────────────────────────
// 3. Required field validation on care forms
// ─────────────────────────────────────────────────────────

describe('Required field validation — Add Resident form', () => {
  test('valid name and room passes validation', () => {
    const { valid, errors } = validateResidentForm({ name: 'Margaret Chen', room: '204A' });
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test('empty name fails validation', () => {
    const { valid, errors } = validateResidentForm({ name: '', room: '204A' });
    expect(valid).toBe(false);
    expect(errors).toContain('name');
  });

  test('whitespace-only name fails validation', () => {
    const { valid, errors } = validateResidentForm({ name: '   ', room: '204A' });
    expect(valid).toBe(false);
    expect(errors).toContain('name');
  });

  test('empty room fails validation', () => {
    const { valid, errors } = validateResidentForm({ name: 'Dorothy Garcia', room: '' });
    expect(valid).toBe(false);
    expect(errors).toContain('room');
  });

  test('whitespace-only room fails validation', () => {
    const { valid, errors } = validateResidentForm({ name: 'Dorothy Garcia', room: '  ' });
    expect(valid).toBe(false);
    expect(errors).toContain('room');
  });

  test('both fields empty reports both errors', () => {
    const { valid, errors } = validateResidentForm({ name: '', room: '' });
    expect(valid).toBe(false);
    expect(errors).toContain('name');
    expect(errors).toContain('room');
  });

  test('null values fail gracefully without throwing', () => {
    expect(() => validateResidentForm({ name: null, room: null })).not.toThrow();
    const { valid } = validateResidentForm({ name: null, room: null });
    expect(valid).toBe(false);
  });

  test('leading/trailing whitespace is trimmed before validation', () => {
    const { valid } = validateResidentForm({ name: '  Robert  ', room: ' 101B ' });
    expect(valid).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────
// 4. Audit trail integrity
// ─────────────────────────────────────────────────────────

describe('Audit trail integrity', () => {
  test('acknowledged alert records the acknowledging staff member', () => {
    const alert = { id: 1, status: 'open' };
    const acked = acknowledgeAlert(alert, 'Nurse Johnson');
    expect(acked.acknowledged_by).toBe('Nurse Johnson');
  });

  test('ISBAR handover object has all five required sections', () => {
    const auCtx = getAUClinicalContext(mockAlerts[0]); // critical glucose alert
    if (auCtx.isbar) {
      expect(auCtx.isbar).toHaveProperty('identify');
      expect(auCtx.isbar).toHaveProperty('situation');
      expect(auCtx.isbar).toHaveProperty('background');
      expect(auCtx.isbar).toHaveProperty('assessment');
      expect(auCtx.isbar).toHaveProperty('recommendation');
    } else {
      // Critical alert must produce ISBAR
      expect(auCtx.escalationLevel).toBe('emergency');
    }
  });

  test('NSQHS standard reference is present for clinical context', () => {
    const auCtx = getAUClinicalContext(mockAlerts[0]);
    expect(auCtx.nsqhsStandard).toBeTruthy();
    expect(typeof auCtx.nsqhsStandard).toBe('string');
    expect(auCtx.nsqhsStandard.length).toBeGreaterThan(5);
  });

  test('clinical context carries SNOMED code for known alert types', () => {
    const auCtx = getAUClinicalContext(mockAlerts[0]); // glucose alert
    expect(auCtx.snomedCode).toBeTruthy();
    // SNOMED codes are numeric strings
    expect(auCtx.snomedCode).toMatch(/^\d+$/);
  });

  test('alert created_at is a valid ISO timestamp', () => {
    mockAlerts.forEach((alert) => {
      expect(() => new Date(alert.created_at)).not.toThrow();
      expect(new Date(alert.created_at).getTime()).not.toBeNaN();
    });
  });

  test('all mock alerts have unique IDs (no audit collision)', () => {
    const ids = mockAlerts.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('ack payload is serialisable to JSON without loss', () => {
    const payload = buildAckPayload('Dr. Smith');
    const roundTripped = JSON.parse(JSON.stringify(payload));
    expect(roundTripped.status).toBe(payload.status);
    expect(roundTripped.acknowledged_by).toBe(payload.acknowledged_by);
  });
});

// ─────────────────────────────────────────────────────────
// 5. NSQHS Standard 8 escalation protocol
// ─────────────────────────────────────────────────────────

describe('NSQHS Standard 8 escalation protocol', () => {
  test('critical glucose alert triggers emergency escalation level', () => {
    const criticalGlucoseAlert = mockAlerts.find((a) => a.severity === 'critical');
    const auCtx = getAUClinicalContext(criticalGlucoseAlert);
    // AU_ESCALATION_LEVELS.emergency.level === 1
    expect(auCtx.escalationLevel).toBe(1);
  });

  test('warning SpO2 alert triggers urgent escalation level', () => {
    const spo2Alert = mockAlerts.find((a) => a.type === 'spo2');
    const auCtx = getAUClinicalContext(spo2Alert);
    // AU_ESCALATION_LEVELS: emergency=1, urgent=2
    expect([1, 2]).toContain(auCtx.escalationLevel);
  });

  test('info alert does not trigger emergency escalation', () => {
    const infoAlert = mockAlerts.find((a) => a.severity === 'info');
    const auCtx = getAUClinicalContext(infoAlert);
    // Level 1 = emergency; info alerts must not reach emergency tier
    expect(auCtx.escalationLevel).not.toBe(1);
  });

  test('escalation action text is non-empty for clinical alerts', () => {
    const clinicalAlerts = mockAlerts.filter((a) => ['critical', 'warning'].includes(a.severity));
    clinicalAlerts.forEach((alert) => {
      const auCtx = getAUClinicalContext(alert);
      expect(typeof auCtx.escalationAction).toBe('string');
      expect(auCtx.escalationAction.length).toBeGreaterThan(5);
    });
  });

  test('emergency escalation has at least one AU health contact', () => {
    const criticalAlert = mockAlerts.find((a) => a.severity === 'critical');
    const auCtx = getAUClinicalContext(criticalAlert);
    expect(Array.isArray(auCtx.escalationContacts)).toBe(true);
    expect(auCtx.escalationContacts.length).toBeGreaterThan(0);
  });

  test('escalation contact entries have name and type fields', () => {
    const criticalAlert = mockAlerts.find((a) => a.severity === 'critical');
    const { escalationContacts } = getAUClinicalContext(criticalAlert);
    escalationContacts.forEach((contact) => {
      expect(contact).toHaveProperty('name');
      expect(contact).toHaveProperty('type');
      expect(typeof contact.name).toBe('string');
    });
  });

  test('response time defined for emergency escalation', () => {
    const criticalAlert = mockAlerts.find((a) => a.severity === 'critical');
    const auCtx = getAUClinicalContext(criticalAlert);
    expect(auCtx.responseTime).toBeTruthy();
    expect(typeof auCtx.responseTime).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────
// 6. AU clinical threshold classification
// ─────────────────────────────────────────────────────────

describe('AU clinical threshold classification', () => {
  test('glucose 267 mg/dL → critical_high (ACSQHC threshold ≥250)', () => {
    const result = classifyGlucose(267);
    expect(result.range).toBe('critical_high');
    expect(result.escalation).toBe('emergency');
  });

  test('glucose 200 mg/dL → warning_high (threshold 180–249)', () => {
    const result = classifyGlucose(200);
    expect(result.range).toBe('warning_high');
    expect(result.escalation).toBe('urgent');
  });

  test('glucose 120 mg/dL → normal range (no escalation)', () => {
    const result = classifyGlucose(120);
    expect(result.range).toBe('normal');
    expect(result.escalation).toBeNull();
  });

  test('glucose 60 mg/dL → warning_low (hypoglycaemia 54–69)', () => {
    const result = classifyGlucose(60);
    expect(result.range).toBe('warning_low');
    expect(result.escalation).toBe('urgent');
  });

  test('SpO2 91% → warning_low (Between the Flags 90–93)', () => {
    const result = classifySpO2(91);
    expect(result.range).toBe('warning_low');
    expect(result.escalation).toBe('urgent');
  });

  test('SpO2 85% → critical_low (severe hypoxaemia ≤89)', () => {
    const result = classifySpO2(85);
    expect(result.range).toBe('critical_low');
    expect(result.escalation).toBe('emergency');
  });

  test('SpO2 97% → normal saturation (no escalation)', () => {
    const result = classifySpO2(97);
    expect(result.range).toBe('normal');
    expect(result.escalation).toBeNull();
  });

  test('AU_CLINICAL_THRESHOLDS covers the five core vital signs', () => {
    const expected = ['glucose', 'spo2', 'heart_rate', 'blood_pressure_systolic', 'temperature'];
    expected.forEach((key) => {
      expect(AU_CLINICAL_THRESHOLDS).toHaveProperty(key);
    });
  });

  test('each threshold entry has snomedCode, unit, and auGuideline', () => {
    Object.values(AU_CLINICAL_THRESHOLDS).forEach((threshold) => {
      expect(threshold).toHaveProperty('snomedCode');
      expect(threshold).toHaveProperty('unit');
      expect(threshold).toHaveProperty('auGuideline');
      expect(threshold.snomedCode).toMatch(/^\d+$/);
    });
  });

  test('extractNumericValue parses clinical message values correctly', () => {
    expect(extractNumericValue('Blood glucose level critically elevated at 267 mg/dL')).toBe(267);
    expect(extractNumericValue("SpO2 dropped to 91% — below threshold of 93%")).toBe(91);
    expect(extractNumericValue('Temperature recorded at 38.5 °C')).toBe(38.5);
    expect(extractNumericValue('Scheduled blood pressure check in 30 minutes')).toBeNull();
  });
});
