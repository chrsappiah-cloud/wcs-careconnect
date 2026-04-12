const express = require('express');
const cors = require('cors');
const db = require('./db');

const PORT = process.env.PORT || 3001;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
    res.json(rows[0]);
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
// MESSAGES
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
    res.status(201).json(rows[0]);
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
    const tables = ['residents', 'alerts', 'tasks', 'messages', 'readings'];
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
    const tables = ['readings', 'messages', 'tasks', 'alerts', 'residents'];

    // Clear in reverse FK order
    for (const table of tables) {
      await client.query(`DELETE FROM ${table}`);
    }

    // Insert in FK order (residents first), preserving original IDs
    const insertOrder = ['residents', 'alerts', 'tasks', 'messages', 'readings'];
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
app.listen(PORT, () => {
  console.log(`\n  🏥 CareConnect API Server running at http://localhost:${PORT}`);
  console.log(`  🐘 Connected to Supabase PostgreSQL`);
  console.log(`  📋 Endpoints:`);
  console.log(`     GET    /api/residents`);
  console.log(`     GET    /api/residents/:id`);
  console.log(`     GET    /api/alerts?status=open`);
  console.log(`     PATCH  /api/alerts/:id`);
  console.log(`     GET    /api/tasks?status=all`);
  console.log(`     PATCH  /api/tasks/:id`);
  console.log(`     POST   /api/tasks`);
  console.log(`     GET    /api/messages`);
  console.log(`     POST   /api/messages`);
  console.log(`     GET    /api/readings?residentId=:id`);
  console.log(`     POST   /api/readings`);
  console.log(`     GET    /api/backup`);
  console.log(`     POST   /api/backup/restore\n`);
});
