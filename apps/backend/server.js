// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const db = require('./db');
const { generatePresignedUploadUrl, generatePresignedDownloadUrl, residentPhotoKey } = require('./services/s3Service');

const PORT = process.env.PORT || 3001;
const app = express();
const server = http.createServer(app);

// ──────────────────────────────────────────────
// WEBSOCKET — Real-time messaging
// ──────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws' });

// Connected clients: Map<ws, { userId, name, role }>
const clients = new Map();

function broadcast(data, excludeWs) {
  const payload = JSON.stringify(data);
  for (const [ws] of clients) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// Send to participants of a specific conversation
async function broadcastToConversation(conversationId, data, excludeWs) {
  try {
    const { rows: participants } = await db.query(
      'SELECT contact_name FROM conversation_participants WHERE conversation_id = $1',
      [conversationId]
    );
    const participantNames = new Set(participants.map(p => p.contact_name));
    const payload = JSON.stringify(data);
    for (const [ws, info] of clients) {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN && participantNames.has(info.name)) {
        ws.send(payload);
      }
    }
  } catch {
    // Fallback to global broadcast
    broadcast(data, excludeWs);
  }
}

function broadcastPresence() {
  const users = [];
  for (const [, info] of clients) {
    if (info.name) users.push({ name: info.name, role: info.role });
  }
  const payload = JSON.stringify({ type: 'presence', users });
  for (const [ws] of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  }
}

wss.on('connection', (ws) => {
  clients.set(ws, { userId: null, name: null, role: null });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    const info = clients.get(ws);

    switch (msg.type) {
      case 'join': {
        info.name = msg.name;
        info.role = msg.role;
        info.userId = msg.userId || msg.name;
        broadcastPresence();
        break;
      }
      case 'typing': {
        if (msg.conversationId) {
          broadcastToConversation(msg.conversationId, { type: 'typing', name: info.name, isTyping: msg.isTyping, conversationId: msg.conversationId }, ws);
        } else {
          broadcast({ type: 'typing', name: info.name, isTyping: msg.isTyping }, ws);
        }
        break;
      }
      case 'read_receipt': {
        if (msg.conversationId) {
          // Mark messages as read in DB
          db.query(
            `UPDATE messages SET read_by = array_append(read_by, $1) WHERE id = $2 AND NOT ($1 = ANY(read_by))`,
            [info.name, msg.messageId]
          ).catch(() => {});
          // Reset unread count for this participant
          db.query(
            'UPDATE conversation_participants SET unread_count = 0 WHERE conversation_id = $1 AND contact_name = $2',
            [msg.conversationId, info.name]
          ).catch(() => {});
          broadcastToConversation(msg.conversationId, { type: 'read_receipt', messageId: msg.messageId, reader: info.name, conversationId: msg.conversationId }, ws);
        } else {
          broadcast({ type: 'read_receipt', messageId: msg.messageId, reader: info.name }, ws);
        }
        break;
      }
      case 'call_event': {
        // Live call signaling
        if (msg.conversationId) {
          broadcastToConversation(msg.conversationId, {
            type: 'call_event',
            action: msg.action, // 'ringing', 'accepted', 'declined', 'ended'
            caller: info.name,
            callerRole: info.role,
            conversationId: msg.conversationId,
          }, ws);
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    broadcastPresence();
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// HEALTH CHECK — ALB / ECS target group probe
// ──────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable', ts: new Date().toISOString() });
  }
});

// ──────────────────────────────────────────────
// S3 PRESIGNED URLS — resident photo upload/download
// ──────────────────────────────────────────────

/** POST /api/residents/:id/photo-upload-url
 *  Returns a 5-minute presigned PUT URL for direct mobile→S3 upload.
 *  Body: { filename, contentType } */
app.post('/api/residents/:id/photo-upload-url', async (req, res) => {
  try {
    const { filename = 'photo.jpg', contentType = 'image/jpeg' } = req.body;
    const key = residentPhotoKey(req.params.id, filename);
    const uploadUrl = await generatePresignedUploadUrl(key, contentType);
    res.json({ uploadUrl, key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/residents/:id/photo-url?key=residents/42/photo.jpg
 *  Returns a 1-hour presigned GET URL to serve a resident photo. */
app.get('/api/residents/:id/photo-url', async (req, res) => {
  try {
    const key = req.query.key || residentPhotoKey(req.params.id);
    const downloadUrl = await generatePresignedDownloadUrl(key);
    res.json({ downloadUrl, key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// RESIDENTS
// ──────────────────────────────────────────────
app.get('/api/residents', async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM residents ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/residents/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM residents WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/residents — Create a new resident */
app.post('/api/residents', async (req, res) => {
  console.log('POST /api/residents HIT — body keys:', Object.keys(req.body || {}));
  try {
    const {
      name, room, status, photo_url, age, conditions, latest_glucose,
      date_of_birth, gender, medicare_number, emergency_contact,
      gp_name, gp_phone, allergies, medications, medical_history,
      care_level, admission_date, notes,
    } = req.body;
    if (!name || !room) return res.status(400).json({ error: 'Name and room are required' });

    const { rows } = await db.query(
      `INSERT INTO residents (
        name, room, status, photo_url, age, conditions, latest_glucose,
        date_of_birth, gender, medicare_number, emergency_contact,
        gp_name, gp_phone, allergies, medications, medical_history,
        care_level, admission_date, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        RETURNING *`,
      [
        name, room, status || 'stable', photo_url || null, age || null,
        JSON.stringify(conditions || []), latest_glucose ? JSON.stringify(latest_glucose) : null,
        date_of_birth || null, gender || null, medicare_number || null,
        emergency_contact ? JSON.stringify(emergency_contact) : null,
        gp_name || null, gp_phone || null,
        JSON.stringify(allergies || []), JSON.stringify(medications || []),
        JSON.stringify(medical_history || []),
        care_level || 'standard', admission_date || new Date().toISOString(), notes || null,
      ]
    );

    // Broadcast new resident via WebSocket
    broadcast({ type: 'resident_added', resident: rows[0] });
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/residents/:id — Update a resident */
app.patch('/api/residents/:id', async (req, res) => {
  try {
    const fields = [];
    const values = [];
    let i = 1;
    for (const [key, val] of Object.entries(req.body)) {
      fields.push(`${key} = $${i++}`);
      values.push(typeof val === 'object' && val !== null ? JSON.stringify(val) : val);
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    values.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE residents SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    broadcast({ type: 'resident_updated', resident: rows[0] });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/residents/:id — Remove a resident */
app.delete('/api/residents/:id', async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM residents WHERE id = $1 RETURNING id, name', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    broadcast({ type: 'resident_removed', residentId: rows[0].id });
    res.json({ deleted: true, ...rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/residents/:id/health-summary — Health analysis for a resident */
app.get('/api/residents/:id/health-summary', async (req, res) => {
  try {
    const { rows: rRows } = await db.query('SELECT * FROM residents WHERE id = $1', [req.params.id]);
    if (!rRows.length) return res.status(404).json({ error: 'Not found' });
    const resident = rRows[0];

    // Latest readings for each metric
    const { rows: readings } = await db.query(
      `SELECT DISTINCT ON (metric) metric, value, unit, source, created_at
       FROM readings WHERE resident_id = $1
       ORDER BY metric, created_at DESC`, [req.params.id]
    );

    // Recent alerts
    const { rows: alerts } = await db.query(
      `SELECT * FROM alerts WHERE resident_id = $1 ORDER BY created_at DESC LIMIT 10`, [req.params.id]
    );

    // Pending tasks
    const { rows: tasks } = await db.query(
      `SELECT * FROM tasks WHERE resident_id = $1 AND status = 'pending' ORDER BY id`, [req.params.id]
    );

    // Health risk analysis
    const risks = [];
    for (const r of readings) {
      const th = AU_CLINICAL_THRESHOLDS[r.metric];
      if (!th) continue;
      if (r.value >= (th.critical_high || Infinity)) {
        risks.push({ metric: r.metric, level: 'critical', direction: 'high', value: r.value, threshold: th.critical_high, guideline: th.guideline, snomed: th.snomedCode });
      } else if (r.value >= (th.warning_high || Infinity)) {
        risks.push({ metric: r.metric, level: 'warning', direction: 'high', value: r.value, threshold: th.warning_high, guideline: th.guideline, snomed: th.snomedCode });
      } else if (r.value <= (th.critical_low || -Infinity)) {
        risks.push({ metric: r.metric, level: 'critical', direction: 'low', value: r.value, threshold: th.critical_low, guideline: th.guideline, snomed: th.snomedCode });
      } else if (r.value <= (th.warning_low || -Infinity)) {
        risks.push({ metric: r.metric, level: 'warning', direction: 'low', value: r.value, threshold: th.warning_low, guideline: th.guideline, snomed: th.snomedCode });
      }
    }

    const overallRisk = risks.some(r => r.level === 'critical') ? 'critical'
      : risks.some(r => r.level === 'warning') ? 'warning' : 'stable';

    res.json({
      resident: { id: resident.id, name: resident.name, room: resident.room, status: resident.status, age: resident.age, care_level: resident.care_level },
      vitals: readings.reduce((acc, r) => { acc[r.metric] = r; return acc; }, {}),
      alerts: { total: alerts.length, critical: alerts.filter(a => a.severity === 'critical').length, recent: alerts.slice(0, 5) },
      tasks: { pending: tasks.length, items: tasks.slice(0, 5) },
      riskAnalysis: { overallRisk, risks, assessedAt: new Date().toISOString() },
      conditions: resident.conditions || [],
      medications: resident.medications || [],
      allergies: resident.allergies || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// ALERTS
// ──────────────────────────────────────────────
app.get('/api/alerts', async (req, res) => {
  try {
    let text = 'SELECT * FROM alerts';
    const params = [];
    // status=all means return everything — skip the filter
    if (req.query.status && req.query.status !== 'all') {
      text += ' WHERE status = $1';
      params.push(req.query.status);
    }
    text += ' ORDER BY created_at DESC';
    const { rows } = await db.query(text, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/alerts/:id', async (req, res) => {
  try {
    const fields = [];
    const values = [];
    let i = 1;
    for (const [key, val] of Object.entries(req.body)) {
      fields.push(`${key} = $${i++}`);
      values.push(val);
    }
    values.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE alerts SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    // Broadcast acknowledgement event via WebSocket
    if (req.body.status === 'acknowledged') {
      broadcast({ type: 'alert_acknowledged', alert: rows[0] });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// AU HEALTH CENTRE — Escalation & Clinical Context
// ──────────────────────────────────────────────

// Australian clinical thresholds (ACSQHC + Between the Flags)
const AU_CLINICAL_THRESHOLDS = {
  glucose: {
    snomedCode: '33747003', display: 'Blood glucose level',
    critical_high: 250, warning_high: 180, normal_min: 70, warning_low: 69, critical_low: 53,
    guideline: 'RACGP — Diabetes Management in Aged Care',
  },
  spo2: {
    snomedCode: '431314004', display: 'Peripheral oxygen saturation',
    critical_low: 89, warning_low: 93, normal_min: 94,
    guideline: 'Between the Flags — NSW Clinical Excellence Commission',
  },
  heart_rate: {
    snomedCode: '364075005', display: 'Heart rate',
    critical_high: 130, warning_high: 100, normal_min: 60, warning_low: 59, critical_low: 49,
    guideline: 'Between the Flags — NSW Clinical Excellence Commission',
  },
  blood_pressure: {
    snomedCode: '271649006', display: 'Systolic blood pressure',
    critical_high: 180, warning_high: 140, normal_min: 100, warning_low: 99, critical_low: 89,
    guideline: 'Heart Foundation Australia — Hypertension Guidelines',
  },
  temperature: {
    snomedCode: '386725007', display: 'Body temperature',
    critical_high: 39.5, warning_high: 38.0, normal_min: 36.0, warning_low: 35.9, critical_low: 34.9,
    guideline: 'ACSQHC — Recognising & Responding to Clinical Deterioration',
  },
};

const SNOMED_ALERT_MAP = {
  glucose:  { high: { code: '80394007', display: 'Hyperglycaemia' }, low: { code: '302866003', display: 'Hypoglycaemia' } },
  spo2:     { low: { code: '389087006', display: 'Hypoxaemia' } },
  heart_rate: { high: { code: '3424008', display: 'Tachycardia' }, low: { code: '48867003', display: 'Bradycardia' } },
  blood_pressure: { high: { code: '38341003', display: 'Hypertensive disorder' }, low: { code: '45007003', display: 'Hypotension' } },
  temperature: { high: { code: '386661006', display: 'Fever' }, low: { code: '386689009', display: 'Hypothermia' } },
  medication: { missed: { code: '182834008', display: 'Drug treatment not indicated' }, interaction: { code: '419511003', display: 'Drug interaction' } },
};

const AU_ESCALATION = {
  emergency: {
    level: 1, label: 'Emergency — Triple Zero (000)',
    action: 'Call 000 for ambulance. Begin first aid as appropriate.',
    contacts: [{ name: 'Triple Zero', phone: '000', type: 'emergency' }],
    nsqhs: 'NSQHS Standard 8 — Escalation Tier 3 (MET/Code Blue)',
  },
  urgent: {
    level: 2, label: 'Urgent — Health Direct / Nurse-on-Call',
    action: 'Contact facility GP or Nurse-on-Call. Prepare ISBAR handover.',
    contacts: [
      { name: 'Health Direct Australia', phone: '1800 022 222', type: 'healthline' },
      { name: 'Nurse-on-Call (VIC)', phone: '1300 60 60 24', type: 'nursing' },
    ],
    nsqhs: 'NSQHS Standard 8 — Escalation Tier 2 (Rapid Response)',
  },
  routine: {
    level: 3, label: 'Routine — GP Review',
    action: 'Document in clinical notes. Include in next GP review handover.',
    contacts: [{ name: 'My Aged Care', phone: '1800 200 422', type: 'agedcare' }],
    nsqhs: 'NSQHS Standard 8 — Escalation Tier 1 (Clinical Review)',
  },
};

function resolveEscalation(severity) {
  if (severity === 'critical') return AU_ESCALATION.emergency;
  if (severity === 'warning') return AU_ESCALATION.urgent;
  return AU_ESCALATION.routine;
}

function resolveSNOMED(type, message) {
  const codes = SNOMED_ALERT_MAP[type];
  if (!codes) return null;
  const msg = (message || '').toLowerCase();
  if (msg.includes('high') || msg.includes('elevated') || msg.includes('above')) return codes.high;
  if (msg.includes('low') || msg.includes('below') || msg.includes('drop')) return codes.low;
  return codes.high || codes.low || codes.missed || null;
}

/** GET /api/alerts/:id/clinical-context — AU clinical context for an alert */
app.get('/api/alerts/:id/clinical-context', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Alert not found' });
    const alert = rows[0];
    const snomed = resolveSNOMED(alert.type, alert.message);
    const escalation = resolveEscalation(alert.severity);
    const threshold = AU_CLINICAL_THRESHOLDS[alert.type] || null;

    res.json({
      alert_id: alert.id,
      snomed: snomed ? { system: 'http://snomed.info/sct', ...snomed } : null,
      escalation,
      threshold: threshold ? { snomedCode: threshold.snomedCode, display: threshold.display, guideline: threshold.guideline } : null,
      fhirFlag: {
        resourceType: 'Flag',
        meta: { profile: ['http://hl7.org.au/fhir/core/StructureDefinition/au-core-flag'] },
        status: alert.status === 'acknowledged' ? 'inactive' : 'active',
        code: { coding: snomed ? [{ system: 'http://snomed.info/sct', code: snomed.code, display: snomed.display }] : [], text: alert.message },
        subject: { reference: `Patient/${alert.resident_id}`, display: alert.resident_name },
        period: { start: alert.created_at },
      },
      isbar: {
        identify: { facility: 'CareConnect Aged Care', patient: alert.resident_name },
        situation: { description: alert.message, severity: alert.severity, snomed: snomed?.display },
        background: { residentId: alert.resident_id, createdAt: alert.created_at },
        assessment: { level: escalation.label, nsqhs: escalation.nsqhs },
        recommendation: { action: escalation.action, contacts: escalation.contacts },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/alerts/:id/escalate — Escalate alert to AU health centre */
app.post('/api/alerts/:id/escalate', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Alert not found' });
    const alert = rows[0];

    const snomed = resolveSNOMED(alert.type, alert.message);
    const escalation = resolveEscalation(alert.severity);
    const escalatedTo = escalation.contacts[0]?.name || 'Health Direct Australia';

    // Update alert with escalation data
    const { rows: updated } = await db.query(
      `UPDATE alerts SET
        escalation_level = $1,
        escalated_at = NOW(),
        escalated_to = $2,
        snomed_code = $3,
        snomed_display = $4,
        au_clinical_notes = $5,
        status = 'escalated'
       WHERE id = $6 RETURNING *`,
      [
        escalation.label,
        escalatedTo,
        snomed?.code || null,
        snomed?.display || null,
        `Escalated via NSQHS Standard 8 protocol. ${escalation.nsqhs}`,
        req.params.id,
      ]
    );

    // Broadcast escalation event via WebSocket
    broadcast({
      type: 'alert_escalated',
      alert: updated[0],
      escalation,
    });

    res.json({
      escalated: true,
      alert: updated[0],
      escalation,
      isbar: {
        identify: { facility: 'CareConnect Aged Care', patient: alert.resident_name },
        situation: { description: alert.message, severity: alert.severity, snomed: snomed?.display },
        background: { residentId: alert.resident_id, createdAt: alert.created_at },
        assessment: { level: escalation.label, nsqhs: escalation.nsqhs },
        recommendation: { action: escalation.action, contacts: escalation.contacts },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// TASKS
// ──────────────────────────────────────────────
app.get('/api/tasks', async (req, res) => {
  try {
    let text = 'SELECT * FROM tasks';
    const params = [];
    if (req.query.status && req.query.status !== 'all') {
      text += ' WHERE status = $1';
      params.push(req.query.status);
    }
    // Support residentId / resident_id filter
    const residentId = req.query.residentId || req.query.resident_id;
    if (residentId) {
      text += params.length ? ' AND' : ' WHERE';
      params.push(residentId);
      text += ` resident_id = $${params.length}`;
    }
    text += ' ORDER BY id';
    const { rows } = await db.query(text, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, status, priority, due_at, resident_id } = req.body;
    const { rows } = await db.query(
      `INSERT INTO tasks (title, description, status, priority, due_at, resident_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, status || 'pending', priority || 'medium', due_at || null, resident_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const fields = [];
    const values = [];
    let i = 1;
    for (const [key, val] of Object.entries(req.body)) {
      fields.push(`${key} = $${i++}`);
      values.push(val);
    }
    values.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// CONTACTS (Stakeholder Directory)
// ──────────────────────────────────────────────
app.get('/api/contacts', async (req, res) => {
  try {
    let text = 'SELECT * FROM contacts';
    const params = [];
    if (req.query.type) {
      text += ' WHERE stakeholder_type = $1';
      params.push(req.query.type);
    }
    text += ' ORDER BY stakeholder_type, name';
    const { rows } = await db.query(text, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const { name, role, stakeholder_type, organization, phone, email } = req.body;
    if (!name || !role) return res.status(400).json({ error: 'Name and role are required' });
    const { rows } = await db.query(
      `INSERT INTO contacts (name, role, stakeholder_type, organization, phone, email)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, role, stakeholder_type || 'external', organization || null, phone || null, email || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// CONVERSATIONS
// ──────────────────────────────────────────────

/** GET /api/conversations?user=Nurse Sarah — list conversations for a user */
app.get('/api/conversations', async (req, res) => {
  try {
    const userName = req.query.user || 'Nurse Sarah';
    const { rows } = await db.query(`
      SELECT c.*,
        (SELECT json_agg(json_build_object('name', cp2.contact_name, 'role', cp2.contact_role, 'type', cp2.stakeholder_type))
         FROM conversation_participants cp2 WHERE cp2.conversation_id = c.id) as participants,
        COALESCE(cp.unread_count, 0) as unread_count
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.contact_name = $1
      ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
    `, [userName]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/conversations — create a new conversation */
app.post('/api/conversations', async (req, res) => {
  try {
    const { title, type, created_by, participants } = req.body;
    if (!created_by || !participants?.length) {
      return res.status(400).json({ error: 'created_by and participants are required' });
    }

    // For direct messages, check if one already exists between these two people
    if (type === 'direct' && participants.length === 2) {
      const { rows: existing } = await db.query(`
        SELECT c.id FROM conversations c
        WHERE c.type = 'direct'
        AND (SELECT COUNT(*) FROM conversation_participants cp WHERE cp.conversation_id = c.id) = 2
        AND EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = c.id AND cp.contact_name = $1)
        AND EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = c.id AND cp.contact_name = $2)
      `, [participants[0].name, participants[1].name]);

      if (existing.length > 0) {
        // Return existing conversation with full data
        const { rows: [conv] } = await db.query(`
          SELECT c.*,
            (SELECT json_agg(json_build_object('name', cp2.contact_name, 'role', cp2.contact_role, 'type', cp2.stakeholder_type))
             FROM conversation_participants cp2 WHERE cp2.conversation_id = c.id) as participants
          FROM conversations c WHERE c.id = $1
        `, [existing[0].id]);
        return res.json(conv);
      }
    }

    const { rows: [conv] } = await db.query(
      `INSERT INTO conversations (title, type, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [title || null, type || 'direct', created_by]
    );

    for (const p of participants) {
      await db.query(
        'INSERT INTO conversation_participants (conversation_id, contact_name, contact_role, stakeholder_type) VALUES ($1, $2, $3, $4)',
        [conv.id, p.name, p.role, p.stakeholder_type || 'internal']
      );
    }

    // Fetch with participants
    const { rows: [result] } = await db.query(`
      SELECT c.*,
        (SELECT json_agg(json_build_object('name', cp2.contact_name, 'role', cp2.contact_role, 'type', cp2.stakeholder_type))
         FROM conversation_participants cp2 WHERE cp2.conversation_id = c.id) as participants
      FROM conversations c WHERE c.id = $1
    `, [conv.id]);

    // Notify participants via WebSocket
    broadcastToConversation(conv.id, { type: 'conversation_created', conversation: result });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/conversations/:id/messages — messages in a conversation */
app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const before = req.query.before;
    let text = 'SELECT * FROM messages WHERE conversation_id = $1';
    const params = [req.params.id];
    if (before) {
      text += ' AND created_at < $2';
      params.push(before);
    }
    text += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    const { rows } = await db.query(text, params);
    res.json(rows.reverse()); // Return in chronological order
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/conversations/:id/messages — send message to a conversation */
app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { sender_name, sender_role, content, message_type } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const { rows: [newMsg] } = await db.query(
      `INSERT INTO messages (sender_name, sender_role, content, conversation_id, message_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sender_name, sender_role, content, req.params.id, message_type || 'text']
    );

    // Update conversation last_message
    await db.query(
      `UPDATE conversations SET last_message_preview = $1, last_message_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [content.substring(0, 100), req.params.id]
    );

    // Increment unread count for other participants
    await db.query(
      `UPDATE conversation_participants SET unread_count = unread_count + 1 WHERE conversation_id = $1 AND contact_name != $2`,
      [req.params.id, sender_name]
    );

    // Broadcast to conversation participants via WebSocket
    broadcastToConversation(req.params.id, {
      type: 'new_message',
      message: newMsg,
      conversationId: parseInt(req.params.id),
    });

    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// MESSAGES (legacy broadcast — kept for backward compatibility)
// ──────────────────────────────────────────────
app.get('/api/messages', async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM messages ORDER BY created_at');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { sender_name, sender_role, content } = req.body;
    const { rows } = await db.query(
      `INSERT INTO messages (sender_name, sender_role, content) VALUES ($1, $2, $3) RETURNING *`,
      [sender_name, sender_role, content]
    );
    const newMsg = rows[0];
    // Broadcast to all WebSocket clients
    broadcast({ type: 'new_message', message: newMsg });
    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// PUSH TOKEN REGISTRATION (APNs)
// ──────────────────────────────────────────────
app.post('/api/push-tokens', async (req, res) => {
  try {
    const { token, platform, user_name, user_role } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    // Upsert: insert or update on conflict
    await db.query(
      `INSERT INTO push_tokens (token, platform, user_name, user_role, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (token) DO UPDATE SET user_name = $3, user_role = $4, updated_at = NOW()`,
      [token, platform || 'ios', user_name, user_role]
    );
    res.json({ registered: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/push-tokens/:token', async (req, res) => {
  try {
    await db.query('DELETE FROM push_tokens WHERE token = $1', [req.params.token]);
    res.json({ unregistered: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// READINGS
// ──────────────────────────────────────────────
app.get('/api/readings', async (req, res) => {
  try {
    let text = 'SELECT * FROM readings';
    const params = [];
    const residentId = req.query.residentId || req.query.resident_id;
    if (residentId) {
      text += ' WHERE resident_id = $1';
      params.push(residentId);
    }
    text += ' ORDER BY created_at DESC';
    const { rows } = await db.query(text, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/readings', async (req, res) => {
  try {
    const { resident_id, metric, value, unit, source } = req.body;
    const { rows } = await db.query(
      `INSERT INTO readings (resident_id, metric, value, unit, source)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [resident_id, metric, value, unit, source || 'manual']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// BACKUP / RESTORE (iCloud sync support)
// ──────────────────────────────────────────────
app.get('/api/backup', async (_req, res) => {
  try {
    const tables = ['residents', 'alerts', 'tasks', 'messages', 'readings', 'contacts', 'conversations', 'conversation_participants'];
    const snapshot = {};
    for (const table of tables) {
      const { rows } = await db.query(`SELECT * FROM ${table} ORDER BY id`);
      snapshot[table] = rows;
    }
    snapshot.exportedAt = new Date().toISOString();
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backup/restore', async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const tables = ['readings', 'conversation_participants', 'messages', 'conversations', 'contacts', 'tasks', 'alerts', 'residents'];

    // Clear in reverse FK order
    for (const table of tables) {
      await client.query(`DELETE FROM ${table}`);
    }

    // Insert in FK order (residents first), preserving original IDs
    const insertOrder = ['residents', 'alerts', 'tasks', 'contacts', 'conversations', 'conversation_participants', 'messages', 'readings'];
    const counts = {};
    for (const table of insertOrder) {
      const rows = req.body[table];
      if (!Array.isArray(rows) || !rows.length) {
        counts[table] = 0;
        continue;
      }
      for (const row of rows) {
        const cols = Object.keys(row);
        const vals = cols.map((c) => {
          const v = row[c];
          return v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
        });
        const placeholders = cols.map((_, i) => `$${i + 1}`);
        await client.query(
          `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`,
          vals
        );
      }
      counts[table] = rows.length;
      // Reset sequence to max id
      await client.query(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1))`
      );
    }

    await client.query('COMMIT');
    res.json({ restored: true, counts, restoredAt: new Date().toISOString() });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ──────────────────────────────────────────────
// START
// ──────────────────────────────────────────────
server.listen(PORT, () => {
  const dbLabel = process.env.NODE_ENV === 'production' ? 'AWS RDS PostgreSQL (ap-southeast-2)' : 'Supabase PostgreSQL';
  console.log(`\n  🏥 CareConnect API Server running at http://localhost:${PORT}`);
  console.log(`  🔌 WebSocket server running at ws://localhost:${PORT}/ws`);
  console.log(`  🐘 Connected to ${dbLabel}`);
  console.log(`  📋 Endpoints:`);
  console.log(`     GET    /health`);
  console.log(`     GET    /api/residents`);
  console.log(`     GET    /api/residents/:id`);
  console.log(`     POST   /api/residents`);
  console.log(`     PATCH  /api/residents/:id`);
  console.log(`     DELETE /api/residents/:id`);
  console.log(`     GET    /api/residents/:id/health-summary`);
  console.log(`     POST   /api/residents/:id/photo-upload-url`);
  console.log(`     GET    /api/residents/:id/photo-url`);
  console.log(`     GET    /api/alerts?status=open`);
  console.log(`     PATCH  /api/alerts/:id`);
  console.log(`     GET    /api/tasks?status=all`);
  console.log(`     PATCH  /api/tasks/:id`);
  console.log(`     POST   /api/tasks`);
  console.log(`     GET    /api/messages`);
  console.log(`     POST   /api/messages`);
  console.log(`     GET    /api/contacts?type=internal|external`);
  console.log(`     POST   /api/contacts`);
  console.log(`     GET    /api/conversations?user=Name`);
  console.log(`     POST   /api/conversations`);
  console.log(`     GET    /api/conversations/:id/messages`);
  console.log(`     POST   /api/conversations/:id/messages`);
  console.log(`     POST   /api/push-tokens`);
  console.log(`     DELETE /api/push-tokens/:token`);
  console.log(`     GET    /api/readings?residentId=:id`);
  console.log(`     POST   /api/readings`);
  console.log(`     GET    /api/backup`);
  console.log(`     POST   /api/backup/restore`);
  console.log(`     WS     /ws  (real-time messaging)\n`);
});
