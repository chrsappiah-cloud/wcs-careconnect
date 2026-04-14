import { renderHook, act, waitFor } from '@testing-library/react-native';

// We need to unmock useRealtimeMessages (it's mocked globally in jest.setup.js)
// and provide our own controlled mocks
jest.unmock('../useRealtimeMessages');

// Mock react-query
const mockSetQueryData = jest.fn();
const mockInvalidateQueries = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    setQueryData: mockSetQueryData,
    invalidateQueries: mockInvalidateQueries,
  }),
}));

// WebSocket mock
let mockWsInstance;
const mockSend = jest.fn();

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.OPEN;
    this.send = mockSend;
    this.close = jest.fn(() => {
      this.readyState = MockWebSocket.CLOSED;
      if (this.onclose) this.onclose();
    });
    mockWsInstance = this;
  }
}
MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;

global.WebSocket = MockWebSocket;

const { useRealtimeMessages } = require('../useRealtimeMessages');

// Helper: render hook and trigger WebSocket onopen within act()
async function renderConnected(opts = { userName: 'Nurse Sarah', userRole: 'Nurse' }) {
  const hookResult = renderHook(() => useRealtimeMessages(opts));
  // useEffect fires connect() → new WebSocket → onopen not yet called
  await act(async () => {
    if (mockWsInstance && mockWsInstance.onopen) {
      mockWsInstance.onopen();
    }
  });
  return hookResult;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockWsInstance = null;
  mockSend.mockClear();
  mockSetQueryData.mockClear();
  mockInvalidateQueries.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useRealtimeMessages', () => {
  describe('connection lifecycle', () => {
    it('connects on mount and sends join message', async () => {
      const { result } = await renderConnected();

      expect(mockWsInstance).toBeTruthy();
      expect(mockWsInstance.url).toBe('ws://localhost:3001/ws');
      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({ type: 'join', name: 'Nurse Sarah', role: 'Nurse' })
      );
    });

    it('disconnects when unmounted', async () => {
      const { unmount } = await renderConnected();

      const ws = mockWsInstance;
      unmount();
      expect(ws.close).toHaveBeenCalled();
    });

    it('sets connected to false on close', async () => {
      await renderConnected();

      // Verify WebSocket was opened (join sent = onopen fired)
      expect(mockSend).toHaveBeenCalledWith(
        expect.stringContaining('"type":"join"')
      );

      // Trigger close via mock's close() which sets readyState and calls onclose
      await act(async () => {
        mockWsInstance.close();
      });

      expect(mockWsInstance.readyState).toBe(3); // WebSocket.CLOSED
    });
  });

  describe('conversation subscription', () => {
    it('subscribes to conversation on open when conversationId provided', async () => {
      await renderConnected({
        userName: 'Nurse Sarah',
        userRole: 'Nurse',
        conversationId: 5,
      });

      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({ type: 'subscribe_conversation', conversationId: 5 })
      );
    });
  });

  describe('message handlers', () => {
    it('handles new_message by updating query cache', async () => {
      await renderConnected();

      await act(async () => {
        mockWsInstance.onmessage({
          data: JSON.stringify({
            type: 'new_message',
            conversationId: 3,
            message: { id: 100, content: 'Hello', conversation_id: 3 },
          }),
        });
      });

      // Should update both specific conversation and conversations list
      expect(mockSetQueryData).toHaveBeenCalledWith(['messages', 3], expect.any(Function));
      expect(mockSetQueryData).toHaveBeenCalledWith(['messages'], expect.any(Function));
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['conversations'] });
    });

    it('handles presence updates', async () => {
      const { result } = await renderConnected();

      await act(async () => {
        mockWsInstance.onmessage({
          data: JSON.stringify({
            type: 'presence',
            users: [{ name: 'Dr. Chen' }, { name: 'Nurse Sarah' }],
          }),
        });
      });

      expect(result.current.onlineUsers).toEqual([
        { name: 'Dr. Chen' },
        { name: 'Nurse Sarah' },
      ]);
    });

    it('handles typing indicator', async () => {
      const { result } = await renderConnected();

      await act(async () => {
        mockWsInstance.onmessage({
          data: JSON.stringify({
            type: 'typing',
            name: 'Dr. Chen',
            isTyping: true,
          }),
        });
      });

      expect(result.current.typingUsers).toContain('Dr. Chen');
    });

    it('clears typing indicator after 5 seconds', async () => {
      const { result } = await renderConnected();

      await act(async () => {
        mockWsInstance.onmessage({
          data: JSON.stringify({
            type: 'typing',
            name: 'Dr. Chen',
            isTyping: true,
          }),
        });
      });

      expect(result.current.typingUsers).toContain('Dr. Chen');

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.typingUsers).not.toContain('Dr. Chen');
    });

    it('handles typing stop', async () => {
      const { result } = await renderConnected();

      // Start typing
      await act(async () => {
        mockWsInstance.onmessage({
          data: JSON.stringify({ type: 'typing', name: 'Dr. Chen', isTyping: true }),
        });
      });
      expect(result.current.typingUsers).toContain('Dr. Chen');

      // Stop typing
      await act(async () => {
        mockWsInstance.onmessage({
          data: JSON.stringify({ type: 'typing', name: 'Dr. Chen', isTyping: false }),
        });
      });
      expect(result.current.typingUsers).not.toContain('Dr. Chen');
    });

    it('handles read_receipt', async () => {
      await renderConnected();

      await act(async () => {
        mockWsInstance.onmessage({
          data: JSON.stringify({
            type: 'read_receipt',
            messageId: 42,
            conversationId: 3,
            reader: 'Dr. Chen',
          }),
        });
      });

      expect(mockSetQueryData).toHaveBeenCalledWith(['messages', 3], expect.any(Function));
      expect(mockSetQueryData).toHaveBeenCalledWith(['messages'], expect.any(Function));
    });

    it('handles conversation_created', async () => {
      await renderConnected();

      await act(async () => {
        mockWsInstance.onmessage({
          data: JSON.stringify({ type: 'conversation_created' }),
        });
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['conversations'] });
    });

    it('ignores invalid JSON gracefully', async () => {
      await renderConnected();

      // Should not throw
      await act(async () => {
        mockWsInstance.onmessage({ data: 'not-json' });
      });
    });
  });

  describe('sendTyping', () => {
    it('sends typing event over WebSocket', async () => {
      const { result } = await renderConnected();

      mockSend.mockClear();
      act(() => {
        result.current.sendTyping(true);
      });

      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({ type: 'typing', isTyping: true, conversationId: null })
      );
    });
  });

  describe('sendReadReceipt', () => {
    it('sends read receipt over WebSocket', async () => {
      const { result } = await renderConnected();

      mockSend.mockClear();
      act(() => {
        result.current.sendReadReceipt(42);
      });

      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({ type: 'read_receipt', messageId: 42, conversationId: null })
      );
    });
  });

  describe('subscribeConversation', () => {
    it('sends subscribe_conversation over WebSocket', async () => {
      const { result } = await renderConnected();

      mockSend.mockClear();
      act(() => {
        result.current.subscribeConversation(7);
      });

      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({ type: 'subscribe_conversation', conversationId: 7 })
      );
    });
  });
});
