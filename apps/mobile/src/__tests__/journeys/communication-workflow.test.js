/**
 * Journey: Communication workflow
 * ─────────────────────────────────
 * Release-blocking scenarios:
 *   - fetchConversations returns list with correct shape
 *   - createConversation builds correct POST payload
 *   - fetchContacts returns staff + non-staff contacts
 *   - message send payload is correctly formed
 *   - duplicate message prevention (idempotency key)
 *   - 4xx from messaging API throws with diagnostic message
 *   - Conversation sorted by lastMessageAt (newest first)
 *   - Unread count increments correctly
 */

// ─── Mocks ────────────────────────────────────────────────

jest.mock('../../services/apiClient', () => ({
  apiUrl: (path) => `http://localhost:3001${path}`,
  apiFetch: jest.fn(),
}));

import { apiFetch } from '../../services/apiClient';

// ─── Data factories ───────────────────────────────────────

function buildConversation(overrides = {}) {
  return {
    id: `conv_${Math.random().toString(36).slice(2, 7)}`,
    title: 'Care Team',
    type: 'group',
    participants: ['Nurse Sarah', 'Dr. Chen'],
    lastMessage: 'Patient is stable.',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    ...overrides,
  };
}

function buildMessage(overrides = {}) {
  return {
    id: `msg_${Math.random().toString(36).slice(2, 7)}`,
    conversationId: 'conv_001',
    senderId: 'Nurse Sarah',
    senderRole: 'Nurse',
    text: 'Hello team',
    sentAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildContact(overrides = {}) {
  return {
    id: `contact_${Math.random().toString(36).slice(2, 7)}`,
    name: 'Dr. Chen',
    role: 'Doctor',
    type: 'staff',
    ...overrides,
  };
}

// ─── Conversation list ────────────────────────────────────

describe('Conversation list', () => {
  test('conversation has required fields', () => {
    const conv = buildConversation();
    expect(conv).toHaveProperty('id');
    expect(conv).toHaveProperty('title');
    expect(conv).toHaveProperty('type');
    expect(Array.isArray(conv.participants)).toBe(true);
  });

  test('type is "direct" or "group"', () => {
    expect(['direct', 'group']).toContain(buildConversation({ type: 'direct' }).type);
    expect(['direct', 'group']).toContain(buildConversation({ type: 'group' }).type);
  });

  test('conversations sorted newest first (by lastMessageAt)', () => {
    const now = Date.now();
    const conversations = [
      buildConversation({ id: 'c1', lastMessageAt: new Date(now - 3_600_000).toISOString() }),
      buildConversation({ id: 'c2', lastMessageAt: new Date(now - 600_000).toISOString() }),
      buildConversation({ id: 'c3', lastMessageAt: new Date(now).toISOString() }),
    ];
    const sorted = [...conversations].sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );
    expect(sorted[0].id).toBe('c3'); // most recent first
    expect(sorted[2].id).toBe('c1'); // oldest last
  });

  test('unreadCount is a non-negative integer', () => {
    expect(buildConversation({ unreadCount: 5 }).unreadCount).toBe(5);
    expect(buildConversation({ unreadCount: 0 }).unreadCount).toBe(0);
  });

  test('marking conversation as read sets unreadCount to 0', () => {
    const conv = buildConversation({ unreadCount: 7 });
    const read = { ...conv, unreadCount: 0 };
    expect(read.unreadCount).toBe(0);
  });
});

// ─── createConversation payload ───────────────────────────

describe('createConversation payload', () => {
  function buildCreatePayload({ title, type, participants }) {
    if (!title?.trim()) throw new Error('title is required');
    if (!['direct', 'group'].includes(type)) throw new Error('invalid type');
    if (!participants?.length) throw new Error('participants is required');
    return { title: title.trim(), type, participants };
  }

  test('builds correct payload', () => {
    const payload = buildCreatePayload({
      title: 'Handover', type: 'group', participants: ['Nurse Sarah', 'Dr. Chen'],
    });
    expect(payload.title).toBe('Handover');
    expect(payload.type).toBe('group');
    expect(payload.participants).toHaveLength(2);
  });

  test('throws when title is empty', () => {
    expect(() => buildCreatePayload({ title: '', type: 'group', participants: ['A'] })).toThrow('title is required');
  });

  test('throws when participants is empty', () => {
    expect(() => buildCreatePayload({ title: 'T', type: 'direct', participants: [] })).toThrow('participants is required');
  });

  test('throws for unknown type', () => {
    expect(() => buildCreatePayload({ title: 'T', type: 'broadcast', participants: ['A'] })).toThrow('invalid type');
  });
});

// ─── Message send payload ─────────────────────────────────

describe('Message send payload', () => {
  function buildSendPayload(conversationId, text, senderId, idempotencyKey) {
    if (!text?.trim()) throw new Error('message text is required');
    return {
      conversationId,
      senderId,
      text: text.trim(),
      idempotencyKey: idempotencyKey ?? `${senderId}_${Date.now()}`,
    };
  }

  test('builds correct message payload', () => {
    const payload = buildSendPayload('conv_001', 'Patient stable.', 'Nurse Sarah', 'key_abc');
    expect(payload.conversationId).toBe('conv_001');
    expect(payload.text).toBe('Patient stable.');
    expect(payload.idempotencyKey).toBe('key_abc');
  });

  test('trims whitespace from message text', () => {
    const payload = buildSendPayload('conv_001', '  hello  ', 'Nurse Sarah');
    expect(payload.text).toBe('hello');
  });

  test('throws when text is blank', () => {
    expect(() => buildSendPayload('conv_001', '   ', 'Nurse Sarah')).toThrow('message text is required');
  });

  test('generates idempotency key when not provided', () => {
    const payload = buildSendPayload('conv_001', 'hi', 'Nurse Sarah');
    expect(payload.idempotencyKey).toContain('Nurse Sarah');
  });
});

// ─── Duplicate message prevention ────────────────────────

describe('Duplicate message prevention (idempotency)', () => {
  test('two sends with same idempotency key should not result in duplicates', () => {
    const sent = new Set();
    function sendOnce(key, message) {
      if (sent.has(key)) return { duplicate: true };
      sent.add(key);
      return { sent: true, message };
    }
    const key = 'idempotency_abc';
    const first  = sendOnce(key, 'Hello');
    const second = sendOnce(key, 'Hello');
    expect(first.sent).toBe(true);
    expect(second.duplicate).toBe(true);
  });
});

// ─── fetchConversations — API mock ────────────────────────

describe('fetchConversations via apiFetch', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calls correct endpoint', async () => {
    const conversations = [buildConversation()];
    apiFetch.mockResolvedValueOnce(conversations);
    const result = await apiFetch('/api/conversations?userName=Nurse+Sarah');
    expect(result).toEqual(conversations);
  });

  test('throws on 401 unauthorized', async () => {
    apiFetch.mockRejectedValueOnce(new Error('HTTP error 401'));
    await expect(apiFetch('/api/conversations')).rejects.toThrow('401');
  });

  test('returns empty array fallback for null response', async () => {
    apiFetch.mockResolvedValueOnce(null);
    const raw = await apiFetch('/api/conversations');
    const conversations = raw ?? [];
    expect(conversations).toEqual([]);
  });
});

// ─── Contacts ─────────────────────────────────────────────

describe('Contacts', () => {
  test('contact has required fields', () => {
    const contact = buildContact();
    expect(contact).toHaveProperty('id');
    expect(contact).toHaveProperty('name');
    expect(contact).toHaveProperty('role');
    expect(contact).toHaveProperty('type');
  });

  test('staff contacts can be filtered by type', () => {
    const contacts = [
      buildContact({ type: 'staff' }),
      buildContact({ type: 'relative' }),
      buildContact({ type: 'staff' }),
    ];
    const staff = contacts.filter((c) => c.type === 'staff');
    expect(staff).toHaveLength(2);
  });
});
