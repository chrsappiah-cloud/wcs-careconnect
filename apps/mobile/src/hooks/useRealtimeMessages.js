import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

const WS_BASE = (process.env.EXPO_PUBLIC_CREATE_API_URL || 'http://localhost:3001')
  .replace(/^http/, 'ws');
const WS_URL = `${WS_BASE}/ws`;

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000];

export function useRealtimeMessages({ userName = 'Nurse Sarah', userRole = 'Nurse' } = {}) {
  const queryClient = useQueryClient();
  const wsRef = useRef(null);
  const retryRef = useRef(0);
  const reconnectTimer = useRef(null);
  const appState = useRef(AppState.currentState);

  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        retryRef.current = 0;
        // Announce presence
        ws.send(JSON.stringify({ type: 'join', name: userName, role: userRole }));
      };

      ws.onmessage = (event) => {
        let data;
        try { data = JSON.parse(event.data); } catch { return; }

        switch (data.type) {
          case 'new_message':
            // Optimistically add the new message to the cache
            queryClient.setQueryData(['messages'], (old) => {
              if (!old) return [data.message];
              // Avoid duplicates
              if (old.some((m) => m.id === data.message.id)) return old;
              return [...old, data.message];
            });
            break;

          case 'presence':
            setOnlineUsers(data.users || []);
            break;

          case 'typing': {
            const { name, isTyping } = data;
            setTypingUsers((prev) => {
              if (isTyping && !prev.includes(name)) return [...prev, name];
              if (!isTyping) return prev.filter((n) => n !== name);
              return prev;
            });
            // Auto-clear typing after 5s safety
            if (isTyping) {
              setTimeout(() => {
                setTypingUsers((prev) => prev.filter((n) => n !== name));
              }, 5000);
            }
            break;
          }

          case 'read_receipt':
            // Update read status on cached messages
            queryClient.setQueryData(['messages'], (old) => {
              if (!old) return old;
              return old.map((m) =>
                m.id === data.messageId
                  ? { ...m, read_by: [...(m.read_by || []), data.reader] }
                  : m
              );
            });
            break;
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        // onclose will fire after onerror
      };
    } catch {
      scheduleReconnect();
    }
  }, [userName, userRole, queryClient]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) return;
    const delay = RECONNECT_DELAYS[Math.min(retryRef.current, RECONNECT_DELAYS.length - 1)];
    retryRef.current += 1;
    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      connect();
    }, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const sendTyping = useCallback((isTyping) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', isTyping }));
    }
  }, []);

  const sendReadReceipt = useCallback((messageId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'read_receipt', messageId }));
    }
  }, []);

  // Connect on mount, reconnect on app foreground
  useEffect(() => {
    connect();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        connect();
      }
      if (nextState.match(/inactive|background/)) {
        disconnect();
      }
      appState.current = nextState;
    });

    return () => {
      sub.remove();
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected,
    onlineUsers,
    typingUsers,
    sendTyping,
    sendReadReceipt,
  };
}
