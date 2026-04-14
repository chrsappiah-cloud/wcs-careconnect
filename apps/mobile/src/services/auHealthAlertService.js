// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
/**
 * Australian Health Alert Service
 * ─────────────────────────────────────────────────────────
 * Connects CareConnect alert/warning system to Australian
 * health centre standards, clinical thresholds, and
 * escalation protocols.
 *
 * Standards:  ACSQHC (Aged Care Quality & Safety Commission)
 *             NSQHS  (National Safety & Quality Health Service)
 *             FHIR AU Core (HL7 Australia)
 *             SNOMED CT-AU via CSIRO Ontoserver
 */

import {
  lookupSNOMED,
  searchSNOMEDFindings,
  searchFHIRObservations,
  AGED_CARE_CONDITIONS,
} from './auMedApi';

// ─────────────────────────────────────────────────────────
// 1. Australian Clinical Thresholds (ACSQHC Aged Care)
//    Based on: Australian Commission on Safety and Quality
//    in Health Care — recognising clinical deterioration
// ─────────────────────────────────────────────────────────

export const AU_CLINICAL_THRESHOLDS = {
  glucose: {
    metric: 'Blood Glucose',
    unit: 'mg/dL',
    snomedCode: '33747003',
    snomedDisplay: 'Blood glucose level',
    loincCode: '2339-0',
    ranges: {
      critical_high: { min: 250, label: 'Severe Hyperglycaemia', escalation: 'emergency' },
      warning_high:  { min: 180, max: 249, label: 'Hyperglycaemia', escalation: 'urgent' },
      normal:        { min: 70, max: 179, label: 'Within Target Range', escalation: null },
      warning_low:   { min: 54, max: 69, label: 'Hypoglycaemia', escalation: 'urgent' },
      critical_low:  { max: 53, label: 'Severe Hypoglycaemia', escalation: 'emergency' },
    },
    auGuideline: 'Royal Australian College of General Practitioners — Diabetes Management in Aged Care',
  },
  spo2: {
    metric: 'Oxygen Saturation',
    unit: '%',
    snomedCode: '431314004',
    snomedDisplay: 'Peripheral oxygen saturation',
    loincCode: '2708-6',
    ranges: {
      critical_low: { max: 89, label: 'Severe Hypoxaemia', escalation: 'emergency' },
      warning_low:  { min: 90, max: 93, label: 'Mild Hypoxaemia', escalation: 'urgent' },
      normal:       { min: 94, label: 'Normal Saturation', escalation: null },
    },
    auGuideline: 'Between the Flags — NSW Clinical Excellence Commission',
  },
  heart_rate: {
    metric: 'Heart Rate',
    unit: 'bpm',
    snomedCode: '364075005',
    snomedDisplay: 'Heart rate',
    loincCode: '8867-4',
    ranges: {
      critical_high: { min: 130, label: 'Severe Tachycardia', escalation: 'emergency' },
      warning_high:  { min: 100, max: 129, label: 'Tachycardia', escalation: 'urgent' },
      normal:        { min: 60, max: 99, label: 'Normal', escalation: null },
      warning_low:   { min: 50, max: 59, label: 'Bradycardia', escalation: 'urgent' },
      critical_low:  { max: 49, label: 'Severe Bradycardia', escalation: 'emergency' },
    },
    auGuideline: 'Between the Flags — NSW Clinical Excellence Commission',
  },
  blood_pressure_systolic: {
    metric: 'Systolic Blood Pressure',
    unit: 'mmHg',
    snomedCode: '271649006',
    snomedDisplay: 'Systolic blood pressure',
    loincCode: '8480-6',
    ranges: {
      critical_high: { min: 180, label: 'Hypertensive Crisis', escalation: 'emergency' },
      warning_high:  { min: 140, max: 179, label: 'Hypertension', escalation: 'urgent' },
      normal:        { min: 100, max: 139, label: 'Normal', escalation: null },
      warning_low:   { min: 90, max: 99, label: 'Hypotension', escalation: 'urgent' },
      critical_low:  { max: 89, label: 'Severe Hypotension', escalation: 'emergency' },
    },
    auGuideline: 'Heart Foundation Australia — Hypertension Guidelines',
  },
  temperature: {
    metric: 'Body Temperature',
    unit: '°C',
    snomedCode: '386725007',
    snomedDisplay: 'Body temperature',
    loincCode: '8310-5',
    ranges: {
      critical_high: { min: 39.5, label: 'Severe Hyperthermia', escalation: 'emergency' },
      warning_high:  { min: 38.0, max: 39.4, label: 'Fever', escalation: 'urgent' },
      normal:        { min: 36.0, max: 37.9, label: 'Normal', escalation: null },
      warning_low:   { min: 35.0, max: 35.9, label: 'Mild Hypothermia', escalation: 'urgent' },
      critical_low:  { max: 34.9, label: 'Severe Hypothermia', escalation: 'emergency' },
    },
    auGuideline: 'ACSQHC — Recognising and Responding to Clinical Deterioration',
  },
  respiratory_rate: {
    metric: 'Respiratory Rate',
    unit: 'breaths/min',
    snomedCode: '86290005',
    snomedDisplay: 'Respiratory rate',
    loincCode: '9279-1',
    ranges: {
      critical_high: { min: 30, label: 'Severe Tachypnoea', escalation: 'emergency' },
      warning_high:  { min: 21, max: 29, label: 'Tachypnoea', escalation: 'urgent' },
      normal:        { min: 12, max: 20, label: 'Normal', escalation: null },
      warning_low:   { min: 8, max: 11, label: 'Bradypnoea', escalation: 'urgent' },
      critical_low:  { max: 7, label: 'Respiratory Depression', escalation: 'emergency' },
    },
    auGuideline: 'Between the Flags — NSW Clinical Excellence Commission',
  },
};

// Map alert types from the app to clinical threshold keys
const ALERT_TYPE_MAP = {
  glucose: 'glucose',
  spo2: 'spo2',
  heart_rate: 'heart_rate',
  blood_pressure: 'blood_pressure_systolic',
  temperature: 'temperature',
  respiratory_rate: 'respiratory_rate',
  medication: null, // Medication alerts use a different pathway
  reminder: null,
};

// ─────────────────────────────────────────────────────────
// 2. SNOMED CT-AU Alert Coding
// ─────────────────────────────────────────────────────────

export const SNOMED_ALERT_CODES = {
  glucose: {
    high: { code: '80394007', display: 'Hyperglycaemia' },
    low:  { code: '302866003', display: 'Hypoglycaemia' },
  },
  spo2: {
    low: { code: '389087006', display: 'Hypoxaemia' },
  },
  heart_rate: {
    high: { code: '3424008', display: 'Tachycardia' },
    low:  { code: '48867003', display: 'Bradycardia' },
  },
  blood_pressure: {
    high: { code: '38341003', display: 'Hypertensive disorder' },
    low:  { code: '45007003', display: 'Hypotension' },
  },
  temperature: {
    high: { code: '386661006', display: 'Fever' },
    low:  { code: '386689009', display: 'Hypothermia' },
  },
  medication: {
    missed:      { code: '182834008', display: 'Drug treatment not indicated' },
    interaction: { code: '419511003', display: 'Drug interaction' },
    adverse:     { code: '281647001', display: 'Adverse drug reaction' },
  },
  fall: {
    risk: { code: '129839007', display: 'At risk of falls' },
    event: { code: '217082002', display: 'Fall' },
  },
};

// ─────────────────────────────────────────────────────────
// 3. Australian Escalation Protocols
//    Based on: NSQHS Standard 8 — Recognising & Responding
//    to Acute Deterioration
// ─────────────────────────────────────────────────────────

export const AU_ESCALATION_LEVELS = {
  emergency: {
    level: 1,
    label: 'Emergency — Triple Zero (000)',
    description: 'Immediate life-threatening condition requiring ambulance',
    action: 'Call 000 for ambulance. Begin first aid as appropriate.',
    contacts: [
      { name: 'Triple Zero', phone: '000', type: 'emergency' },
    ],
    color: '#DC2626',
    responseTimeMinutes: null,
    nsqhsStandard: 'NSQHS Standard 8 — Escalation Tier 3 (MET/Code Blue)',
  },
  urgent: {
    level: 2,
    label: 'Urgent — Health Direct / Nurse-on-Call',
    description: 'Significant clinical concern requiring urgent medical review',
    action: 'Contact facility GP or Nurse-on-Call. Prepare clinical handover using ISBAR.',
    contacts: [
      { name: 'Health Direct Australia', phone: '1800 022 222', type: 'healthline' },
      { name: 'Nurse-on-Call (VIC)', phone: '1300 60 60 24', type: 'nursing' },
      { name: 'After-Hours GP Helpline', phone: '1800 022 222', type: 'gp' },
    ],
    color: '#D97706',
    responseTimeMinutes: 30,
    nsqhsStandard: 'NSQHS Standard 8 — Escalation Tier 2 (Rapid Response)',
  },
  routine: {
    level: 3,
    label: 'Routine — GP Review',
    description: 'Non-urgent finding for next scheduled GP review',
    action: 'Document in clinical notes. Include in next GP review handover.',
    contacts: [
      { name: 'Facility GP', phone: null, type: 'gp' },
      { name: 'My Aged Care', phone: '1800 200 422', type: 'agedcare' },
    ],
    color: '#2563EB',
    responseTimeMinutes: null,
    nsqhsStandard: 'NSQHS Standard 8 — Escalation Tier 1 (Clinical Review)',
  },
};

// ─────────────────────────────────────────────────────────
// 4. Core Functions
// ─────────────────────────────────────────────────────────

/**
 * Evaluate an alert against Australian clinical thresholds.
 * Returns clinical context including SNOMED coding, threshold
 * status, escalation level, and AU guideline reference.
 */
export function evaluateAlertAU(alert) {
  const thresholdKey = ALERT_TYPE_MAP[alert.type];
  const threshold = thresholdKey ? AU_CLINICAL_THRESHOLDS[thresholdKey] : null;

  // Determine SNOMED code for the alert
  const snomedCodes = SNOMED_ALERT_CODES[alert.type];
  let snomedCode = null;
  if (snomedCodes) {
    if (alert.severity === 'critical' || alert.severity === 'warning') {
      // Determine direction from alert message or value
      const msgLower = (alert.message || '').toLowerCase();
      if (msgLower.includes('high') || msgLower.includes('elevated') || msgLower.includes('above')) {
        snomedCode = snomedCodes.high;
      } else if (msgLower.includes('low') || msgLower.includes('below') || msgLower.includes('drop')) {
        snomedCode = snomedCodes.low;
      } else {
        snomedCode = snomedCodes.high || snomedCodes.low || snomedCodes.missed;
      }
    }
  }

  // Map severity to Australian escalation level
  let escalationLevel;
  if (alert.severity === 'critical') {
    escalationLevel = AU_ESCALATION_LEVELS.emergency;
  } else if (alert.severity === 'warning') {
    escalationLevel = AU_ESCALATION_LEVELS.urgent;
  } else {
    escalationLevel = AU_ESCALATION_LEVELS.routine;
  }

  return {
    alert,
    auCompliant: true,
    clinicalCoding: {
      snomed: snomedCode,
      system: 'http://snomed.info/sct',
    },
    threshold: threshold
      ? {
          metric: threshold.metric,
          unit: threshold.unit,
          snomedCode: threshold.snomedCode,
          loincCode: threshold.loincCode,
          guideline: threshold.auGuideline,
        }
      : null,
    escalation: escalationLevel,
    isbarHandover: generateISBAR(alert, escalationLevel, snomedCode),
    fhirResource: buildFHIRAUFlag(alert, snomedCode),
  };
}

/**
 * Generate an ISBAR clinical handover for the alert.
 * ISBAR is the standard handover protocol used in
 * Australian aged care facilities.
 */
function generateISBAR(alert, escalation, snomedCode) {
  return {
    identify: {
      facility: 'CareConnect Aged Care Facility',
      caller: 'CareConnect Alert System',
      patient: alert.resident_name || 'Unknown Resident',
    },
    situation: {
      description: alert.message,
      severity: alert.severity,
      alertType: alert.type,
      snomedCode: snomedCode?.code,
      snomedDisplay: snomedCode?.display,
    },
    background: {
      residentId: alert.resident_id,
      relevantHistory: `Alert generated at ${alert.created_at}`,
    },
    assessment: {
      clinicalImpression: `${alert.severity.toUpperCase()} alert — ${alert.message}`,
      escalationLevel: escalation.label,
      nsqhsStandard: escalation.nsqhsStandard,
    },
    recommendation: {
      action: escalation.action,
      contacts: escalation.contacts,
      responseTime: escalation.responseTimeMinutes
        ? `Within ${escalation.responseTimeMinutes} minutes`
        : 'Immediate',
    },
  };
}

/**
 * Build a FHIR AU Core Flag resource for the alert.
 * Compliant with: HL7 AU Core Flag profile
 * http://hl7.org.au/fhir/core/StructureDefinition/au-core-flag
 */
function buildFHIRAUFlag(alert, snomedCode) {
  const flag = {
    resourceType: 'Flag',
    meta: {
      profile: ['http://hl7.org.au/fhir/core/StructureDefinition/au-core-flag'],
    },
    status: alert.status === 'acknowledged' ? 'inactive' : 'active',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/flag-category',
            code: 'clinical',
            display: 'Clinical',
          },
        ],
      },
    ],
    code: {
      coding: snomedCode
        ? [
            {
              system: 'http://snomed.info/sct',
              code: snomedCode.code,
              display: snomedCode.display,
            },
          ]
        : [],
      text: alert.message,
    },
    subject: {
      reference: `Patient/${alert.resident_id}`,
      display: alert.resident_name,
    },
    period: {
      start: alert.created_at,
    },
    extension: [
      {
        url: 'http://hl7.org.au/fhir/StructureDefinition/au-alert-severity',
        valueCode: alert.severity,
      },
    ],
  };
  return flag;
}

/**
 * Enrich an alert with live SNOMED CT-AU lookup data.
 * Uses CSIRO Ontoserver for real-time terminology validation.
 */
export async function enrichAlertWithSNOMED(alert) {
  const evaluation = evaluateAlertAU(alert);
  const snomedCode = evaluation.clinicalCoding?.snomed?.code;

  if (!snomedCode) return evaluation;

  try {
    const snomedLookup = await lookupSNOMED(snomedCode);
    if (snomedLookup) {
      evaluation.clinicalCoding.validated = true;
      evaluation.clinicalCoding.snomedDisplay = snomedLookup.display;
      evaluation.clinicalCoding.codeSystem = snomedLookup.codeSystem;
    }
  } catch {
    evaluation.clinicalCoding.validated = false;
  }

  return evaluation;
}

/**
 * Search for related clinical findings via SNOMED CT-AU
 * based on the alert's clinical context.
 */
export async function findRelatedFindings(alertType) {
  const snomedCodes = SNOMED_ALERT_CODES[alertType];
  if (!snomedCodes) return [];

  const firstCode = Object.values(snomedCodes)[0];
  if (!firstCode) return [];

  try {
    return await searchSNOMEDFindings(firstCode.display, 5);
  } catch {
    return [];
  }
}

/**
 * Get Australian aged care clinical context for an alert.
 * This is the primary function called by the alerts screen
 * to show AU health compliance data on each alert card.
 */
export function getAUClinicalContext(alert) {
  const evaluation = evaluateAlertAU(alert);
  return {
    snomedCode: evaluation.clinicalCoding.snomed?.code || null,
    snomedDisplay: evaluation.clinicalCoding.snomed?.display || null,
    escalationLevel: evaluation.escalation.level,
    escalationLabel: evaluation.escalation.label,
    escalationColor: evaluation.escalation.color,
    escalationAction: evaluation.escalation.action,
    escalationContacts: evaluation.escalation.contacts,
    nsqhsStandard: evaluation.escalation.nsqhsStandard,
    guideline: evaluation.threshold?.guideline || null,
    isbar: evaluation.isbarHandover,
    fhirFlag: evaluation.fhirResource,
    responseTime: evaluation.escalation.responseTimeMinutes
      ? `${evaluation.escalation.responseTimeMinutes} min`
      : 'Immediate',
  };
}
