/**
 * Creates the CareConnect tables in Supabase PostgreSQL.
 * Run once: node migrate.js
 */
const db = require('./db');

const schema = `
  -- Residents
  CREATE TABLE IF NOT EXISTS residents (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    room TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'stable',
    photo_url TEXT,
    age INTEGER,
    conditions JSONB DEFAULT '[]'::jsonb,
    latest_glucose JSONB
  );

  -- Alerts
  CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    resident_id INTEGER REFERENCES residents(id) ON DELETE CASCADE,
    resident_name TEXT,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Tasks
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    resident_id INTEGER REFERENCES residents(id) ON DELETE SET NULL
  );

  -- Messages
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Readings
  CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    resident_id INTEGER REFERENCES residents(id) ON DELETE CASCADE,
    metric TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Push notification tokens (APNs)
  CREATE TABLE IF NOT EXISTS push_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    platform TEXT NOT NULL DEFAULT 'ios',
    user_name TEXT,
    user_role TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

async function migrate() {
  try {
    console.log('🔄 Running migration...');
    await db.query(schema);
    console.log('✅ All tables created successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

migrate();
