'use strict';
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');
require('dotenv').config();

// SSL: production uses RDS CA bundle; development accepts self-signed
function buildSslConfig() {
  if (process.env.NODE_ENV !== 'production') {
    return { rejectUnauthorized: false };
  }
  const caPath = process.env.RDS_CA_BUNDLE || path.join(__dirname, 'certs', 'global-bundle.pem');
  if (fs.existsSync(caPath)) {
    return { rejectUnauthorized: true, ca: fs.readFileSync(caPath) };
  }
  return { rejectUnauthorized: true };
}

// Supports DATABASE_URL (Supabase / dev) or individual host vars (ECS + Secrets Manager)
function buildConnectionConfig() {
  const ssl = buildSslConfig();
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl };
  }
  return {
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT     || '5432',  10),
    database: process.env.DB_NAME              || 'careconnect',
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl,
  };
}

const pool = new Pool({
  ...buildConnectionConfig(),
  max:                     parseInt(process.env.DB_POOL_MAX        || '10',    10),
  idleTimeoutMillis:       parseInt(process.env.DB_IDLE_TIMEOUT    || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '5000',  10),
});

pool.on('error', (err) => {
  console.error('[db] idle client error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
