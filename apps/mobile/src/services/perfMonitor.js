/**
 * perfMonitor.js
 *
 * Lightweight performance monitoring for CareConnect mobile app.
 *
 * Usage:
 *   import { startMark, endMark, getPerfLog, clearPerfLog, monitoredFetch } from './perfMonitor';
 *
 *   // API call timing:
 *   const { apiFetch: monitoredApiFetch } = monitoredFetch;
 *
 *   // Manual timing:
 *   startMark('MyScreen:render');
 *   // ... expensive work ...
 *   await endMark('MyScreen:render');   // persists automatically
 *
 *   // Inside components, use the usePerfMark hook instead.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';

const STORAGE_KEY = '@careconnect_perf_log';
const MAX_ENTRIES = 200;
const SLOW_THRESHOLD_MS = 300;
const SLOW_API_THRESHOLD_MS = 2000;

// In-memory mark start times keyed by label
const _marks = new Map();

// ─── Core primitives ────────────────────────────────────────────────────────

/**
 * Record the start time for a named mark.
 * @param {string} label
 */
export function startMark(label) {
  _marks.set(label, performance.now());
}

/**
 * Finalize a named mark, persist it, and return the duration.
 * @param {string} label
 * @param {{ category?: string }} [meta]
 * @returns {Promise<number|null>} Elapsed milliseconds, or null if startMark was never called.
 */
export async function endMark(label, meta = {}) {
  const start = _marks.get(label);
  if (start === undefined) return null;

  const duration = Math.round(performance.now() - start);
  _marks.delete(label);

  const threshold =
    meta.category === 'api' ? SLOW_API_THRESHOLD_MS : SLOW_THRESHOLD_MS;

  const entry = {
    label,
    duration,
    category: meta.category || 'custom',
    slow: duration > threshold,
    ts: Date.now(),
  };

  if (__DEV__ && entry.slow) {
    console.warn(
      `[PerfMonitor] Slow ${entry.category}: "${label}" took ${duration} ms (threshold ${threshold} ms)`
    );
  }

  await _persist(entry);
  return duration;
}

// ─── React hook ──────────────────────────────────────────────────────────────

/**
 * Hook that automatically marks the mount → meaningful render window of a screen.
 *
 * @param {string} screenName  Should match the route/screen name, e.g. 'Home', 'Patients'.
 *
 * @example
 *   export default function HomeScreen() {
 *     usePerfMark('Home');
 *     // ...
 *   }
 */
export function usePerfMark(screenName) {
  const label = `screen:${screenName}`;
  const called = useRef(false);

  // Set start time synchronously on first render
  if (!called.current) {
    called.current = true;
    startMark(label);
  }

  useEffect(() => {
    // After layout is committed, consider the screen "rendered"
    endMark(label, { category: 'screen' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── API wrapper ─────────────────────────────────────────────────────────────

/**
 * Wraps any `async function(path, options)` fetch function with perf monitoring.
 *
 * @param {Function} fetchFn  The underlying fetch function (e.g. `apiFetch`).
 * @returns {Function}        A drop-in replacement that records timings.
 *
 * @example
 *   import { apiFetch } from './apiClient';
 *   import { withPerfMonitoring } from './perfMonitor';
 *   const apiFetch = withPerfMonitoring(apiFetch);
 */
export function withPerfMonitoring(fetchFn) {
  return async function monitoredFetch(path, options) {
    const label = `api:${options?.method?.toUpperCase() ?? 'GET'} ${path}`;
    startMark(label);
    try {
      const result = await fetchFn(path, options);
      await endMark(label, { category: 'api' });
      return result;
    } catch (err) {
      await endMark(label, { category: 'api' });
      throw err;
    }
  };
}

// ─── Log access ──────────────────────────────────────────────────────────────

/**
 * Returns all stored perf entries, newest first.
 * @returns {Promise<Array>}
 */
export async function getPerfLog() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Returns only entries flagged as slow.
 * @returns {Promise<Array>}
 */
export async function getSlowEntries() {
  const log = await getPerfLog();
  return log.filter((e) => e.slow);
}

/**
 * Wipes the perf log.
 */
export async function clearPerfLog() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort
  }
}

// ─── Internal ────────────────────────────────────────────────────────────────

async function _persist(entry) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const log = raw ? JSON.parse(raw) : [];
    log.unshift(entry);
    if (log.length > MAX_ENTRIES) log.length = MAX_ENTRIES;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // best-effort — never crash the app over telemetry
  }
}
