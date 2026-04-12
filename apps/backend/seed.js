/**
 * Generates db.json with fresh timestamps every time the server starts.
 * Mirrors the mockData.js from the mobile app.
 */
const fs = require('fs');
const path = require('path');

const now = Date.now();

const db = {
  residents: [
    {
      id: 1,
      name: 'Margaret Chen',
      room: '204A',
      status: 'stable',
      photo_url: null,
      age: 82,
      conditions: ['Type 2 Diabetes', 'Hypertension'],
      latest_glucose: {
        value: 142,
        unit: 'mg/dL',
        timestamp: new Date(now - 3600000).toISOString(),
      },
    },
    {
      id: 2,
      name: 'Robert Williams',
      room: '118B',
      status: 'warning',
      photo_url: null,
      age: 75,
      conditions: ['COPD', 'Heart Failure'],
      latest_glucose: {
        value: 198,
        unit: 'mg/dL',
        timestamp: new Date(now - 7200000).toISOString(),
      },
    },
    {
      id: 3,
      name: 'Dorothy Garcia',
      room: '312C',
      status: 'critical',
      photo_url: null,
      age: 89,
      conditions: ["Alzheimer's", 'Osteoporosis'],
      latest_glucose: {
        value: 267,
        unit: 'mg/dL',
        timestamp: new Date(now - 1800000).toISOString(),
      },
    },
    {
      id: 4,
      name: 'James Patel',
      room: '205A',
      status: 'stable',
      photo_url: null,
      age: 71,
      conditions: ['Arthritis'],
      latest_glucose: {
        value: 110,
        unit: 'mg/dL',
        timestamp: new Date(now - 5400000).toISOString(),
      },
    },
    {
      id: 5,
      name: 'Helen Kowalski',
      room: '109B',
      status: 'stable',
      photo_url: null,
      age: 78,
      conditions: ['Type 1 Diabetes', 'Glaucoma'],
      latest_glucose: {
        value: 95,
        unit: 'mg/dL',
        timestamp: new Date(now - 900000).toISOString(),
      },
    },
    {
      id: 6,
      name: 'Frank Nguyen',
      room: '301A',
      status: 'warning',
      photo_url: null,
      age: 84,
      conditions: ["Parkinson's", 'Hypertension'],
      latest_glucose: {
        value: 185,
        unit: 'mg/dL',
        timestamp: new Date(now - 10800000).toISOString(),
      },
    },
  ],

  alerts: [
    {
      id: 1,
      resident_id: 3,
      resident_name: 'Dorothy Garcia',
      severity: 'critical',
      message: 'Blood glucose level critically elevated at 267 mg/dL',
      type: 'glucose',
      status: 'open',
      created_at: new Date(now - 600000).toISOString(),
    },
    {
      id: 2,
      resident_id: 2,
      resident_name: 'Robert Williams',
      severity: 'warning',
      message: 'SpO2 dropped to 91% — below threshold of 93%',
      type: 'spo2',
      status: 'open',
      created_at: new Date(now - 1200000).toISOString(),
    },
    {
      id: 3,
      resident_id: 6,
      resident_name: 'Frank Nguyen',
      severity: 'warning',
      message: 'Missed morning medication — Levodopa 250mg',
      type: 'medication',
      status: 'open',
      created_at: new Date(now - 3600000).toISOString(),
    },
    {
      id: 4,
      resident_id: 1,
      resident_name: 'Margaret Chen',
      severity: 'info',
      message: 'Scheduled blood pressure check in 30 minutes',
      type: 'reminder',
      status: 'open',
      created_at: new Date(now - 7200000).toISOString(),
    },
  ],

  tasks: [
    {
      id: 1,
      title: 'Administer insulin — Margaret Chen (Room 204A)',
      description: 'Humalog 10 units before lunch',
      status: 'pending',
      priority: 'high',
      due_at: new Date(now + 1800000).toISOString(),
      resident_id: 1,
    },
    {
      id: 2,
      title: 'Vitals check — Dorothy Garcia (Room 312C)',
      description: 'Full vitals panel: BP, HR, SpO2, glucose',
      status: 'pending',
      priority: 'high',
      due_at: new Date(now + 3600000).toISOString(),
      resident_id: 3,
    },
    {
      id: 3,
      title: 'Wound dressing change — James Patel (Room 205A)',
      description: 'Left knee — change gauze and apply antiseptic',
      status: 'pending',
      priority: 'medium',
      due_at: new Date(now + 7200000).toISOString(),
      resident_id: 4,
    },
    {
      id: 4,
      title: 'Physical therapy session — Robert Williams',
      description: 'Scheduled 2:00 PM — assist to therapy room',
      status: 'pending',
      priority: 'medium',
      due_at: new Date(now + 10800000).toISOString(),
      resident_id: 2,
    },
    {
      id: 5,
      title: 'Morning medication round — Ward A',
      description: 'All Ward A residents, medication cart',
      status: 'completed',
      priority: 'high',
      completed_at: new Date(now - 7200000).toISOString(),
      resident_id: null,
    },
    {
      id: 6,
      title: 'Blood glucose reading — Helen Kowalski',
      description: 'Pre-breakfast reading recorded',
      status: 'completed',
      priority: 'medium',
      completed_at: new Date(now - 5400000).toISOString(),
      resident_id: 5,
    },
  ],

  messages: [
    {
      id: 1,
      sender_name: 'Dr. Adams',
      sender_role: 'Doctor',
      content:
        "Dorothy Garcia's glucose levels are concerning. Please increase monitoring to every 2 hours and let me know if it exceeds 280.",
      created_at: new Date(now - 7200000).toISOString(),
    },
    {
      id: 2,
      sender_name: 'Nurse Sarah',
      sender_role: 'Nurse',
      content:
        "Understood, Dr. Adams. I'll adjust the schedule and keep you updated. Her last reading was 267 mg/dL at 10:15 AM.",
      created_at: new Date(now - 6900000).toISOString(),
    },
    {
      id: 3,
      sender_name: 'CNA Mike',
      sender_role: 'CNA',
      content:
        'Robert Williams is asking about his PT session time today. Should I confirm 2:00 PM?',
      created_at: new Date(now - 3600000).toISOString(),
    },
    {
      id: 4,
      sender_name: 'Nurse Sarah',
      sender_role: 'Nurse',
      content:
        'Yes, 2:00 PM is confirmed. Please help him get ready by 1:45. He needs his walker.',
      created_at: new Date(now - 3300000).toISOString(),
    },
    {
      id: 5,
      sender_name: 'Pharmacist Lisa',
      sender_role: 'Pharmacist',
      content:
        "Frank Nguyen's Levodopa has been restocked. Also, Margaret Chen's insulin prescription was updated — new dosage is 12 units.",
      created_at: new Date(now - 1800000).toISOString(),
    },
  ],

  readings: [
    {
      id: 1,
      resident_id: 1,
      metric: 'glucose',
      value: 142,
      unit: 'mg/dL',
      source: 'ble',
      created_at: new Date(now - 3600000).toISOString(),
    },
    {
      id: 2,
      resident_id: 1,
      metric: 'hr',
      value: 72,
      unit: 'bpm',
      source: 'ble',
      created_at: new Date(now - 3600000).toISOString(),
    },
    {
      id: 3,
      resident_id: 1,
      metric: 'spo2',
      value: 97,
      unit: '%',
      source: 'ble',
      created_at: new Date(now - 3600000).toISOString(),
    },
    {
      id: 4,
      resident_id: 1,
      metric: 'bp_systolic',
      value: 128,
      unit: 'mmHg',
      source: 'ble',
      created_at: new Date(now - 3600000).toISOString(),
    },
    {
      id: 5,
      resident_id: 3,
      metric: 'glucose',
      value: 267,
      unit: 'mg/dL',
      source: 'manual',
      created_at: new Date(now - 1800000).toISOString(),
    },
    {
      id: 6,
      resident_id: 3,
      metric: 'hr',
      value: 88,
      unit: 'bpm',
      source: 'ble',
      created_at: new Date(now - 1800000).toISOString(),
    },
    {
      id: 7,
      resident_id: 3,
      metric: 'spo2',
      value: 94,
      unit: '%',
      source: 'ble',
      created_at: new Date(now - 1800000).toISOString(),
    },
    {
      id: 8,
      resident_id: 3,
      metric: 'bp_systolic',
      value: 145,
      unit: 'mmHg',
      source: 'ble',
      created_at: new Date(now - 1800000).toISOString(),
    },
  ],
};

fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
console.log('✅ db.json seeded with fresh timestamps');
