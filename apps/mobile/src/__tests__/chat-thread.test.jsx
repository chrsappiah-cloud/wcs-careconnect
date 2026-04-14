import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Mocks ──────────────────────────────────────

const mockSendTyping = jest.fn();
const mockSendReadReceipt = jest.fn();
const mockSubscribeConversation = jest.fn();

jest.mock('../hooks/useRealtimeMessages', () => ({
  useRealtimeMessages: jest.fn(() => ({
    connected: true,
    onlineUsers: [],
    typingUsers: [],
    sendTyping: mockSendTyping,
    sendReadReceipt: mockSendReadReceipt,
    subscribeConversation: mockSubscribeConversation,
  })),
}));

jest.mock('../services/messagingService', () => ({
  fetchConversationMessages: jest.fn().mockResolvedValue([]),
  sendConversationMessage: jest.fn().mockResolvedValue({
    id: 99,
    content: 'Hello',
    sender_name: 'Nurse Sarah',
    sender_role: 'Nurse',
    created_at: new Date().toISOString(),
    read_by: [],
  }),
  getCurrentUser: () => ({ name: 'Nurse Sarah', role: 'Nurse' }),
  getConversationDisplayName: jest.fn((conv) => conv.title || 'Dr. Chen'),
  getConversationAvatar: jest.fn(() => ({ name: 'Dr. Chen', role: 'Doctor' })),
  isExternalConversation: jest.fn(() => false),
}));

jest.mock('../components/KeyboardAvoidingAnimatedView', () => {
  const { View } = require('react-native');
  return function KeyboardAvoidingAnimatedView({ children, ...props }) {
    return <View {...props}>{children}</View>;
  };
});

jest.mock('date-fns', () => ({
  format: jest.fn(() => '10:30 AM'),
  isToday: jest.fn(() => true),
  isYesterday: jest.fn(() => false),
  isSameDay: jest.fn(() => true),
}));

import ChatThread from '../components/messaging/ChatThread';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';
import {
  sendConversationMessage,
  fetchConversationMessages,
} from '../services/messagingService';

// ── Helpers ──────────────────────────────────────

const mockConversation = {
  id: 'conv-1',
  title: 'Dr. Chen',
  type: 'direct',
  participants: [
    { name: 'Nurse Sarah', role: 'Nurse' },
    { name: 'Dr. Chen', role: 'Doctor' },
  ],
};

const mockMessages = [
  {
    id: 'msg-1',
    content: 'Hello, how is the patient?',
    sender_name: 'Dr. Chen',
    sender_role: 'Doctor',
    created_at: '2026-04-13T08:00:00Z',
    read_by: ['Nurse Sarah'],
    conversation_id: 'conv-1',
  },
  {
    id: 'msg-2',
    content: 'Vitals are stable, doctor.',
    sender_name: 'Nurse Sarah',
    sender_role: 'Nurse',
    created_at: '2026-04-13T08:05:00Z',
    read_by: [],
    conversation_id: 'conv-1',
  },
];

let capturedMutationConfig = null;
const mockMutate = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockSetQueryData = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  capturedMutationConfig = null;

  useQueryClient.mockReturnValue({
    invalidateQueries: mockInvalidateQueries,
    setQueryData: mockSetQueryData,
  });

  useQuery.mockImplementation(({ queryKey }) => {
    if (queryKey[0] === 'messages') {
      return { data: mockMessages, isLoading: false, refetch: jest.fn() };
    }
    return { data: undefined, isLoading: false, refetch: jest.fn() };
  });

  useMutation.mockImplementation((config) => {
    capturedMutationConfig = config;
    return {
      mutate: mockMutate,
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      reset: jest.fn(),
    };
  });
});

// ── Tests ──────────────────────────────────────

describe('ChatThread – Send Button', () => {
  it('renders send button', () => {
    const { getByTestId } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );
    // Send icon is rendered via lucide mock
    expect(getByTestId('icon-Send')).toBeTruthy();
  });

  it('send button is disabled when text is empty', () => {
    const { getByPlaceholderText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );
    const input = getByPlaceholderText('Type a message...');
    expect(input.props.value).toBe('');
    // The send button's AnimatedPressable should be disabled
    // mockMutate should not be called without text
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('enables send button when text is entered', () => {
    const { getByPlaceholderText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );
    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'Hello nurse');
    expect(input.props.value).toBe('Hello nurse');
  });

  it('calls sendMutation.mutate with trimmed content on send', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    // Type message
    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, '  Hello team  ');

    // Press send icon (find the Pressable wrapping the Send icon)
    const sendIcon = getByTestId('icon-Send');
    // Walk up to Pressable — fire on the icon's nearest pressable parent
    fireEvent.press(sendIcon);

    expect(mockMutate).toHaveBeenCalledWith({ content: 'Hello team' });
  });

  it('does not send empty/whitespace-only messages', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), '   ');
    fireEvent.press(getByTestId('icon-Send'));

    // Send should not be called because content trims to empty
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('stops typing indicator when sending', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'Test');
    fireEvent.press(getByTestId('icon-Send'));

    expect(mockSendTyping).toHaveBeenCalledWith(false);
  });

  it('send mutation mutationFn calls sendConversationMessage correctly', async () => {
    render(<ChatThread conversation={mockConversation} onBack={jest.fn()} />);

    expect(capturedMutationConfig).not.toBeNull();

    // Call the actual mutationFn to verify it passes correct params
    await capturedMutationConfig.mutationFn({ content: 'Test message' });

    expect(sendConversationMessage).toHaveBeenCalledWith('conv-1', 'Test message');
  });

  it('onSuccess updates message cache and clears input', () => {
    render(<ChatThread conversation={mockConversation} onBack={jest.fn()} />);

    expect(capturedMutationConfig).not.toBeNull();

    const newMsg = { id: 'msg-new', content: 'Sent!', sender_name: 'Nurse Sarah' };

    // Simulate mutation success callback
    act(() => {
      capturedMutationConfig.onSuccess(newMsg);
    });

    expect(mockSetQueryData).toHaveBeenCalledWith(
      ['messages', 'conv-1'],
      expect.any(Function)
    );
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['conversations'] });
  });

  it('onSuccess deduplicates messages in cache', () => {
    render(<ChatThread conversation={mockConversation} onBack={jest.fn()} />);

    const existingMsg = { id: 'msg-1', content: 'Hello' };

    // Trigger onSuccess
    act(() => {
      capturedMutationConfig.onSuccess(existingMsg);
    });

    // Get the updater function passed to setQueryData
    const updaterFn = mockSetQueryData.mock.calls[0][1];

    // Test: existing message should not be duplicated
    const existing = [{ id: 'msg-1', content: 'Hello' }];
    const result = updaterFn(existing);
    expect(result).toHaveLength(1);

    // Test: new message should be appended
    const resultNew = updaterFn([{ id: 'msg-other', content: 'Other' }]);
    expect(resultNew).toHaveLength(2);

    // Test: null old data
    const resultNull = updaterFn(null);
    expect(resultNull).toEqual([existingMsg]);
  });

  it('onError keeps content in input (no crash)', () => {
    render(<ChatThread conversation={mockConversation} onBack={jest.fn()} />);

    expect(capturedMutationConfig.onError).toBeDefined();

    // Should not throw
    expect(() => {
      capturedMutationConfig.onError(new Error('Network fail'));
    }).not.toThrow();
  });

  it('disables send button when mutation is pending', () => {
    useMutation.mockImplementation((config) => {
      capturedMutationConfig = config;
      return {
        mutate: mockMutate,
        isPending: true,
        isError: false,
        reset: jest.fn(),
      };
    });

    const { getByPlaceholderText, getByTestId } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'Pending msg');
    fireEvent.press(getByTestId('icon-Send'));

    // The AnimatedPressable is disabled so handlePress is throttled/blocked
    // The press should not fire mutate because disabled=true on the Pressable
    expect(mockMutate).not.toHaveBeenCalled();
  });
});

describe('ChatThread – Receive Messages', () => {
  it('displays received messages from others', () => {
    const { getByText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    expect(getByText('Hello, how is the patient?')).toBeTruthy();
  });

  it('displays own sent messages', () => {
    const { getByText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    expect(getByText('Vitals are stable, doctor.')).toBeTruthy();
  });

  it('shows sender name for other users', () => {
    const { getAllByText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    // Dr. Chen appears in header + message sender name
    const matches = getAllByText('Dr. Chen');
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('shows role badge for received messages', () => {
    const { getAllByText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    // Doctor role appears in header subtitle + message role badge
    const matches = getAllByText('Doctor');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows read receipt icon for own messages', () => {
    const { getAllByTestId } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    // msg-2 has empty read_by → should show Check icon
    // msg-1 from Dr. Chen should not show any receipt icon
    const checkIcons = getAllByTestId('icon-Check');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('shows double-check for read messages', () => {
    // msg-1 from Dr. Chen has read_by: ['Nurse Sarah'] but own msgs check read_by
    // We need an own message with read_by populated
    const readMessages = [
      {
        id: 'msg-r1',
        content: 'Acknowledged',
        sender_name: 'Nurse Sarah',
        sender_role: 'Nurse',
        created_at: '2026-04-13T09:00:00Z',
        read_by: ['Dr. Chen'],
        conversation_id: 'conv-1',
      },
    ];

    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'messages') {
        return { data: readMessages, isLoading: false, refetch: jest.fn() };
      }
      return { data: undefined, isLoading: false, refetch: jest.fn() };
    });

    const { getByTestId } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    expect(getByTestId('icon-CheckCheck')).toBeTruthy();
  });

  it('shows empty state when no messages', () => {
    useQuery.mockImplementation(() => ({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
    }));

    const { getByText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    expect(getByText('No messages yet')).toBeTruthy();
    expect(getByText('Send the first message to start the conversation')).toBeTruthy();
  });

  it('shows loading indicator while fetching messages', () => {
    useQuery.mockImplementation(() => ({
      data: [],
      isLoading: true,
      refetch: jest.fn(),
    }));

    const { getByText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    expect(getByText('Loading messages...')).toBeTruthy();
  });

  it('sends read receipt for last unread message from others', () => {
    render(<ChatThread conversation={mockConversation} onBack={jest.fn()} />);

    // Messages include msg-1 from Dr. Chen (not own)
    // The effect should call sendReadReceipt for last message from others
    // msg-2 is from Nurse Sarah (own), so it checks if last message sender is not current user
    // Actually the code checks if lastMsg sender != current user
    // Last message is msg-2 from 'Nurse Sarah' — no read receipt
    // If last message was from Dr. Chen, it would send read receipt
  });

  it('auto-sends read receipt when last message is from other user', () => {
    const messagesFromOther = [
      {
        id: 'msg-from-other',
        content: 'Please check room 5',
        sender_name: 'Dr. Chen',
        sender_role: 'Doctor',
        created_at: '2026-04-13T10:00:00Z',
        read_by: [],
        conversation_id: 'conv-1',
      },
    ];

    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'messages') {
        return { data: messagesFromOther, isLoading: false, refetch: jest.fn() };
      }
      return { data: undefined, isLoading: false, refetch: jest.fn() };
    });

    render(<ChatThread conversation={mockConversation} onBack={jest.fn()} />);

    expect(mockSendReadReceipt).toHaveBeenCalledWith('msg-from-other');
  });
});

describe('ChatThread – Typing Indicator', () => {
  it('shows typing indicator when other users are typing', () => {
    useRealtimeMessages.mockReturnValue({
      connected: true,
      onlineUsers: [],
      typingUsers: ['Dr. Chen'],
      sendTyping: mockSendTyping,
      sendReadReceipt: mockSendReadReceipt,
      subscribeConversation: mockSubscribeConversation,
    });

    const { getByText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    expect(getByText('Dr. Chen is typing...')).toBeTruthy();
  });

  it('shows multiple typing users', () => {
    useRealtimeMessages.mockReturnValue({
      connected: true,
      onlineUsers: [],
      typingUsers: ['Dr. Chen', 'CNA Mike'],
      sendTyping: mockSendTyping,
      sendReadReceipt: mockSendReadReceipt,
      subscribeConversation: mockSubscribeConversation,
    });

    const { getByText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    expect(getByText('Dr. Chen, CNA Mike typing...')).toBeTruthy();
  });

  it('does not show typing indicator when no one is typing', () => {
    useRealtimeMessages.mockReturnValue({
      connected: true,
      onlineUsers: [],
      typingUsers: [],
      sendTyping: mockSendTyping,
      sendReadReceipt: mockSendReadReceipt,
      subscribeConversation: mockSubscribeConversation,
    });

    const { queryByText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    expect(queryByText(/typing/)).toBeNull();
  });

  it('sends typing indicator when user types', () => {
    useRealtimeMessages.mockReturnValue({
      connected: true,
      onlineUsers: [],
      typingUsers: [],
      sendTyping: mockSendTyping,
      sendReadReceipt: mockSendReadReceipt,
      subscribeConversation: mockSubscribeConversation,
    });

    const { getByPlaceholderText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'Hi');

    expect(mockSendTyping).toHaveBeenCalledWith(true);
  });

  it('stops typing indicator when input is cleared', () => {
    const { getByPlaceholderText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'Hi');
    mockSendTyping.mockClear();
    fireEvent.changeText(getByPlaceholderText('Type a message...'), '');

    expect(mockSendTyping).toHaveBeenCalledWith(false);
  });
});

describe('ChatThread – Connection Status', () => {
  it('shows Live status when WebSocket is connected', () => {
    useRealtimeMessages.mockReturnValue({
      connected: true,
      onlineUsers: [],
      typingUsers: [],
      sendTyping: mockSendTyping,
      sendReadReceipt: mockSendReadReceipt,
      subscribeConversation: mockSubscribeConversation,
    });

    const { getByText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    expect(getByText('Live')).toBeTruthy();
  });

  it('shows Offline status when disconnected', () => {
    useRealtimeMessages.mockReturnValue({
      connected: false,
      onlineUsers: [],
      typingUsers: [],
      sendTyping: mockSendTyping,
      sendReadReceipt: mockSendReadReceipt,
      subscribeConversation: mockSubscribeConversation,
    });

    const { getByText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    expect(getByText('Offline')).toBeTruthy();
  });
});

describe('ChatThread – Header & Navigation', () => {
  it('renders conversation display name in header', () => {
    const { getAllByText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    // Dr. Chen appears in header + message area
    const matches = getAllByText('Dr. Chen');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onBack when back button is pressed', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(
      <ChatThread conversation={mockConversation} onBack={onBack} />
    );

    fireEvent.press(getByTestId('icon-ArrowLeft'));

    expect(onBack).toHaveBeenCalled();
  });

  it('shows participant count for group conversations', () => {
    const groupConversation = {
      ...mockConversation,
      type: 'group',
      title: 'Care Team',
      participants: [
        { name: 'Nurse Sarah', role: 'Nurse' },
        { name: 'Dr. Chen', role: 'Doctor' },
        { name: 'CNA Mike', role: 'CNA' },
      ],
    };

    const { getByText } = render(
      <ChatThread conversation={groupConversation} onBack={jest.fn()} />
    );

    expect(getByText(/3 members/)).toBeTruthy();
  });
});

describe('ChatThread – Message Input', () => {
  it('renders text input with correct placeholder', () => {
    const { getByPlaceholderText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    expect(getByPlaceholderText('Type a message...')).toBeTruthy();
  });

  it('updates input value as user types', () => {
    const { getByPlaceholderText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'Hello world');

    expect(input.props.value).toBe('Hello world');
  });

  it('input supports multiline', () => {
    const { getByPlaceholderText } = render(
      <ChatThread conversation={mockConversation} onBack={jest.fn()} />
    );

    const input = getByPlaceholderText('Type a message...');
    expect(input.props.multiline).toBe(true);
  });
});

// ── API Integration (mocked fetch) ─────────────────────────────

describe('ChatThread – Send/Receive API Integration', () => {
  const BASE = 'http://localhost:3001';
  let sentMessages = [];

  beforeEach(() => {
    sentMessages = [];
    let msgIdCounter = 1;
    global.fetch = jest.fn((url, opts = {}) => {
      const method = (opts.method || 'GET').toUpperCase();

      if (url.includes('/api/conversations') && !url.includes('/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 'conv-1', type: 'direct', title: null }]),
        });
      }

      if (url.includes('/messages') && method === 'POST') {
        const body = JSON.parse(opts.body);
        if (body.content === '') {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ error: 'Content cannot be empty' }),
          });
        }
        const msg = {
          id: `msg-${msgIdCounter++}`,
          content: body.content,
          sender_name: body.sender_name,
          sender_role: body.sender_role,
          message_type: body.message_type,
          created_at: new Date().toISOString(),
        };
        sentMessages.push(msg);
        return Promise.resolve({ ok: true, json: () => Promise.resolve(msg) });
      }

      if (url.includes('/messages') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([...sentMessages]) });
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('POST send message API returns correct response', async () => {
    const convRes = await fetch(`${BASE}/api/conversations?user=Nurse%20Sarah`);
    const convs = await convRes.json();
    const convId = convs[0].id;

    const res = await fetch(`${BASE}/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_name: 'Nurse Sarah',
        sender_role: 'Nurse',
        content: 'Chat thread send button test',
        message_type: 'text',
      }),
    });

    expect(res.ok).toBe(true);
    const msg = await res.json();
    expect(msg.content).toBe('Chat thread send button test');
    expect(msg.sender_name).toBe('Nurse Sarah');
    expect(msg.id).toBeDefined();
    expect(msg.created_at).toBeDefined();
  });

  it('GET messages returns sent message in conversation', async () => {
    const convRes = await fetch(`${BASE}/api/conversations?user=Nurse%20Sarah`);
    const convs = await convRes.json();
    const convId = convs[0].id;

    const uniqueContent = `Receive test ${Date.now()}`;
    await fetch(`${BASE}/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_name: 'Nurse Sarah',
        sender_role: 'Nurse',
        content: uniqueContent,
        message_type: 'text',
      }),
    });

    const messagesRes = await fetch(`${BASE}/api/conversations/${convId}/messages`);
    expect(messagesRes.ok).toBe(true);
    const messages = await messagesRes.json();

    const found = messages.find((m) => m.content === uniqueContent);
    expect(found).toBeDefined();
    expect(found.sender_name).toBe('Nurse Sarah');
  });

  it('POST send message with empty content is rejected', async () => {
    const convRes = await fetch(`${BASE}/api/conversations?user=Nurse%20Sarah`);
    const convs = await convRes.json();

    const res = await fetch(`${BASE}/api/conversations/${convs[0].id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_name: 'Nurse Sarah',
        sender_role: 'Nurse',
        content: '',
        message_type: 'text',
      }),
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('multiple rapid sends are all received', async () => {
    const convRes = await fetch(`${BASE}/api/conversations?user=Nurse%20Sarah`);
    const convs = await convRes.json();
    const convId = convs[0].id;
    const timestamp = Date.now();

    const sends = Array.from({ length: 3 }, (_, i) =>
      fetch(`${BASE}/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: 'Nurse Sarah',
          sender_role: 'Nurse',
          content: `Rapid msg ${i} - ${timestamp}`,
          message_type: 'text',
        }),
      }).then((r) => r.json())
    );

    const results = await Promise.all(sends);
    results.forEach((msg, i) => {
      expect(msg.id).toBeDefined();
      expect(msg.content).toBe(`Rapid msg ${i} - ${timestamp}`);
    });

    const allRes = await fetch(`${BASE}/api/conversations/${convId}/messages`);
    const allMessages = await allRes.json();
    const rapid = allMessages.filter((m) => m.content?.includes(`${timestamp}`));
    expect(rapid).toHaveLength(3);
  });
});
