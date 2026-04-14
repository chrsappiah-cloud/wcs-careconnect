#!/usr/bin/env node
// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
/**
 * release-check.js
 *
 * Automated pre-release gate for CareConnect.
 * Run from the repo root:   node scripts/release-check.js
 *
 * Exits 0 only when all automated checks pass.
 * Prints a human checklist at the end regardless of outcome.
 */

'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MOBILE = path.join(ROOT, 'apps', 'mobile');
const SRC = path.join(MOBILE, 'src');

const PASS = '\x1b[32m✔\x1b[0m';
const FAIL = '\x1b[31m✘\x1b[0m';
const WARN = '\x1b[33m⚠\x1b[0m';
const SECTION = '\x1b[1m\x1b[36m';
const RESET = '\x1b[0m';

let exitCode = 0;

function pass(msg) { console.log(`  ${PASS}  ${msg}`); }
function fail(msg) { console.log(`  ${FAIL}  ${msg}`); exitCode = 1; }
function warn(msg) { console.log(`  ${WARN}  ${msg}`); }
function section(title) { console.log(`\n${SECTION}── ${title} ──${RESET}`); }

// ─── 1. Version sanity check ─────────────────────────────────────────────────

section('Version');

const pkgPath = path.join(MOBILE, 'package.json');
const appJsonPath = path.join(MOBILE, 'app.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const expo = appJson.expo || {};

const semverRe = /^\d+\.\d+\.\d+$/;
if (!semverRe.test(pkg.version)) {
  fail(`package.json version "${pkg.version}" is not a valid semver string`);
} else {
  pass(`package.json version: ${pkg.version}`);
}

if (expo.version && expo.version !== pkg.version) {
  warn(
    `app.json version (${expo.version}) does not match package.json version (${pkg.version})`
  );
} else if (expo.version) {
  pass(`app.json version matches: ${expo.version}`);
}

// ─── 2. Source code quality check ────────────────────────────────────────────

section('Source quality');

const BLOCKERS = [
  { pattern: /\bconsole\.error\b/, label: 'console.error' },
  { pattern: /\bconsole\.warn\b/, label: 'console.warn' },
];

const WARNINGS = [
  { pattern: /\bTODO\b/, label: 'TODO comment' },
  { pattern: /\bFIXME\b/, label: 'FIXME comment' },
  { pattern: /\bHACK\b/, label: 'HACK comment' },
  { pattern: /\bdebugger\b/, label: 'debugger statement' },
];

function walkSrc(dir, exts = ['.js', '.jsx', '.ts', '.tsx']) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '__tests__' || e.name.endsWith('.test.js')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkSrc(full, exts).forEach((f) => files.push(f));
    else if (exts.some((x) => e.name.endsWith(x))) files.push(full);
  }
  return files;
}

const srcFiles = walkSrc(SRC);
const blockerHits = [];
const warningHits = [];

for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    for (const b of BLOCKERS) {
      if (b.pattern.test(line)) blockerHits.push(`${rel}:${i + 1} [${b.label}]`);
    }
    for (const w of WARNINGS) {
      if (w.pattern.test(line)) warningHits.push(`${rel}:${i + 1} [${w.label}]`);
    }
  });
}

if (blockerHits.length > 0) {
  fail(`Found ${blockerHits.length} source quality blocker(s):`);
  blockerHits.forEach((h) => console.log(`       ${h}`));
  console.log('     Fix or wrap these before releasing — they indicate debug code left in production.');
} else {
  pass('No console.error / console.warn in source');
}

if (warningHits.length > 0) {
  warn(`Found ${warningHits.length} advisory comment(s) — review before release:`);
  warningHits.forEach((h) => console.log(`       ${h}`));
} else {
  pass('No TODO / FIXME / HACK / debugger in source');
}

// ─── 3. Full test suite ───────────────────────────────────────────────────────

section('Test suite');

console.log('  Running jest (this takes ~20–30 s)…');

const jestBin = path.join(MOBILE, 'node_modules', '.bin', 'jest');
const jestResult = spawnSync(
  process.execPath,
  [
    jestBin,
    '--watchAll=false',
    '--forceExit',
    '--maxWorkers=2',
    '--no-watchman',
    '--rootDir', MOBILE,
    '--no-coverage',
    '--ci',
  ],
  {
    cwd: MOBILE,
    env: { ...process.env, FORCE_COLOR: '0' },
    encoding: 'utf8',
    timeout: 300000,
  }
);

const jestOutput = (jestResult.stdout || '') + (jestResult.stderr || '');
const summary = jestOutput.split('\n').filter((l) =>
  /PASS|FAIL|Tests:|Test Suites:|Time:|●/.test(l)
);

summary.forEach((l) => console.log('  ' + l));

if (jestResult.status !== 0) {
  fail('Test suite FAILED — do not release with failing tests');
} else {
  pass('All tests pass');
}

// ─── 4. Dependency vulnerability check (npm audit) ───────────────────────────

section('Dependency audit');

const auditResult = spawnSync('npm', ['audit', '--json', '--audit-level=critical'], {
  cwd: MOBILE,
  encoding: 'utf8',
  timeout: 60000,
});

try {
  const auditJson = JSON.parse(auditResult.stdout || '{}');
  const critCount = auditJson?.metadata?.vulnerabilities?.critical ?? 0;
  const highCount = auditJson?.metadata?.vulnerabilities?.high ?? 0;

  if (critCount > 0) {
    fail(`${critCount} critical vulnerabilit${critCount === 1 ? 'y' : 'ies'} detected — run "npm audit fix"`);
  } else {
    pass('No critical vulnerabilities');
  }
  if (highCount > 0) {
    warn(`${highCount} high-severity vulnerabilit${highCount === 1 ? 'y' : 'ies'} — review before release`);
  }
} catch {
  warn('Could not parse npm audit output — review manually');
}

// ─── 5. Environment variable check ───────────────────────────────────────────

section('Environment');

const requiredEnvs = [
  'EXPO_PUBLIC_CREATE_API_URL',
  'EXPO_PUBLIC_WS_URL',
];

const envFile = path.join(MOBILE, '.env');
const envContents = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';

for (const key of requiredEnvs) {
  if (process.env[key] || envContents.includes(key)) {
    pass(`${key} is set`);
  } else {
    warn(`${key} not found in environment or .env — confirm it is set in EAS secrets`);
  }
}

// ─── 6. Human release checklist ──────────────────────────────────────────────

section('Human checklist (manual verification required)');

const checklist = [
  'Version bumped in package.json AND app.json AND any native build files',
  'CHANGELOG / release notes updated with summary of changes',
  'Tested on a physical iOS device (not just simulator)',
  'Tested on a physical Android device (not just emulator)',
  'Push notifications confirmed working (production APNs / FCM certificates)',
  'Deep links and universal links validated',
  'Offline mode verified: app degrades gracefully with no network',
  'All feature flags for this release are toggled ON in production config',
  'Backend deployment / migrations complete before mobile release',
  'App Store Connect metadata (screenshots, description, keywords) up to date',
  'Google Play Console metadata up to date',
  'EAS build submitted and tested via TestFlight / internal testing track',
  'Crash-free rate baseline noted before rollout (check error log in settings)',
  'Rollout plan agreed: 10 % → 50 % → 100 % staged rollout',
  'Communication sent to stakeholders / support team',
];

checklist.forEach((item, i) => {
  console.log(`  [ ]  ${i + 1}. ${item}`);
});

// ─── Result ───────────────────────────────────────────────────────────────────

console.log();
if (exitCode === 0) {
  console.log(`${PASS} Automated checks passed. Complete the human checklist before submitting.\n`);
} else {
  console.log(`${FAIL} One or more automated checks failed. Resolve all failures before releasing.\n`);
}

process.exit(exitCode);
