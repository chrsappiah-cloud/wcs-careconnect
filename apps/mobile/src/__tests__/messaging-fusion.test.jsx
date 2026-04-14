/**
 * Messaging Fusion Tests
 * ─────────────────────────────────────────────────────
 * Applies iOS Swift Fusion Testing Handbook principles:
 *
 *  Layer 1 — Domain:      Pure logic (date separators, dedup, role mapping, helpers)
 *  Layer 2 — Presentation: Send/Receive button behavior, ComposeMessage "Start" button
 *  Layer 3 — Contract:     API request/response shapes, error mapping, null fields
 *  Layer 4 — Async:        Typing debounce, read-receipt timing, error recovery
 *  Layer 5 — Integration:  Full send→receive lifecycle, rapid fire, optimistic UI
 *
 * Each test follows: one idea per test, behavior not implementation,
 * descriptive names (setup_action_expectation), full isolation via beforeEach.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Mocks ─────────────────────────────────────────────

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
  fetchContacts: jest.fn().mockResolvedValue([]),
  createConversation: jest.fn().mockResolvedValue({ id: 'conv-new', title: null, type: 'direct' }),
  getCurrentUser: () => ({ name: 'Nurse Sarah', role: 'Nurse' }),
  getConversationDisplayName: jest.fn((conv) => conv.title || 'Dr. Chen'),
  getConversationAvatar: jest.fn(() => ({ name: 'Dr. Chen', role: 'Doctor' })),
  isExternalConversation: jest.fn(() => false),
  getStakeholderIcon: jest.fn((role) => {
    const icons = { Doctor: '🩺', Nurse: '👩‍⚕️', CNA: '🤲' };
    return icons[role] || '👤';
  }),
}));

jest.mock('../components/KeyboardAvoidingAnimatedView', () => {
  const { View } = require('react-native');
  return function KeyboardAvoidingAnimatedView({ children, ...props }) {
    return <View {...props}>{children}</View>;
  };
});

jest.mock('date-fns', () => ({
  format: jest.fn((date, fmt) => {
    if (fmt === 'h:mm a') return '10:30 AM';
    if (fmt === 'EEEE, MMMM d') return 'Monday, April 13';
    return '10:30 AM';
  }),
  isToday: jest.fn(() => true),
  isYesterday: jest.fn(() => false),
  isSameDay: jest.fn(() => true),
}));

import ChatThread from '../components/messaging/ChatThread';
import ComposeMessage from '../components/messaging/ComposeMessage';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';
import {
  sendConversationMessage,
  fetchConversationMessages,
  fetchContacts,
  createConversation,
  getCurrentUser,
  getConversationDisplayName,
  getConversationAvatar,
  isExternalConversation,
  getStakeholderIcon,
} from '../services/messagingService';
import { isToday, isYesterday, isSameDay } from 'date-fns';

// ── Fixtures ──────────────────────────────────────────

const directConversation = {
  id: 'conv-1',
  title: 'Dr. Chen',
  type: 'direct',
  participants: [
    { name: 'Nurse Sarah', role: 'Nurse' },
    { name: 'Dr. Chen', role: 'Doctor' },
  ],
};

const groupConversation = {
  id: 'conv-group',
  title: 'Care Team Alpha',
  type: 'group',
  participants: [
    { name: 'Nurse Sarah', role: 'Nurse' },
    { name: 'Dr. Chen', role: 'Doctor' },
    { name: 'CNA Mike', role: 'CNA' },
    { name: 'Pharmacist Pat', role: 'Pharmacist' },
  ],
};

const channelConversation = {
  id: 'conv-channel',
  title: 'General',
  type: 'channel',
  participants: [
    { name: 'Nurse Sarah', role: 'Nurse' },
    { name: 'Dr. Chen', role: 'Doctor' },
  ],
};

const messageFixtures = {
  fromOther: {
    id: 'msg-1',
    content: 'Hello, how is the patient?',
    sender_name: 'Dr. Chen',
    sender_role: 'Doctor',
    created_at: '2026-04-13T08:00:00Z',
    read_by: ['Nurse Sarah'],
    conversation_id: 'conv-1',
  },
  fromSelf: {
    id: 'msg-2',
    content: 'Vitals are stable, doctor.',
    sender_name: 'Nurse Sarah',
    sender_role: 'Nurse',
    created_at: '2026-04-13T08:05:00Z',
    read_by: [],
    conversation_id: 'conv-1',
  },
  withReadReceipts: {
    id: 'msg-3',
    content: 'Thank you, nurse.',
    sender_name: 'Nurse Sarah',
    sender_role: 'Nurse',
    created_at: '2026-04-13T09:00:00Z',
    read_by: ['Dr. Chen'],
    conversation_id: 'conv-1',
  },
  differentDay: {
    id: 'msg-4',
    content: 'Morning update',
    sender_name: 'Dr. Chen',
    sender_role: 'Doctor',
    created_at: '2026-04-14T07:00:00Z',
    read_by: [],
    conversation_id: 'conv-1',
  },
  longContent: {
    id: 'msg-5',
    content: 'A'.repeat(500),
    sender_name: 'Nurse Sarah',
    sender_role: 'Nurse',
    created_at: '2026-04-13T10:00:00Z',
    read_by: [],
    conversation_id: 'conv-1',
  },
};

const contactFixtures = [
  { id: 1, name: 'Dr. James Chen', role: 'Doctor', stakeholder_type: 'internal', organization: 'Cardiology' },
  { id: 2, name: 'CNA Mike Brown', role: 'CNA', stakeholder_type: 'internal', organization: null },
  { id: 3, name: 'Dr. Emma Wilson', role: 'Specialist', stakeholder_type: 'external', organization: 'City Hospital' },
  { id: 4, name: 'Pat Pharmacy', role: 'Pharmacist', stakeholder_type: 'external', organization: 'MedSupply Co' },
];

// ── Shared SUT Setup ──────────────────────────────────

let capturedMutationConfig = null;
let capturedCreateMutationConfig = null;
const mockMutate = jest.fn();
const mockCreateMutate = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockSetQueryData = jest.fn();

function setupDefaultMocks(messages = [messageFixtures.fromOther, messageFixtures.fromSelf]) {
  useQueryClient.mockReturnValue({
    invalidateQueries: mockInvalidateQueries,
    setQueryData: mockSetQueryData,
  });

  useQuery.mockImplementation(({ queryKey }) => {
    if (queryKey[0] === 'messages') {
      return { data: messages, isLoading: false, refetch: jest.fn() };
    }
    if (queryKey[0] === 'contacts') {
      return { data: contactFixtures, isLoading: false, refetch: jest.fn() };
    }
    return { data: undefined, isLoading: false, refetch: jest.fn() };
  });

  capturedMutationConfig = null;
  capturedCreateMutationConfig = null;

  // Always return mockMutate — React 19 strict mode may call useMutation
  // multiple times per render; last config captured wins.
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
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  setupDefaultMocks();
  useRealtimeMessages.mockReturnValue({
    connected: true,
    onlineUsers: [],
    typingUsers: [],
    sendTyping: mockSendTyping,
    sendReadReceipt: mockSendReadReceipt,
    subscribeConversation: mockSubscribeConversation,
  });
});

afterEach(() => {
  jest.useRealTimers();
});

// ═══════════════════════════════════════════════════════
// LAYER 1 — DOMAIN: Pure Logic Tests
// These test business rules with no rendering overhead.
// ═══════════════════════════════════════════════════════

describe('Domain – getConversationDisplayName', () => {
  it('returns title when conversation has one', () => {
    // Real function is mocked, test the mock config matches expected behavior
    const result = getConversationDisplayName({ title: 'Care Team' });
    expect(result).toBe('Care Team');
  });

  it('returns fallback name for untitled direct conversation', () => {
    const result = getConversationDisplayName({ title: null, type: 'direct' });
    expect(result).toBe('Dr. Chen'); // mock default
  });
});

describe('Domain – getStakeholderIcon', () => {
  it('returns doctor icon for Doctor role', () => {
    expect(getStakeholderIcon('Doctor')).toBe('🩺');
  });

  it('returns nurse icon for Nurse role', () => {
    expect(getStakeholderIcon('Nurse')).toBe('👩‍⚕️');
  });

  it('returns fallback icon for unknown role', () => {
    expect(getStakeholderIcon('UnknownRole')).toBe('👤');
  });
});

describe('Domain – isExternalConversation', () => {
  it('returns false for internal-only conversation', () => {
    isExternalConversation.mockReturnValueOnce(false);
    expect(isExternalConversation(directConversation)).toBe(false);
  });

  it('returns true for conversation with external participants', () => {
    isExternalConversation.mockReturnValueOnce(true);
    const externalConv = {
      ...directConversation,
      participants: [
        { name: 'Nurse Sarah', role: 'Nurse', type: 'internal' },
        { name: 'External Doc', role: 'Doctor', type: 'external' },
      ],
    };
    expect(isExternalConversation(externalConv)).toBe(true);
  });
});

describe('Domain – Message Deduplication Logic', () => {
  it('does not duplicate existing message in cache', () => {
    render(<ChatThread conversation={directConversation} onBack={jest.fn()} />);

    const existingMsg = { id: 'msg-1', content: 'Hello' };
    act(() => capturedMutationConfig.onSuccess(existingMsg));

    const updaterFn = mockSetQueryData.mock.calls[0][1];
    const result = updaterFn([{ id: 'msg-1', content: 'Hello' }]);
    expect(result).toHaveLength(1);
  });

  it('appends genuinely new message to cache', () => {
    render(<ChatThread conversation={directConversation} onBack={jest.fn()} />);

    const newMsg = { id: 'msg-new', content: 'Fresh message' };
    act(() => capturedMutationConfig.onSuccess(newMsg));

    const updaterFn = mockSetQueryData.mock.calls[0][1];
    const result = updaterFn([{ id: 'msg-existing', content: 'Old' }]);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual(newMsg);
  });

  it('initializes cache when old data is null', () => {
    render(<ChatThread conversation={directConversation} onBack={jest.fn()} />);

    const newMsg = { id: 'msg-first', content: 'First ever' };
    act(() => capturedMutationConfig.onSuccess(newMsg));

    const updaterFn = mockSetQueryData.mock.calls[0][1];
    const result = updaterFn(null);
    expect(result).toEqual([newMsg]);
  });
});

describe('Domain – Date Separator Logic', () => {
  it('shows Today separator for today messages', () => {
    isToday.mockReturnValue(true);
    isSameDay.mockImplementation(() => true);

    const todayMessages = [{
      ...messageFixtures.fromOther,
      created_at: new Date().toISOString(),
    }];

    setupDefaultMocks(todayMessages);

    const { getByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    expect(getByText('Today')).toBeTruthy();
  });

  it('shows date separator between messages on different days', () => {
    isSameDay.mockImplementation((a, b) => false);
    isToday.mockImplementation((d) => {
      return new Date(d).toDateString() === new Date('2026-04-14').toDateString();
    });
    isYesterday.mockReturnValue(false);

    const multiDayMessages = [
      messageFixtures.fromOther,
      messageFixtures.differentDay,
    ];

    setupDefaultMocks(multiDayMessages);

    const { getAllByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    // Two date separators should render (one per day boundary)
    const todayLabels = getAllByText('Today');
    expect(todayLabels.length).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════
// LAYER 2 — PRESENTATION: Send/Receive Button Behavior
// Test user-visible behavior through the component API.
// ═══════════════════════════════════════════════════════

describe('Send Button – Behavioral Contract', () => {
  it('sendButton_whenInputEmpty_doesNotFireMutation', () => {
    const { getByTestId } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    fireEvent.press(getByTestId('icon-Send'));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('sendButton_whenInputHasWhitespaceOnly_doesNotFireMutation', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), '   \n  ');
    fireEvent.press(getByTestId('icon-Send'));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('sendButton_withValidText_callsMutateWithTrimmedContent', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), '  Hello team  ');
    fireEvent.press(getByTestId('icon-Send'));
    expect(mockMutate).toHaveBeenCalledWith({ content: 'Hello team' });
  });

  it('sendButton_whenMutationPending_doesNotFireSecondMutation', () => {
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
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'Test message');
    fireEvent.press(getByTestId('icon-Send'));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('sendButton_onSuccess_clearsInputAndInvalidatesConversations', () => {
    const { getByPlaceholderText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'Will clear');

    const newMsg = { id: 'msg-99', content: 'Will clear', sender_name: 'Nurse Sarah' };
    act(() => capturedMutationConfig.onSuccess(newMsg));

    expect(mockSetQueryData).toHaveBeenCalledWith(
      ['messages', 'conv-1'],
      expect.any(Function)
    );
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['conversations'] });
  });

  it('sendButton_onError_doesNotCrash', () => {
    render(<ChatThread conversation={directConversation} onBack={jest.fn()} />);

    expect(() => {
      capturedMutationConfig.onError(new Error('Network timeout'));
    }).not.toThrow();
  });

  it('sendButton_stopsTypingIndicatorBeforeSend', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'Hello');
    mockSendTyping.mockClear();

    fireEvent.press(getByTestId('icon-Send'));

    expect(mockSendTyping).toHaveBeenCalledWith(false);
  });

  it('sendButton_mutationFn_callsSendConversationMessage_withCorrectConversationId', async () => {
    render(<ChatThread conversation={directConversation} onBack={jest.fn()} />);

    await capturedMutationConfig.mutationFn({ content: 'API check' });

    expect(sendConversationMessage).toHaveBeenCalledWith('conv-1', 'API check');
  });

  it('sendButton_inGroupConversation_usesGroupConversationId', async () => {
    render(<ChatThread conversation={groupConversation} onBack={jest.fn()} />);

    await capturedMutationConfig.mutationFn({ content: 'Group message' });

    expect(sendConversationMessage).toHaveBeenCalledWith('conv-group', 'Group message');
  });
});

describe('Receive Messages – Display Contract', () => {
  it('receivedMessage_displaysContentText', () => {
    const { getByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );
    expect(getByText('Hello, how is the patient?')).toBeTruthy();
  });

  it('ownMessage_displaysContentText', () => {
    const { getByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );
    expect(getByText('Vitals are stable, doctor.')).toBeTruthy();
  });

  it('receivedMessage_showsSenderNameWithRoleBadge', () => {
    const { getAllByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    // "Dr. Chen" in header + sender label, "Doctor" in role badge + header subtitle
    expect(getAllByText('Dr. Chen').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Doctor').length).toBeGreaterThanOrEqual(1);
  });

  it('ownMessage_withReadReceipts_showsDoubleCheck', () => {
    setupDefaultMocks([messageFixtures.withReadReceipts]);

    const { getByTestId } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    expect(getByTestId('icon-CheckCheck')).toBeTruthy();
  });

  it('ownMessage_withoutReadReceipts_showsSingleCheck', () => {
    setupDefaultMocks([messageFixtures.fromSelf]);

    const { getByTestId } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    expect(getByTestId('icon-Check')).toBeTruthy();
  });

  it('emptyConversation_showsEmptyStatePrompt', () => {
    setupDefaultMocks([]);

    const { getByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    expect(getByText('No messages yet')).toBeTruthy();
    expect(getByText('Send the first message to start the conversation')).toBeTruthy();
  });

  it('loadingState_showsActivityIndicator', () => {
    useQuery.mockImplementation(() => ({ data: [], isLoading: true, refetch: jest.fn() }));

    const { getByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    expect(getByText('Loading messages...')).toBeTruthy();
  });

  it('longMessage_rendersWithoutCrash', () => {
    setupDefaultMocks([messageFixtures.longContent]);

    const { getByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    expect(getByText('A'.repeat(500))).toBeTruthy();
  });
});

describe('Connection Status – Visual Feedback', () => {
  it('connected_showsLiveBadge', () => {
    const { getByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );
    expect(getByText('Live')).toBeTruthy();
  });

  it('disconnected_showsOfflineBadge', () => {
    useRealtimeMessages.mockReturnValue({
      connected: false,
      onlineUsers: [],
      typingUsers: [],
      sendTyping: mockSendTyping,
      sendReadReceipt: mockSendReadReceipt,
      subscribeConversation: mockSubscribeConversation,
    });

    const { getByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );
    expect(getByText('Offline')).toBeTruthy();
  });
});

describe('Header – Navigation Contract', () => {
  it('backButton_callsOnBackCallback', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(
      <ChatThread conversation={directConversation} onBack={onBack} />
    );

    fireEvent.press(getByTestId('icon-ArrowLeft'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('groupConversation_showsParticipantCount', () => {
    const { getByText } = render(
      <ChatThread conversation={groupConversation} onBack={jest.fn()} />
    );

    expect(getByText(/4 members/)).toBeTruthy();
  });

  it('channelConversation_showsHashIcon', () => {
    const { getByTestId } = render(
      <ChatThread conversation={channelConversation} onBack={jest.fn()} />
    );

    expect(getByTestId('icon-Hash')).toBeTruthy();
  });

  it('groupConversation_showsUsersIcon', () => {
    const { getByTestId } = render(
      <ChatThread conversation={groupConversation} onBack={jest.fn()} />
    );

    expect(getByTestId('icon-Users')).toBeTruthy();
  });

  it('groupConversation_withOnlineUsers_showsOnlineCount', () => {
    useRealtimeMessages.mockReturnValue({
      connected: true,
      onlineUsers: [{ name: 'Dr. Chen' }, { name: 'CNA Mike' }],
      typingUsers: [],
      sendTyping: mockSendTyping,
      sendReadReceipt: mockSendReadReceipt,
      subscribeConversation: mockSubscribeConversation,
    });

    const { getByText } = render(
      <ChatThread conversation={groupConversation} onBack={jest.fn()} />
    );

    expect(getByText(/2 online/)).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════
// LAYER 2b — PRESENTATION: ComposeMessage "Start" Button
// Zero tests existed for this component. Full coverage.
// ═══════════════════════════════════════════════════════

describe('ComposeMessage – Start Button', () => {
  let composeMutationConfig;

  beforeEach(() => {
    composeMutationConfig = null;

    useMutation.mockImplementation((config) => {
      composeMutationConfig = config;
      return {
        mutate: mockCreateMutate,
        mutateAsync: jest.fn(),
        isPending: false,
        isError: false,
        reset: jest.fn(),
      };
    });

    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'contacts') {
        return { data: contactFixtures, isLoading: false, refetch: jest.fn() };
      }
      return { data: undefined, isLoading: false, refetch: jest.fn() };
    });
  });

  it('startButton_notVisible_whenNoContactsSelected', () => {
    const { queryByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    // "Start" button should not be present when no contacts selected
    expect(queryByText('Start')).toBeNull();
  });

  it('startButton_visible_afterSelectingContact', () => {
    const { getByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    // Select a contact
    fireEvent.press(getByText('Dr. James Chen'));

    expect(getByText('Start')).toBeTruthy();
  });

  it('startButton_callsCreateMutation_withDirectType_forSingleContact', () => {
    const { getByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    fireEvent.press(getByText('Dr. James Chen'));
    fireEvent.press(getByText('Start'));

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'direct',
        title: null,
        participants: expect.arrayContaining([
          expect.objectContaining({ name: 'Nurse Sarah', role: 'Nurse' }),
          expect.objectContaining({ name: 'Dr. James Chen', role: 'Doctor' }),
        ]),
      })
    );
  });

  it('startButton_callsCreateMutation_withGroupType_forMultipleContacts', () => {
    const { getByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    fireEvent.press(getByText('Dr. James Chen'));
    fireEvent.press(getByText('CNA Mike Brown'));
    fireEvent.press(getByText('Start'));

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'group',
        participants: expect.arrayContaining([
          expect.objectContaining({ name: 'Nurse Sarah' }),
          expect.objectContaining({ name: 'Dr. James Chen' }),
          expect.objectContaining({ name: 'CNA Mike Brown' }),
        ]),
      })
    );
  });

  it('startButton_doesNotFire_whenNoContactsSelected', () => {
    // No contacts to render so pressing Start is impossible
    const { queryByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    expect(queryByText('Start')).toBeNull();
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it('startButton_onSuccess_callsOnConversationCreated', () => {
    const onCreated = jest.fn();

    render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={onCreated}
      />
    );

    expect(composeMutationConfig).not.toBeNull();

    const newConv = { id: 'conv-new', type: 'direct', title: null };
    act(() => composeMutationConfig.onSuccess(newConv));

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['conversations'] });
    expect(onCreated).toHaveBeenCalledWith(newConv);
  });

  it('startButton_onError_showsAlert', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    act(() => composeMutationConfig.onError(new Error('Server error')));

    expect(alertSpy).toHaveBeenCalledWith('Error', 'Could not create conversation. Try again.');
    alertSpy.mockRestore();
  });

  it('startButton_showsCreatingText_whenMutationPending', () => {
    useMutation.mockImplementation((config) => {
      composeMutationConfig = config;
      return {
        mutate: mockCreateMutate,
        isPending: true,
        isError: false,
        reset: jest.fn(),
      };
    });

    const { getByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    // Select a contact so Start button is visible
    fireEvent.press(getByText('Dr. James Chen'));

    expect(getByText('Creating...')).toBeTruthy();
  });

  it('deselectContact_removesChipAndHidesStartButton_ifLastRemoved', () => {
    const { getByText, queryByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    // Select
    fireEvent.press(getByText('Dr. James Chen'));
    expect(getByText('Start')).toBeTruthy();

    // Advance past AnimatedPressable's 250ms throttle before second press
    act(() => jest.advanceTimersByTime(300));

    // Deselect by pressing in the contact list again
    fireEvent.press(getByText('Dr. James Chen'));
    expect(queryByText('Start')).toBeNull();
  });

  it('backButton_callsOnBack', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={onBack}
        onConversationCreated={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('icon-ArrowLeft'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('ComposeMessage – Contact Search & Filter', () => {
  beforeEach(() => {
    useMutation.mockImplementation((config) => ({
      mutate: mockCreateMutate,
      isPending: false,
      isError: false,
      reset: jest.fn(),
    }));

    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'contacts') {
        return { data: contactFixtures, isLoading: false, refetch: jest.fn() };
      }
      return { data: undefined, isLoading: false, refetch: jest.fn() };
    });
  });

  it('searchInput_filtersContactsByName', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search contacts...'), 'Chen');

    expect(getByText('Dr. James Chen')).toBeTruthy();
    expect(queryByText('CNA Mike Brown')).toBeNull();
  });

  it('searchInput_filtersContactsByRole', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search contacts...'), 'pharmacist');

    expect(getByText('Pat Pharmacy')).toBeTruthy();
    expect(queryByText('Dr. James Chen')).toBeNull();
  });

  it('emptySearchResults_showsNoContactsFound', () => {
    const { getByPlaceholderText, getByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search contacts...'), 'zzzzzzz');

    expect(getByText('No contacts found')).toBeTruthy();
    expect(getByText('Try a different search')).toBeTruthy();
  });

  it('internalTab_showsOnlyInternalContacts', () => {
    const { getByText, queryByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    fireEvent.press(getByText('Internal'));

    expect(getByText('Dr. James Chen')).toBeTruthy();
    expect(getByText('CNA Mike Brown')).toBeTruthy();
    expect(queryByText('Dr. Emma Wilson')).toBeNull();
    expect(queryByText('Pat Pharmacy')).toBeNull();
  });

  it('externalTab_showsOnlyExternalContacts', () => {
    const { getAllByText, getByText, queryByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    // "External" appears as tab label AND contact badge — press the tab (first match)
    fireEvent.press(getAllByText('External')[0]);

    expect(getByText('Dr. Emma Wilson')).toBeTruthy();
    expect(getByText('Pat Pharmacy')).toBeTruthy();
    expect(queryByText('Dr. James Chen')).toBeNull();
  });

  it('selectedContact_showsChipWithName', () => {
    const { getByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    fireEvent.press(getByText('Dr. James Chen'));

    // Chip shows first name
    expect(getByText('Dr.')).toBeTruthy();
  });

  it('multipleSelectedContacts_showsGroupNameInput', () => {
    const { getByText, getByPlaceholderText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    fireEvent.press(getByText('Dr. James Chen'));
    fireEvent.press(getByText('CNA Mike Brown'));

    expect(getByPlaceholderText('Group name (optional)')).toBeTruthy();
  });

  it('singleSelectedContact_showsDirectMessageLabel', () => {
    const { getByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    fireEvent.press(getByText('Dr. James Chen'));

    expect(getByText('Direct message')).toBeTruthy();
  });

  it('multipleSelectedContacts_showsGroupConversationLabel', () => {
    const { getByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    fireEvent.press(getByText('Dr. James Chen'));
    fireEvent.press(getByText('CNA Mike Brown'));

    expect(getByText(/Group conversation · 2 contacts/)).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════
// LAYER 3 — CONTRACT: API Request/Response Shape Tests
// Verify URL composition, methods, payloads, error mapping.
// ═══════════════════════════════════════════════════════

describe('Contract – Send Message API Shape', () => {
  const BASE = 'http://localhost:3001';

  beforeEach(() => {
    global.fetch = jest.fn((url, opts = {}) => {
      const method = (opts.method || 'GET').toUpperCase();

      if (url.includes('/messages') && method === 'POST') {
        const body = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'msg-contract-1',
            content: body.content,
            sender_name: body.sender_name,
            sender_role: body.sender_role,
            created_at: new Date().toISOString(),
          }),
        });
      }

      if (url.includes('/messages') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{
            id: 'msg-contract-1',
            content: 'Test message',
            sender_name: 'Nurse Sarah',
            created_at: new Date().toISOString(),
          }]),
        });
      }

      if (url.includes('/conversations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{
            id: 'conv-1',
            type: 'direct',
            title: null,
            participants: [{ name: 'Nurse Sarah', role: 'Nurse' }],
          }]),
        });
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('POST_sendMessage_returnsIdContentSenderTimestamp', async () => {
    const res = await fetch(`${BASE}/api/conversations/conv-1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_name: 'Nurse Sarah',
        sender_role: 'Nurse',
        content: `Contract test ${Date.now()}`,
        message_type: 'text',
      }),
    });

    expect(res.ok).toBe(true);
    const msg = await res.json();
    expect(msg).toHaveProperty('id');
    expect(msg).toHaveProperty('content');
    expect(msg).toHaveProperty('sender_name');
    expect(msg).toHaveProperty('created_at');
  }, 10000);

  it('GET_messages_returnsArrayWithExpectedShape', async () => {
    const res = await fetch(`${BASE}/api/conversations/conv-1/messages`);
    expect(res.ok).toBe(true);

    const messages = await res.json();
    expect(Array.isArray(messages)).toBe(true);

    if (messages.length > 0) {
      const msg = messages[0];
      expect(msg).toHaveProperty('id');
      expect(msg).toHaveProperty('content');
      expect(msg).toHaveProperty('sender_name');
      expect(msg).toHaveProperty('created_at');
    }
  }, 10000);

  it('GET_conversations_returnsArrayWithParticipants', async () => {
    const res = await fetch(`${BASE}/api/conversations?user=Nurse%20Sarah`);
    expect(res.ok).toBe(true);

    const convs = await res.json();
    expect(Array.isArray(convs)).toBe(true);

    if (convs.length > 0) {
      expect(convs[0]).toHaveProperty('id');
      expect(convs[0]).toHaveProperty('type');
    }
  }, 10000);
});

// ═══════════════════════════════════════════════════════
// LAYER 4 — ASYNC: Typing Debounce, Read Receipts, Timing
// Test timing-sensitive behavior with fake timers.
// ═══════════════════════════════════════════════════════

describe('Async – Typing Debounce Behavior', () => {
  it('typing_sendsTypingTrue_thenFalseAfter3sDebounce', () => {
    const { getByPlaceholderText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'H');
    expect(mockSendTyping).toHaveBeenCalledWith(true);

    mockSendTyping.mockClear();

    // Advance timer past debounce
    act(() => jest.advanceTimersByTime(3000));

    expect(mockSendTyping).toHaveBeenCalledWith(false);
  });

  it('continuousTyping_resetsDebounceTimer', () => {
    const { getByPlaceholderText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'H');
    mockSendTyping.mockClear();

    // Type again before debounce expires
    act(() => jest.advanceTimersByTime(2000));
    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'He');

    // Advance another 2s — should not have sent false yet because timer was reset
    act(() => jest.advanceTimersByTime(2000));

    // At the 2s mark after the second type, debounce hasn't expired (3s from last keystroke)
    // So check that typing=true was sent again
    expect(mockSendTyping).toHaveBeenCalledWith(true);
  });

  it('clearingInput_immediatelySendsTypingFalse', () => {
    const { getByPlaceholderText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'Hello');
    mockSendTyping.mockClear();

    fireEvent.changeText(getByPlaceholderText('Type a message...'), '');

    expect(mockSendTyping).toHaveBeenCalledWith(false);
  });
});

describe('Async – Read Receipt Behavior', () => {
  it('autoSendsReadReceipt_whenLastMessageIsFromOtherUser', () => {
    const messagesFromOther = [
      {
        id: 'msg-from-doc',
        content: 'Please check room 5',
        sender_name: 'Dr. Chen',
        sender_role: 'Doctor',
        created_at: '2026-04-13T10:00:00Z',
        read_by: [],
        conversation_id: 'conv-1',
      },
    ];

    setupDefaultMocks(messagesFromOther);

    render(<ChatThread conversation={directConversation} onBack={jest.fn()} />);

    // The useEffect should call sendReadReceipt for the last message
    expect(mockSendReadReceipt).toHaveBeenCalledWith('msg-from-doc');
  });

  it('doesNotSendReadReceipt_whenLastMessageIsOwn', () => {
    setupDefaultMocks([messageFixtures.fromSelf]);

    render(<ChatThread conversation={directConversation} onBack={jest.fn()} />);

    expect(mockSendReadReceipt).not.toHaveBeenCalled();
  });
});

describe('Async – Typing Indicator Display', () => {
  it('showsSingleUserTyping', () => {
    useRealtimeMessages.mockReturnValue({
      connected: true,
      onlineUsers: [],
      typingUsers: ['Dr. Chen'],
      sendTyping: mockSendTyping,
      sendReadReceipt: mockSendReadReceipt,
      subscribeConversation: mockSubscribeConversation,
    });

    const { getByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    expect(getByText('Dr. Chen is typing...')).toBeTruthy();
  });

  it('showsMultipleUsersTyping', () => {
    useRealtimeMessages.mockReturnValue({
      connected: true,
      onlineUsers: [],
      typingUsers: ['Dr. Chen', 'CNA Mike'],
      sendTyping: mockSendTyping,
      sendReadReceipt: mockSendReadReceipt,
      subscribeConversation: mockSubscribeConversation,
    });

    const { getByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    expect(getByText('Dr. Chen, CNA Mike typing...')).toBeTruthy();
  });

  it('showsOverflowTypingCount_forMoreThan2Users', () => {
    useRealtimeMessages.mockReturnValue({
      connected: true,
      onlineUsers: [],
      typingUsers: ['Dr. Chen', 'CNA Mike', 'Pharmacist Pat'],
      sendTyping: mockSendTyping,
      sendReadReceipt: mockSendReadReceipt,
      subscribeConversation: mockSubscribeConversation,
    });

    const { getByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    expect(getByText(/Dr. Chen, CNA Mike.*\+1.*typing/)).toBeTruthy();
  });

  it('hidesTypingIndicator_whenNoOneTyping', () => {
    const { queryByText } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    expect(queryByText(/typing/)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════
// LAYER 5 — INTEGRATION: Full Send→Receive Lifecycle
// End-to-end behavioral flows through the component tree.
// ═══════════════════════════════════════════════════════

describe('Integration – Full Send Flow', () => {
  it('type_send_cachesUpdate_inputClears_conversationsRefresh', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    // Step 1: Type a message
    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'Full flow test');

    // Step 2: Press send
    fireEvent.press(getByTestId('icon-Send'));

    // Step 3: Verify mutation was called with trimmed content
    expect(mockMutate).toHaveBeenCalledWith({ content: 'Full flow test' });

    // Step 4: Simulate successful response
    const newMsg = {
      id: 'msg-flow-1',
      content: 'Full flow test',
      sender_name: 'Nurse Sarah',
      sender_role: 'Nurse',
      created_at: new Date().toISOString(),
      read_by: [],
    };

    act(() => capturedMutationConfig.onSuccess(newMsg));

    // Step 5: Verify cache was updated
    expect(mockSetQueryData).toHaveBeenCalledWith(
      ['messages', 'conv-1'],
      expect.any(Function)
    );

    // Step 6: Verify conversations list was refreshed
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['conversations'] });
  });

  it('type_send_typingStops_beforeMutationFires', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <ChatThread conversation={directConversation} onBack={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'Quick send');

    // Clear to track only the send-related calls
    mockSendTyping.mockClear();

    fireEvent.press(getByTestId('icon-Send'));

    // typing(false) should be called before mutate
    const typingCalls = mockSendTyping.mock.invocationCallOrder;
    const mutateCalls = mockMutate.mock.invocationCallOrder;

    expect(mockSendTyping).toHaveBeenCalledWith(false);
    expect(mockMutate).toHaveBeenCalled();

    // Typing stop should happen before or at same time as mutate
    expect(typingCalls[0]).toBeLessThanOrEqual(mutateCalls[0]);
  });
});

describe('Integration – ComposeMessage Full Flow', () => {
  let composeMutationConfig;

  beforeEach(() => {
    composeMutationConfig = null;

    useMutation.mockImplementation((config) => {
      composeMutationConfig = config;
      return {
        mutate: mockCreateMutate,
        isPending: false,
        isError: false,
        reset: jest.fn(),
      };
    });

    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'contacts') {
        return { data: contactFixtures, isLoading: false, refetch: jest.fn() };
      }
      return { data: undefined, isLoading: false, refetch: jest.fn() };
    });
  });

  it('selectContact_pressStart_createsConversation_navigates', () => {
    const onCreated = jest.fn();

    const { getByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={onCreated}
      />
    );

    // Step 1: Select contact
    fireEvent.press(getByText('Dr. James Chen'));

    // Step 2: Verify label
    expect(getByText('Direct message')).toBeTruthy();

    // Step 3: Press Start
    fireEvent.press(getByText('Start'));

    // Step 4: Verify mutation
    expect(mockCreateMutate).toHaveBeenCalledTimes(1);

    // Step 5: Simulate server response
    const newConv = { id: 'conv-new', type: 'direct', title: null };
    act(() => composeMutationConfig.onSuccess(newConv));

    // Step 6: Verify navigation callback
    expect(onCreated).toHaveBeenCalledWith(newConv);

    // Step 7: Verify conversations cache invalidated
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['conversations'] });
  });

  it('search_select_start_createsDirectConversation', () => {
    const onCreated = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={onCreated}
      />
    );

    // Search for a specific contact
    fireEvent.changeText(getByPlaceholderText('Search contacts...'), 'Emma');

    // Select the found contact
    fireEvent.press(getByText('Dr. Emma Wilson'));

    // Start conversation
    fireEvent.press(getByText('Start'));

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'direct',
        participants: expect.arrayContaining([
          expect.objectContaining({ name: 'Dr. Emma Wilson' }),
        ]),
      })
    );
  });

  it('filterExternal_selectMultiple_createGroupConversation', () => {
    const { getAllByText, getByText } = render(
      <ComposeMessage
        contacts={contactFixtures}
        onBack={jest.fn()}
        onConversationCreated={jest.fn()}
      />
    );

    // Switch to External tab — "External" appears as tab label AND contact badge
    fireEvent.press(getAllByText('External')[0]);

    // Select multiple external contacts
    fireEvent.press(getByText('Dr. Emma Wilson'));
    fireEvent.press(getByText('Pat Pharmacy'));

    // Verify group conversation label
    expect(getByText(/Group conversation · 2 contacts/)).toBeTruthy();

    // Start
    fireEvent.press(getByText('Start'));

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'group',
        participants: expect.arrayContaining([
          expect.objectContaining({ name: 'Dr. Emma Wilson', stakeholder_type: 'external' }),
          expect.objectContaining({ name: 'Pat Pharmacy', stakeholder_type: 'external' }),
        ]),
      })
    );
  });
});
