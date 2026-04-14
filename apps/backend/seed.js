// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
/**
 * Seeds the Supabase PostgreSQL database with fresh timestamps.
 * Run: node seed.js
 */
const db = require('./db');

const now = Date.now();

async function seed() {
  try {
    console.log('🔄 Seeding Supabase database...');

    // Clear existing data (order matters for FK constraints)
    await db.query('DELETE FROM readings');
    await db.query('DELETE FROM alerts');
    await db.query('DELETE FROM tasks');
    await db.query('DELETE FROM messages');
    await db.query('DELETE FROM residents');

    // Reset sequences
    await db.query("ALTER SEQUENCE residents_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE alerts_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE tasks_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");
    await db.query("ALTER SEQUENCE readings_id_seq RESTART WITH 1");

    // ── Residents ──
    await db.query(
      `INSERT INTO residents (name, room, status, photo_url, age, conditions, latest_glucose) VALUES
        ('Margaret Chen', '204A', 'stable', NULL, 82, $1, $2),
        ('Robert Williams', '118B', 'warning', NULL, 75, $3, $4),
        ('Dorothy Garcia', '312C', 'critical', NULL, 89, $5, $6),
        ('James Patel', '205A', 'stable', NULL, 71, $7, $8),
        ('Helen Kowalski', '109B', 'stable', NULL, 78, $9, $10),
        ('Frank Nguyen', '301A', 'warning', NULL, 84, $11, $12)`,
      [
        JSON.stringify(['Type 2 Diabetes', 'Hypertension']),
        JSON.stringify({ value: 142, unit: 'mg/dL', timestamp: new Date(now - 3600000).toISOString() }),
        JSON.stringify(['COPD', 'Heart Failure']),
        JSON.stringify({ value: 198, unit: 'mg/dL', timestamp: new Date(now - 7200000).toISOString() }),
        JSON.stringify(["Alzheimer's", 'Osteoporosis']),
        JSON.stringify({ value: 267, unit: 'mg/dL', timestamp: new Date(now - 1800000).toISOString() }),
        JSON.stringify(['Arthritis']),
        JSON.stringify({ value: 110, unit: 'mg/dL', timestamp: new Date(now - 5400000).toISOString() }),
        JSON.stringify(['Type 1 Diabetes', 'Glaucoma']),
        JSON.stringify({ value: 95, unit: 'mg/dL', timestamp: new Date(now - 900000).toISOString() }),
        JSON.stringify(["Parkinson's", 'Hypertension']),
        JSON.stringify({ value: 185, unit: 'mg/dL', timestamp: new Date(now - 10800000).toISOString() }),
      ]
    );

    // ── Alerts ──
    await db.query(
      `INSERT INTO alerts (resident_id, resident_name, severity, message, type, status, created_at) VALUES
        (3, 'Dorothy Garcia', 'critical', 'Blood glucose level critically elevated at 267 mg/dL', 'glucose', 'open', $1),
        (2, 'Robert Williams', 'warning', 'SpO2 dropped to 91% — below threshold of 93%', 'spo2', 'open', $2),
        (6, 'Frank Nguyen', 'warning', 'Missed morning medication — Levodopa 250mg', 'medication', 'open', $3),
        (1, 'Margaret Chen', 'info', 'Scheduled blood pressure check in 30 minutes', 'reminder', 'open', $4)`,
      [
        new Date(now - 600000).toISOString(),
        new Date(now - 1200000).toISOString(),
        new Date(now - 3600000).toISOString(),
        new Date(now - 7200000).toISOString(),
      ]
    );

    // ── Tasks ──
    await db.query(
      `INSERT INTO tasks (title, description, status, priority, due_at, completed_at, resident_id) VALUES
        ('Administer insulin — Margaret Chen (Room 204A)', 'Humalog 10 units before lunch', 'pending', 'high', $1, NULL, 1),
        ('Vitals check — Dorothy Garcia (Room 312C)', 'Full vitals panel: BP, HR, SpO2, glucose', 'pending', 'high', $2, NULL, 3),
        ('Wound dressing change — James Patel (Room 205A)', 'Left knee — change gauze and apply antiseptic', 'pending', 'medium', $3, NULL, 4),
        ('Physical therapy session — Robert Williams', 'Scheduled 2:00 PM — assist to therapy room', 'pending', 'medium', $4, NULL, 2),
        ('Morning medication round — Ward A', 'All Ward A residents, medication cart', 'completed', 'high', NULL, $5, NULL),
        ('Blood glucose reading — Helen Kowalski', 'Pre-breakfast reading recorded', 'completed', 'medium', NULL, $6, 5)`,
      [
        new Date(now + 1800000).toISOString(),
        new Date(now + 3600000).toISOString(),
        new Date(now + 7200000).toISOString(),
        new Date(now + 10800000).toISOString(),
        new Date(now - 7200000).toISOString(),
        new Date(now - 5400000).toISOString(),
      ]
    );

    // ── Messages ──
    await db.query(
      `INSERT INTO messages (sender_name, sender_role, content, created_at) VALUES
        ('Dr. Adams', 'Doctor', $1, $2),
        ('Nurse Sarah', 'Nurse', $3, $4),
        ('CNA Mike', 'CNA', $5, $6),
        ('Nurse Sarah', 'Nurse', $7, $8),
        ('Pharmacist Lisa', 'Pharmacist', $9, $10)`,
      [
        "Dorothy Garcia's glucose levels are concerning. Please increase monitoring to every 2 hours and let me know if it exceeds 280.",
        new Date(now - 7200000).toISOString(),
        "Understood, Dr. Adams. I'll adjust the schedule and keep you updated. Her last reading was 267 mg/dL at 10:15 AM.",
        new Date(now - 6900000).toISOString(),
        'Robert Williams is asking about his PT session time today. Should I confirm 2:00 PM?',
        new Date(now - 3600000).toISOString(),
        'Yes, 2:00 PM is confirmed. Please help him get ready by 1:45. He needs his walker.',
        new Date(now - 3300000).toISOString(),
        "Frank Nguyen's Levodopa has been restocked. Also, Margaret Chen's insulin prescription was updated — new dosage is 12 units.",
        new Date(now - 1800000).toISOString(),
      ]
    );

    // ── Readings ──
    await db.query(
      `INSERT INTO readings (resident_id, metric, value, unit, source, created_at) VALUES
        (1, 'glucose', 142, 'mg/dL', 'ble', $1),
        (1, 'hr', 72, 'bpm', 'ble', $2),
        (1, 'spo2', 97, '%', 'ble', $3),
        (1, 'bp_systolic', 128, 'mmHg', 'ble', $4),
        (3, 'glucose', 267, 'mg/dL', 'manual', $5),
        (3, 'hr', 88, 'bpm', 'ble', $6),
        (3, 'spo2', 94, '%', 'ble', $7),
        (3, 'bp_systolic', 145, 'mmHg', 'ble', $8)`,
      [
        new Date(now - 3600000).toISOString(),
        new Date(now - 3600000).toISOString(),
        new Date(now - 3600000).toISOString(),
        new Date(now - 3600000).toISOString(),
        new Date(now - 1800000).toISOString(),
        new Date(now - 1800000).toISOString(),
        new Date(now - 1800000).toISOString(),
        new Date(now - 1800000).toISOString(),
      ]
    );

    console.log('✅ Supabase database seeded with fresh timestamps');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

seed();
