// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Mock messaging service
jest.mock('../services/messagingService', () => ({
  getCurrentUser: () => ({ name: 'Nurse Sarah', role: 'Nurse' }),
  fetchConversations: jest.fn().mockResolvedValue([]),
  fetchContacts: jest.fn().mockResolvedValue([]),
  getConversationDisplayName: jest.fn((conv, user) => conv.title || 'Test Conv'),
  getConversationAvatar: jest.fn(() => null),
  isExternalConversation: jest.fn(() => false),
  getStakeholderIcon: jest.fn(() => '👤'),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((d, f) => '10:30 AM'),
  isToday: jest.fn(() => true),
  isYesterday: jest.fn(() => false),
}));

// Mock ChatThread and ComposeMessage
jest.mock('../components/messaging/ChatThread', () => {
  const { View, Text } = require('react-native');
  return function ChatThread({ conversation, onBack }) {
    return (
      <View testID="chat-thread">
        <Text>{conversation.title}</Text>
      </View>
    );
  };
});

jest.mock('../components/messaging/ComposeMessage', () => {
  const { View, Text } = require('react-native');
  return function ComposeMessage({ onBack, onConversationCreated }) {
    return (
      <View testID="compose-message">
        <Text>ComposeMessage</Text>
      </View>
    );
  };
});

import MessagesScreen from '../app/(tabs)/messages';

beforeEach(() => {
  jest.clearAllMocks();
  // Default: empty conversations, not loading
  useQuery.mockImplementation(({ queryKey }) => {
    if (queryKey[0] === 'conversations') {
      return {
        data: [],
        isLoading: false,
        isFetching: false,
        refetch: jest.fn(),
        error: null,
      };
    }
    if (queryKey[0] === 'contacts') {
      return {
        data: [],
        isLoading: false,
        isFetching: false,
        refetch: jest.fn(),
        error: null,
      };
    }
    return { data: undefined, isLoading: false, refetch: jest.fn() };
  });
});

describe('MessagesScreen', () => {
  it('renders header with Messages title', () => {
    const { getByText } = render(<MessagesScreen />);
    expect(getByText('Messages')).toBeTruthy();
  });

  it('shows "0 conversations" when empty', () => {
    const { getByText } = render(<MessagesScreen />);
    expect(getByText('0 conversations')).toBeTruthy();
  });

  it('shows connection status indicator', () => {
    const { getByText } = render(<MessagesScreen />);
    // useRealtimeMessages mock returns connected: true
    expect(getByText('Live')).toBeTruthy();
  });

  it('renders filter chips', () => {
    const { getByText } = render(<MessagesScreen />);
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Unread')).toBeTruthy();
    expect(getByText('Direct')).toBeTruthy();
    expect(getByText('Groups')).toBeTruthy();
    expect(getByText('External')).toBeTruthy();
  });

  it('renders empty state when no conversations', () => {
    const { getByText } = render(<MessagesScreen />);
    expect(getByText('No messages yet')).toBeTruthy();
    expect(getByText('Start a conversation with your care team')).toBeTruthy();
  });

  it('renders conversations when data is available', () => {
    const mockConversations = [
      {
        id: 1, title: 'Care Team', type: 'channel',
        last_message_preview: 'Hello team', last_message_at: new Date().toISOString(),
        unread_count: 2, participants: [{ name: 'Nurse Sarah', role: 'Nurse' }],
      },
      {
        id: 2, title: null, type: 'direct',
        last_message_preview: 'Hi', last_message_at: new Date().toISOString(),
        unread_count: 0, participants: [
          { name: 'Nurse Sarah', role: 'Nurse' },
          { name: 'Dr. Chen', role: 'Doctor' },
        ],
      },
    ];

    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'conversations') return { data: mockConversations, isLoading: false, refetch: jest.fn() };
      if (queryKey[0] === 'contacts') return { data: [], isLoading: false, refetch: jest.fn() };
      return { data: undefined, isLoading: false, refetch: jest.fn() };
    });

    const { getByText } = render(<MessagesScreen />);
    expect(getByText('Care Team')).toBeTruthy();
    expect(getByText('Test Conv')).toBeTruthy(); // from mock getConversationDisplayName
  });

  it('shows unread count badge', () => {
    const mockConversations = [
      {
        id: 1, title: 'Care Team', type: 'channel',
        unread_count: 3, last_message_at: new Date().toISOString(),
        participants: [],
      },
    ];

    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'conversations') return { data: mockConversations, isLoading: false, refetch: jest.fn() };
      return { data: [], isLoading: false, refetch: jest.fn() };
    });

    const { getByText } = render(<MessagesScreen />);
    // Unread count in header
    expect(getByText(/1 conversation.*3 unread/)).toBeTruthy();
  });

  it('shows search input', () => {
    const { getByPlaceholderText } = render(<MessagesScreen />);
    expect(getByPlaceholderText('Search conversations...')).toBeTruthy();
  });

  it('filters by search query', () => {
    const { getConversationDisplayName } = require('../services/messagingService');
    getConversationDisplayName.mockImplementation((conv) => conv.title || 'Unknown');

    const mockConversations = [
      { id: 1, title: 'Care Team', type: 'channel', unread_count: 0, last_message_at: null, participants: [] },
      { id: 2, title: 'Dr. Chen', type: 'direct', unread_count: 0, last_message_at: null, participants: [] },
    ];

    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'conversations') return { data: mockConversations, isLoading: false, refetch: jest.fn() };
      return { data: [], isLoading: false, refetch: jest.fn() };
    });

    const { getByPlaceholderText, queryByText } = render(<MessagesScreen />);

    fireEvent.changeText(getByPlaceholderText('Search conversations...'), 'Chen');

    // Care Team should be filtered out, Dr. Chen should remain
    expect(queryByText('Dr. Chen')).toBeTruthy();
    expect(queryByText('Care Team')).toBeNull();
  });
});

// ─── Messaging API Integration Tests ─────────────

describe.skip('Messaging API Integration', () => {
  const BASE = 'http://localhost:3001';

  it('GET /api/contacts returns array', async () => {
    const res = await fetch(`${BASE}/api/contacts`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('GET /api/contacts?type=internal filters correctly', async () => {
    const res = await fetch(`${BASE}/api/contacts?type=internal`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    data.forEach((contact) => {
      expect(contact.stakeholder_type).toBe('internal');
    });
  });

  it('GET /api/contacts?type=external filters correctly', async () => {
    const res = await fetch(`${BASE}/api/contacts?type=external`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    data.forEach((contact) => {
      expect(contact.stakeholder_type).toBe('external');
    });
  });

  it('GET /api/conversations returns conversations for user', async () => {
    const res = await fetch(`${BASE}/api/conversations?user=Nurse%20Sarah`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('title');
      expect(data[0]).toHaveProperty('type');
      expect(data[0]).toHaveProperty('participants');
    }
  });

  it('POST /api/conversations creates a conversation', async () => {
    const res = await fetch(`${BASE}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test API Conv',
        type: 'group',
        created_by: 'Nurse Sarah',
        participants: [
          { name: 'Nurse Sarah', role: 'Nurse', type: 'internal' },
          { name: 'Dr. James Chen', role: 'Doctor', type: 'internal' },
        ],
      }),
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.title).toBe('Test API Conv');
  });

  it('GET /api/conversations/:id/messages returns messages', async () => {
    // Get first conversation
    const convRes = await fetch(`${BASE}/api/conversations?user=Nurse%20Sarah`);
    const convs = await convRes.json();
    if (convs.length === 0) return;

    const res = await fetch(`${BASE}/api/conversations/${convs[0].id}/messages`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('POST /api/conversations/:id/messages sends a message', async () => {
    const convRes = await fetch(`${BASE}/api/conversations?user=Nurse%20Sarah`);
    const convs = await convRes.json();
    if (convs.length === 0) return;

    const res = await fetch(`${BASE}/api/conversations/${convs[0].id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_name: 'Nurse Sarah',
        sender_role: 'Nurse',
        content: 'Test message from Jest',
        message_type: 'text',
      }),
    });
    expect(res.ok).toBe(true);
    const msg = await res.json();
    expect(msg.content).toBe('Test message from Jest');
    expect(msg.sender_name).toBe('Nurse Sarah');
  });

  it('POST /api/contacts creates a new contact', async () => {
    const res = await fetch(`${BASE}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Test Contact ${Date.now()}`,
        role: 'Nurse',
        stakeholder_type: 'internal',
        phone: '0400000000',
        email: 'test@example.com',
      }),
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.role).toBe('Nurse');
  });
});
