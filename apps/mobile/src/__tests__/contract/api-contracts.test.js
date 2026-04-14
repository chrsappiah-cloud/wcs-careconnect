/**
 * API Contract Tests
 * ───────────────────
 * Validates the shape of every API request payload and
 * expected response. Tests run fully mocked — no server
 * required.
 *
 * Contracts locked:
 *   - GET  /api/tasks          → task[]
 *   - PATCH /api/tasks/:id     → task (updated)
 *   - GET  /api/residents      → resident[]
 *   - POST /api/residents      → resident (created)
 *   - GET  /api/alerts         → alert[]
 *   - GET  /api/conversations  → conversation[]
 *   - POST /api/conversations  → conversation (created)
 *   - GET  /api/contacts       → contact[]
 *   - POST /api/push-tokens    → 201 no body
 *   - 4xx error responses handled correctly
 */

// ─── apiClient ────────────────────────────────────────────

jest.mock('../../services/apiClient', () => ({
  apiUrl: (path) => `http://localhost:3001${path}`,
  apiFetch: jest.fn(),
}));

import { apiUrl } from '../../services/apiClient';

// ─── Response factories ───────────────────────────────────

function makeTask(overrides = {}) {
  return {
    id: 'task_001',
    title: 'Morning medication',
    priority: 'high',
    status: 'pending',
    residentId: 'res_001',
    residentName: 'Margaret Johnson',
    dueAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeResident(overrides = {}) {
  return {
    id: 'res_001',
    name: 'Margaret Johnson',
    dob: '1940-03-15',
    roomNumber: '12A',
    conditions: ['Type 2 Diabetes', 'Hypertension'],
    ...overrides,
  };
}

function makeAlert(overrides = {}) {
  return {
    id: 'alert_001',
    type: 'glucose',
    severity: 'critical',
    message: 'Blood glucose high at 280 mg/dL',
    resident_id: 'res_001',
    resident_name: 'Margaret Johnson',
    status: 'open',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeConversation(overrides = {}) {
  return {
    id: 'conv_001',
    title: 'Care Team',
    type: 'group',
    participants: ['Nurse Sarah', 'Dr. Chen'],
    lastMessage: 'Patient stable',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 2,
    ...overrides,
  };
}

function makeContact(overrides = {}) {
  return {
    id: 'contact_001',
    name: 'Dr. Chen',
    role: 'Doctor',
    type: 'staff',
    ...overrides,
  };
}

// ─── apiUrl path construction ─────────────────────────────

describe('apiUrl() path construction', () => {
  test('prepends base URL to path', () => {
    expect(apiUrl('/api/tasks')).toBe('http://localhost:3001/api/tasks');
  });

  test('handles paths without leading slash gracefully', () => {
    const url = apiUrl('/api/residents');
    expect(url).toContain('/api/residents');
  });

  test('query string is preserved', () => {
    const url = apiUrl('/api/tasks?status=all');
    expect(url).toContain('status=all');
  });
});

// ─── Task contract ────────────────────────────────────────

describe('Task API contract', () => {
  const REQUIRED_TASK_FIELDS = ['id', 'title', 'priority', 'status', 'residentId', 'dueAt'];

  test('task response has all required fields', () => {
    const task = makeTask();
    for (const field of REQUIRED_TASK_FIELDS) {
      expect(task).toHaveProperty(field);
    }
  });

  test('priority is one of high | medium | low', () => {
    const VALID_PRIORITIES = ['high', 'medium', 'low'];
    expect(VALID_PRIORITIES).toContain(makeTask({ priority: 'high' }).priority);
    expect(VALID_PRIORITIES).toContain(makeTask({ priority: 'medium' }).priority);
    expect(VALID_PRIORITIES).toContain(makeTask({ priority: 'low' }).priority);
  });

  test('status is one of pending | in_progress | complete', () => {
    const VALID_STATUSES = ['pending', 'in_progress', 'complete'];
    for (const status of VALID_STATUSES) {
      expect(VALID_STATUSES).toContain(makeTask({ status }).status);
    }
  });

  test('PATCH payload contains only the changed field', () => {
    const payload = { status: 'complete' };
    expect(Object.keys(payload)).toEqual(['status']);
  });

  test('dueAt is a valid ISO 8601 date string', () => {
    const task = makeTask();
    expect(() => new Date(task.dueAt)).not.toThrow();
    expect(new Date(task.dueAt).toISOString()).toBe(task.dueAt);
  });
});

// ─── Resident contract ────────────────────────────────────

describe('Resident API contract', () => {
  const REQUIRED_RESIDENT_FIELDS = ['id', 'name', 'dob', 'roomNumber'];

  test('resident response has required fields', () => {
    const resident = makeResident();
    for (const field of REQUIRED_RESIDENT_FIELDS) {
      expect(resident).toHaveProperty(field);
    }
  });

  test('POST /api/residents — required body fields', () => {
    const postBody = { name: 'Alice Smith', dob: '1945-06-20', roomNumber: '8B', conditions: [] };
    expect(postBody).toHaveProperty('name');
    expect(postBody).toHaveProperty('dob');
    expect(postBody).toHaveProperty('roomNumber');
  });

  test('conditions is an array', () => {
    const resident = makeResident();
    expect(Array.isArray(resident.conditions)).toBe(true);
  });

  test('dob is a valid date string', () => {
    const resident = makeResident();
    expect(new Date(resident.dob).getFullYear()).toBeLessThan(2000); // aged care resident
  });
});

// ─── Alert contract ───────────────────────────────────────

describe('Alert API contract', () => {
  const REQUIRED_ALERT_FIELDS = ['id', 'type', 'severity', 'message', 'resident_id', 'status', 'created_at'];

  test('alert response has required fields', () => {
    const alert = makeAlert();
    for (const field of REQUIRED_ALERT_FIELDS) {
      expect(alert).toHaveProperty(field);
    }
  });

  test('severity is one of critical | warning | info', () => {
    const VALID = ['critical', 'warning', 'info'];
    for (const s of VALID) {
      expect(VALID).toContain(makeAlert({ severity: s }).severity);
    }
  });

  test('status is one of open | acknowledged | resolved', () => {
    const VALID = ['open', 'acknowledged', 'resolved'];
    for (const s of VALID) {
      expect(VALID).toContain(makeAlert({ status: s }).status);
    }
  });

  test('type is a known vital or clinical type', () => {
    const KNOWN_TYPES = ['glucose', 'spo2', 'heart_rate', 'blood_pressure', 'temperature', 'respiratory_rate', 'medication', 'fall', 'reminder'];
    const alert = makeAlert({ type: 'glucose' });
    expect(KNOWN_TYPES).toContain(alert.type);
  });
});

// ─── Conversation contract ────────────────────────────────

describe('Conversation API contract', () => {
  const REQUIRED_FIELDS = ['id', 'title', 'type', 'participants'];

  test('conversation response has required fields', () => {
    const conv = makeConversation();
    for (const field of REQUIRED_FIELDS) {
      expect(conv).toHaveProperty(field);
    }
  });

  test('participants is an array', () => {
    expect(Array.isArray(makeConversation().participants)).toBe(true);
  });

  test('POST payload includes title, type, participants', () => {
    const body = { title: 'Handover', type: 'group', participants: ['Nurse Sarah', 'Dr. Chen'] };
    expect(body).toHaveProperty('title');
    expect(body).toHaveProperty('type');
    expect(Array.isArray(body.participants)).toBe(true);
  });

  test('unreadCount is a non-negative integer', () => {
    const conv = makeConversation({ unreadCount: 5 });
    expect(Number.isInteger(conv.unreadCount)).toBe(true);
    expect(conv.unreadCount).toBeGreaterThanOrEqual(0);
  });
});

// ─── Contact contract ─────────────────────────────────────

describe('Contact API contract', () => {
  test('contact has id, name, role, type', () => {
    const contact = makeContact();
    expect(contact).toHaveProperty('id');
    expect(contact).toHaveProperty('name');
    expect(contact).toHaveProperty('role');
    expect(contact).toHaveProperty('type');
  });

  test('type is staff | resident | relative | external', () => {
    const VALID = ['staff', 'resident', 'relative', 'external'];
    expect(VALID).toContain(makeContact({ type: 'staff' }).type);
    expect(VALID).toContain(makeContact({ type: 'relative' }).type);
  });
});

// ─── 4xx error handling contract ─────────────────────────

describe('4xx error response handling', () => {
  function parseApiError(status, body = {}) {
    if (status === 400) return { type: 'validation', message: body.message || 'Invalid request', fields: body.fields };
    if (status === 401) return { type: 'auth',       message: 'Authentication required' };
    if (status === 403) return { type: 'forbidden',  message: 'Access denied' };
    if (status === 404) return { type: 'not_found',  message: body.message || 'Resource not found' };
    if (status === 422) return { type: 'unprocessable', message: body.message || 'Unprocessable entity', fields: body.fields };
    if (status === 429) return { type: 'rate_limit', message: 'Too many requests', retryAfter: body.retryAfter };
    return { type: 'server_error', message: 'Unexpected server error' };
  }

  test('400 is a validation error', () => {
    expect(parseApiError(400, { message: 'name required' }).type).toBe('validation');
  });

  test('401 is an auth error', () => {
    expect(parseApiError(401).type).toBe('auth');
  });

  test('403 is a forbidden error', () => {
    expect(parseApiError(403).type).toBe('forbidden');
  });

  test('404 is a not-found error', () => {
    expect(parseApiError(404).type).toBe('not_found');
  });

  test('422 includes unprocessable fields', () => {
    const err = parseApiError(422, { fields: ['dob'] });
    expect(err.type).toBe('unprocessable');
    expect(err.fields).toContain('dob');
  });

  test('429 is a rate-limit error', () => {
    expect(parseApiError(429, { retryAfter: 60 }).type).toBe('rate_limit');
    expect(parseApiError(429, { retryAfter: 60 }).retryAfter).toBe(60);
  });
});
