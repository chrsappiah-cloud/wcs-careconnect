// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

const WS_BASE = (process.env.EXPO_PUBLIC_CREATE_API_URL || 'http://localhost:3001')
  .replace(/^http/, 'ws');
const WS_URL = `${WS_BASE}/ws`;

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000];

export function useRealtimeMessages({ userName = 'Nurse Sarah', userRole = 'Nurse', conversationId = null } = {}) {
  const queryClient = useQueryClient();
  const wsRef = useRef(null);
  const retryRef = useRef(0);
  const reconnectTimer = useRef(null);
  const appState = useRef(AppState.currentState);
  const conversationIdRef = useRef(conversationId);

  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  // Keep ref in sync
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

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
        // Subscribe to conversation if one is active
        if (conversationIdRef.current) {
          ws.send(JSON.stringify({ type: 'subscribe_conversation', conversationId: conversationIdRef.current }));
        }
      };

      ws.onmessage = (event) => {
        let data;
        try { data = JSON.parse(event.data); } catch { return; }

        switch (data.type) {
          case 'new_message': {
            const msg = data.message;
            const convId = data.conversationId || msg?.conversation_id;

            // Update the specific conversation's message cache
            if (convId) {
              queryClient.setQueryData(['messages', convId], (old) => {
                if (!old) return [msg];
                if (old.some((m) => m.id === msg.id)) return old;
                return [...old, msg];
              });
              // Refresh conversations list to update last_message_preview
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }

            // Also update the legacy global messages cache
            queryClient.setQueryData(['messages'], (old) => {
              if (!old) return [msg];
              if (old.some((m) => m.id === msg.id)) return old;
              return [...old, msg];
            });
            break;
          }

          case 'presence':
            setOnlineUsers(data.users || []);
            break;

          case 'typing': {
            const { name, isTyping, conversationId: typingConvId } = data;
            // Only show typing for current conversation or global
            if (typingConvId && conversationIdRef.current && typingConvId !== conversationIdRef.current) {
              break;
            }
            setTypingUsers((prev) => {
              if (isTyping && !prev.includes(name)) return [...prev, name];
              if (!isTyping) return prev.filter((n) => n !== name);
              return prev;
            });
            if (isTyping) {
              setTimeout(() => {
                setTypingUsers((prev) => prev.filter((n) => n !== name));
              }, 5000);
            }
            break;
          }

          case 'read_receipt': {
            const readConvId = data.conversationId;
            if (readConvId) {
              queryClient.setQueryData(['messages', readConvId], (old) => {
                if (!old) return old;
                return old.map((m) =>
                  m.id === data.messageId
                    ? { ...m, read_by: [...(m.read_by || []), data.reader] }
                    : m
                );
              });
            }
            // Also update legacy cache
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

          case 'conversation_created':
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
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
      // Unsubscribe from conversation before closing
      if (conversationIdRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'unsubscribe_conversation', conversationId: conversationIdRef.current }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const sendTyping = useCallback((isTyping) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        isTyping,
        conversationId: conversationIdRef.current,
      }));
    }
  }, []);

  const sendReadReceipt = useCallback((messageId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'read_receipt',
        messageId,
        conversationId: conversationIdRef.current,
      }));
    }
  }, []);

  const subscribeConversation = useCallback((convId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && convId) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe_conversation', conversationId: convId }));
    }
  }, []);

  // Subscribe to conversation when it changes
  useEffect(() => {
    if (conversationId && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe_conversation', conversationId }));
    }
    return () => {
      if (conversationId && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'unsubscribe_conversation', conversationId }));
      }
    };
  }, [conversationId]);

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
    subscribeConversation,
  };
}
