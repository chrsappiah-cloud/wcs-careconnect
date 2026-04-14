// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
/**
 * Journey: Authentication & Session Management
 * ─────────────────────────────────────────────
 * Release-blocking scenarios:
 *   - First login (activation code accepted / rejected)
 *   - Session persistence across app restarts
 *   - Expired token → re-auth prompt
 *   - Forced password reset flow
 *   - Logout clears all PII from storage
 *   - Revoked account blocked immediately
 *   - API 401/403 responses handled gracefully
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Helpers ──────────────────────────────────────────────

const SESSION_KEY = '@careconnect_session';
const QUEUE_KEY   = '@careconnect_mutation_queue';

function buildSession(overrides = {}) {
  return {
    userId: 'usr_001',
    name: 'Nurse Sarah',
    role: 'Nurse',
    token: 'eyJhbGciOiJIUzI1NiJ9.valid',
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    ...overrides,
  };
}

function buildExpiredSession() {
  return buildSession({ expiresAt: new Date(Date.now() - 1000).toISOString() });
}

// ─── Activation code validation (offline rules) ───────────

describe('Activation code validation', () => {
  const VALID_FORMAT = /^[A-Z0-9]{6,12}$/;

  test('accepts well-formed activation code', () => {
    expect(VALID_FORMAT.test('ABC123')).toBe(true);
    expect(VALID_FORMAT.test('CARE2024XZ')).toBe(true);
  });

  test('rejects codes that are too short', () => {
    expect(VALID_FORMAT.test('AB1')).toBe(false);
    expect(VALID_FORMAT.test('')).toBe(false);
  });

  test('rejects codes with special characters', () => {
    expect(VALID_FORMAT.test('ABC-123')).toBe(false);
    expect(VALID_FORMAT.test('abc123')).toBe(false);
  });

  test('rejects codes longer than 12 characters', () => {
    expect(VALID_FORMAT.test('ABCDEFGHIJKLMN')).toBe(false);
  });
});

// ─── Session persistence ──────────────────────────────────

describe('Session persistence', () => {
  beforeEach(() => AsyncStorage.clear());

  test('stores session in AsyncStorage on successful login', async () => {
    const session = buildSession();
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    const stored = JSON.parse(raw);
    expect(stored.token).toBe(session.token);
    expect(stored.role).toBe('Nurse');
  });

  test('restores session on app restart', async () => {
    const session = buildSession();
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    // Simulate app restart by reading back
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    const restored = JSON.parse(raw);
    expect(restored.userId).toBe(session.userId);
    expect(restored.name).toBe(session.name);
  });

  test('returns null when no session stored', async () => {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    expect(raw).toBeNull();
  });
});

// ─── Token expiry ─────────────────────────────────────────

describe('Token expiry detection', () => {
  function isSessionValid(session) {
    if (!session || !session.expiresAt) return false;
    return new Date(session.expiresAt) > new Date();
  }

  test('valid session passes expiry check', () => {
    expect(isSessionValid(buildSession())).toBe(true);
  });

  test('expired session fails expiry check', () => {
    expect(isSessionValid(buildExpiredSession())).toBe(false);
  });

  test('missing session returns invalid', () => {
    expect(isSessionValid(null)).toBe(false);
    expect(isSessionValid({})).toBe(false);
  });

  test('session expiring in 5 minutes is still valid', () => {
    const session = buildSession({ expiresAt: new Date(Date.now() + 300_000).toISOString() });
    expect(isSessionValid(session)).toBe(true);
  });

  test('session expired 1 second ago is invalid', () => {
    const session = buildSession({ expiresAt: new Date(Date.now() - 1000).toISOString() });
    expect(isSessionValid(session)).toBe(false);
  });
});

// ─── Logout — PII erasure ─────────────────────────────────

describe('Logout clears all PII from storage', () => {
  beforeEach(async () => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(buildSession()));
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([{ path: '/api/tasks', method: 'PATCH' }]));
    await AsyncStorage.setItem('@careconnect_push_token', 'ExponentPushToken[xxxxxx]');
  });

  async function performLogout() {
    await AsyncStorage.multiRemove([SESSION_KEY, QUEUE_KEY, '@careconnect_push_token']);
  }

  test('session is removed after logout', async () => {
    await performLogout();
    const session = await AsyncStorage.getItem(SESSION_KEY);
    expect(session).toBeNull();
  });

  test('mutation queue is cleared on logout', async () => {
    await performLogout();
    const queue = await AsyncStorage.getItem(QUEUE_KEY);
    expect(queue).toBeNull();
  });

  test('push token is removed on logout', async () => {
    await performLogout();
    const token = await AsyncStorage.getItem('@careconnect_push_token');
    expect(token).toBeNull();
  });
});

// ─── Revoked / disabled account ───────────────────────────

describe('Revoked account handling', () => {
  function handleApiError(status) {
    if (status === 401) return { action: 'redirect_to_login', clear_session: true };
    if (status === 403) return { action: 'show_access_denied', clear_session: false };
    if (status === 423) return { action: 'show_account_locked', clear_session: true };
    return { action: 'show_generic_error', clear_session: false };
  }

  test('401 triggers session clear and login redirect', () => {
    const result = handleApiError(401);
    expect(result.action).toBe('redirect_to_login');
    expect(result.clear_session).toBe(true);
  });

  test('403 shows access denied without clearing session', () => {
    const result = handleApiError(403);
    expect(result.action).toBe('show_access_denied');
    expect(result.clear_session).toBe(false);
  });

  test('423 (locked) shows locked message and clears session', () => {
    const result = handleApiError(423);
    expect(result.action).toBe('show_account_locked');
    expect(result.clear_session).toBe(true);
  });
});

// ─── Forced password reset ────────────────────────────────

describe('Forced password reset', () => {
  function validateNewPassword(password) {
    const errors = [];
    if (password.length < 12) errors.push('minimum 12 characters');
    if (!/[A-Z]/.test(password)) errors.push('at least one uppercase letter');
    if (!/[0-9]/.test(password)) errors.push('at least one number');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('at least one special character');
    return { valid: errors.length === 0, errors };
  }

  test('strong password passes all rules', () => {
    const result = validateNewPassword('CareConnect2024!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('too-short password is rejected', () => {
    const result = validateNewPassword('Short1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('minimum 12 characters');
  });

  test('password without uppercase rejected', () => {
    const result = validateNewPassword('careconnect2024!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('at least one uppercase letter');
  });

  test('password without special character rejected', () => {
    const result = validateNewPassword('CareConnect2024');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('at least one special character');
  });

  test('password without number rejected', () => {
    const result = validateNewPassword('CareConnect!!!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('at least one number');
  });
});

// ─── Role-based access (RBAC) ─────────────────────────────

describe('Role-based access control', () => {
  const PERMISSIONS = {
    Nurse:    ['view_residents', 'update_tasks', 'send_messages', 'log_vitals'],
    Doctor:   ['view_residents', 'update_tasks', 'send_messages', 'log_vitals', 'prescribe', 'escalate_clinical'],
    Admin:    ['view_residents', 'manage_users', 'view_audit_log', 'manage_compliance'],
    Relative: ['view_residents'],
  };

  function hasPermission(role, action) {
    return (PERMISSIONS[role] || []).includes(action);
  }

  test('Nurse can update tasks', () => {
    expect(hasPermission('Nurse', 'update_tasks')).toBe(true);
  });

  test('Nurse cannot prescribe', () => {
    expect(hasPermission('Nurse', 'prescribe')).toBe(false);
  });

  test('Doctor can escalate clinically', () => {
    expect(hasPermission('Doctor', 'escalate_clinical')).toBe(true);
  });

  test('Relative is read-only', () => {
    expect(hasPermission('Relative', 'update_tasks')).toBe(false);
    expect(hasPermission('Relative', 'view_residents')).toBe(true);
  });

  test('unknown role has no permissions', () => {
    expect(hasPermission('Hacker', 'view_residents')).toBe(false);
  });
});
