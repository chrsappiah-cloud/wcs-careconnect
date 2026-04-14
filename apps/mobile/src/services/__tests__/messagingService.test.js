import {
  fetchContacts,
  createContact,
  fetchConversations,
  createConversation,
  fetchConversationMessages,
  sendConversationMessage,
  getCurrentUser,
  getConversationDisplayName,
  getConversationAvatar,
  isExternalConversation,
  getStakeholderIcon,
} from '../messagingService';

// Mock apiClient
jest.mock('../apiClient', () => ({
  apiUrl: (path) => `http://localhost:3001${path}`,
}));

// Mock auth store — returns a known user so getCurrentUser() is deterministic in tests
jest.mock('../../utils/auth/store', () => ({
  useAuthStore: {
    getState: () => ({
      auth: {
        user: { name: 'Nurse Sarah', role: 'Nurse' },
      },
    }),
  },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── API Functions ───────────────────────────────────────

describe('fetchContacts', () => {
  it('fetches all contacts without type filter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: 'Dr. Chen' }]),
    });
    const result = await fetchContacts();
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/contacts');
    expect(result).toEqual([{ id: 1, name: 'Dr. Chen' }]);
  });

  it('fetches contacts with type filter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    await fetchContacts('external');
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/contacts?type=external');
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(fetchContacts()).rejects.toThrow('Contacts fetch failed: 500');
  });
});

describe('createContact', () => {
  it('sends POST with contact data', async () => {
    const contact = { name: 'Test User', role: 'Nurse' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 99, ...contact }),
    });
    const result = await createContact(contact);
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    expect(result.id).toBe(99);
  });

  it('throws on failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });
    await expect(createContact({})).rejects.toThrow('Contact create failed: 400');
  });
});

describe('fetchConversations', () => {
  it('fetches conversations for default user', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: 1, title: 'Care Team' }]),
    });
    const result = await fetchConversations();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/conversations?user=Nurse%20Sarah'
    );
    expect(result).toHaveLength(1);
  });

  it('fetches conversations for custom user', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    await fetchConversations('Dr. James Chen');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/conversations?user=Dr.%20James%20Chen'
    );
  });

  it('throws on error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(fetchConversations()).rejects.toThrow('Conversations fetch failed: 503');
  });
});

describe('createConversation', () => {
  it('sends POST with conversation details', async () => {
    const convData = {
      title: 'Test Group',
      type: 'group',
      participants: [{ name: 'Dr. Chen', role: 'Doctor' }],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 10, ...convData }),
    });
    const result = await createConversation(convData);
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Group',
        type: 'group',
        created_by: 'Nurse Sarah',
        participants: [{ name: 'Dr. Chen', role: 'Doctor' }],
      }),
    });
    expect(result.id).toBe(10);
  });

  it('defaults type to direct', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 11 }),
    });
    await createConversation({ title: null, participants: [] });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.type).toBe('direct');
  });
});

describe('fetchConversationMessages', () => {
  it('fetches messages for a conversation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: 1, content: 'Hello' }]),
    });
    const result = await fetchConversationMessages(5);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/conversations/5/messages'
    );
    expect(result).toHaveLength(1);
  });

  it('adds limit and before params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    await fetchConversationMessages(5, { limit: 20, before: '2024-01-01T00:00:00Z' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/conversations/5/messages?limit=20&before=2024-01-01T00%3A00%3A00Z'
    );
  });

  it('throws on error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(fetchConversationMessages(999)).rejects.toThrow('Messages fetch failed: 404');
  });
});

describe('sendConversationMessage', () => {
  it('sends a text message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 50, content: 'Hi' }),
    });
    const result = await sendConversationMessage(1, 'Hi');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/conversations/1/messages',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: 'Nurse Sarah',
          sender_role: 'Nurse',
          content: 'Hi',
          message_type: 'text',
        }),
      }
    );
    expect(result.id).toBe(50);
  });

  it('supports custom message types', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 51 }),
    });
    await sendConversationMessage(1, 'Alert!', 'system');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.message_type).toBe('system');
  });

  it('throws on error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 422 });
    await expect(sendConversationMessage(1, '')).rejects.toThrow('Message send failed: 422');
  });
});

// ─── Helper Functions ────────────────────────────────────

describe('getCurrentUser', () => {
  it('returns the authenticated user from auth store', () => {
    const user = getCurrentUser();
    expect(user).toEqual({ name: 'Nurse Sarah', role: 'Nurse' });
  });
});

describe('getConversationDisplayName', () => {
  it('returns title when present', () => {
    expect(getConversationDisplayName({ title: 'Care Team' })).toBe('Care Team');
  });

  it('returns other participant name for direct conversations', () => {
    const conv = {
      title: null,
      type: 'direct',
      participants: [
        { name: 'Nurse Sarah', role: 'Nurse' },
        { name: 'Dr. Chen', role: 'Doctor' },
      ],
    };
    expect(getConversationDisplayName(conv, 'Nurse Sarah')).toBe('Dr. Chen');
  });

  it('returns "Direct Message" if no other participant found', () => {
    const conv = {
      title: null,
      type: 'direct',
      participants: [{ name: 'Nurse Sarah', role: 'Nurse' }],
    };
    expect(getConversationDisplayName(conv, 'Nurse Sarah')).toBe('Direct Message');
  });

  it('returns first names of non-current participants for group', () => {
    const conv = {
      title: null,
      type: 'group',
      participants: [
        { name: 'Nurse Sarah' },
        { name: 'Dr. Chen' },
        { name: 'Jane Smith' },
      ],
    };
    expect(getConversationDisplayName(conv, 'Nurse Sarah')).toBe('Dr., Jane');
  });

  it('returns "Conversation" as final fallback', () => {
    expect(getConversationDisplayName({})).toBe('Conversation');
  });
});

describe('getConversationAvatar', () => {
  it('returns other participant for direct conversation', () => {
    const conv = {
      type: 'direct',
      participants: [
        { name: 'Nurse Sarah', role: 'Nurse' },
        { name: 'Dr. Chen', role: 'Doctor' },
      ],
    };
    expect(getConversationAvatar(conv, 'Nurse Sarah')).toEqual({ name: 'Dr. Chen', role: 'Doctor' });
  });

  it('returns null for group conversation', () => {
    const conv = { type: 'group', participants: [] };
    expect(getConversationAvatar(conv)).toBeNull();
  });

  it('returns null when no participants', () => {
    expect(getConversationAvatar({ type: 'direct' })).toBeNull();
  });
});

describe('isExternalConversation', () => {
  it('returns true when any participant is external', () => {
    const conv = {
      participants: [
        { name: 'Nurse Sarah', type: 'internal' },
        { name: 'David Chen', type: 'external' },
      ],
    };
    expect(isExternalConversation(conv)).toBe(true);
  });

  it('returns false when all participants are internal', () => {
    const conv = {
      participants: [
        { name: 'Nurse Sarah', type: 'internal' },
        { name: 'Dr. Chen', type: 'internal' },
      ],
    };
    expect(isExternalConversation(conv)).toBe(false);
  });

  it('returns undefined when no participants', () => {
    expect(isExternalConversation({})).toBeUndefined();
  });
});

describe('getStakeholderIcon', () => {
  it('returns correct icons for known roles', () => {
    expect(getStakeholderIcon('Doctor')).toBe('🩺');
    expect(getStakeholderIcon('Nurse')).toBe('👩‍⚕️');
    expect(getStakeholderIcon('Family')).toBe('👨‍👩‍👧');
    expect(getStakeholderIcon('Pharmacist')).toBe('💊');
    expect(getStakeholderIcon('GP')).toBe('🏥');
  });

  it('returns default icon for unknown roles', () => {
    expect(getStakeholderIcon('Unknown')).toBe('👤');
    expect(getStakeholderIcon('')).toBe('👤');
  });
});
