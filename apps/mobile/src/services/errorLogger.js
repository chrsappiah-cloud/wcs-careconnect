/**
 * CareConnect Error Logger
 *
 * Lightweight crash/error logger that:
 * - Captures unhandled JS errors and unhandled promise rejections
 * - Captures manual error reports from try/catch blocks
 * - Persists a rolling log to AsyncStorage (survives app restarts)
 * - Exposes the log for an in-app debug panel or remote flush
 * - Ready to forward to a remote endpoint when one is configured
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_KEY = '@careconnect_error_log';
const MAX_ENTRIES = 100;
const REMOTE_ENDPOINT = process.env.EXPO_PUBLIC_ERROR_LOG_URL || null;

let _sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let _userId = null;
let _userRole = null;
let _isInitialised = false;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Set user context so every subsequent log entry is tagged.
 * Call this as soon as auth resolves.
 */
export function setErrorLogUser(id, role) {
  _userId = id;
  _userRole = role;
}

/**
 * Register global unhandled-error and unhandled-rejection handlers.
 * Call once from the root layout (RootLayout useEffect).
 */
export function initErrorLogger() {
  if (_isInitialised) return;
  _isInitialised = true;

  // Unhandled JS exceptions (React error boundaries complement this)
  const prevHandler = global.ErrorUtils?.getGlobalHandler?.();
  global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
    captureError(error, { isFatal, source: 'global' });
    prevHandler?.(error, isFatal);
  });

  // Unhandled promise rejections
  const prevRejection = global.onunhandledrejection;
  global.onunhandledrejection = (event) => {
    const err = event?.reason instanceof Error
      ? event.reason
      : new Error(String(event?.reason ?? 'Unhandled rejection'));
    captureError(err, { source: 'unhandledRejection' });
    prevRejection?.(event);
  };
}

/**
 * Manually capture an error from a try/catch block.
 *
 * @param {Error|unknown} error
 * @param {object} [context] — any extra key/values to attach
 */
export function captureError(error, context = {}) {
  const entry = _buildEntry(error, context);
  _persist(entry);
  _maybeForwardToRemote(entry);
}

/**
 * Log a non-fatal warning (user-visible issues that aren't exceptions).
 */
export function captureWarning(message, context = {}) {
  const entry = _buildEntry(new Error(message), { ...context, level: 'warning' });
  _persist(entry);
}

/**
 * Return all stored error entries (newest first).
 * @returns {Promise<ErrorEntry[]>}
 */
export async function getErrorLog() {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clear the persisted error log.
 */
export async function clearErrorLog() {
  await AsyncStorage.removeItem(LOG_KEY);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _buildEntry(error, context = {}) {
  const isError = error instanceof Error;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    sessionId: _sessionId,
    userId: _userId,
    userRole: _userRole,
    level: context.level ?? (context.isFatal ? 'fatal' : 'error'),
    message: isError ? error.message : String(error),
    stack: isError ? error.stack : undefined,
    context: _sanitiseContext(context),
  };
}

function _sanitiseContext(ctx) {
  // Strip internal keys; keep everything else
  const { level, isFatal, source, ...rest } = ctx;
  const out = { source: source ?? 'manual', ...rest };
  // Never log credentials or tokens
  const safeJson = JSON.stringify(out, (_k, v) =>
    /token|password|secret|key|auth/i.test(_k) ? '[REDACTED]' : v
  );
  return JSON.parse(safeJson);
}

async function _persist(entry) {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(updated));
  } catch {
    // Storage failure — cannot persist, but must not throw
  }
}

async function _maybeForwardToRemote(entry) {
  if (!REMOTE_ENDPOINT) return;
  try {
    await fetch(REMOTE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch {
    // Remote logging failures must never affect the app
  }
}
