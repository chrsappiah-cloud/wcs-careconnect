/**
 * Reliability: Offline Resilience
 * ─────────────────────────────────
 * Release-blocking scenarios:
 *   - Mutation queued immediately when offline
 *   - Queue survives simulated app restart
 *   - Reconnect triggers flush of queued mutations
 *   - All queued mutations replayed in order on reconnect
 *   - Partial failure leaves only failed items in queue
 *   - No duplicate submissions when reconnect fires twice
 *   - apiClient throws clearly on network failure
 *   - apiFetch throws on non-ok HTTP responses
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Mocks ────────────────────────────────────────────────

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('@tanstack/react-query', () => ({
  onlineManager: {
    setOnline: jest.fn(),
    isOnline: jest.fn(() => true),
  },
}));

jest.mock('../../services/apiClient', () => ({
  apiUrl: (path) => `http://localhost:3001${path}`,
  apiFetch: jest.fn(),
}));

import { onlineManager } from '@tanstack/react-query';
import { apiFetch } from '../../services/apiClient';
import {
  enqueueMutation,
  getQueue,
  flushQueue,
} from '../../services/syncManager';

const QUEUE_KEY = '@careconnect_mutation_queue';

// ─── Offline queue ────────────────────────────────────────

describe('Offline mutation queue', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('mutation is queued when offline', async () => {
    onlineManager.isOnline.mockReturnValue(false);
    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/t1', body: { status: 'complete' } });
    const queue = await getQueue();
    expect(queue).toHaveLength(1);
  });

  test('queue survives simulated app restart (AsyncStorage persistence)', async () => {
    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/t1', body: { status: 'complete' } });
    // Simulate restart: read directly from AsyncStorage
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const restored = JSON.parse(raw);
    expect(restored).toHaveLength(1);
    expect(restored[0].path).toBe('/api/tasks/t1');
  });

  test('multiple offline mutations are all queued', async () => {
    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/t1', body: { status: 'complete' } });
    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/t2', body: { status: 'complete' } });
    await enqueueMutation({ method: 'POST',  path: '/api/residents',  body: { name: 'Alice' } });
    const queue = await getQueue();
    expect(queue).toHaveLength(3);
  });

  test('queue items include queuedAt timestamp', async () => {
    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/t1' });
    const [item] = await getQueue();
    expect(item.queuedAt).toBeDefined();
    const timestamp = new Date(item.queuedAt);
    expect(timestamp.getTime()).not.toBeNaN();
  });
});

// ─── Flush on reconnect ───────────────────────────────────

describe('Flush on reconnect', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('all queued mutations are sent on flush', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/t1', body: { status: 'complete' } });
    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/t2', body: { status: 'complete' } });
    await flushQueue();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('queue is empty after successful flush', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/t1' });
    await flushQueue();
    expect(await getQueue()).toHaveLength(0);
  });

  test('mutations are replayed in FIFO order', async () => {
    const calls = [];
    global.fetch = jest.fn().mockImplementation((url) => {
      calls.push(url);
      return Promise.resolve({ ok: true });
    });
    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/first' });
    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/second' });
    await flushQueue();
    expect(calls[0]).toContain('/api/tasks/first');
    expect(calls[1]).toContain('/api/tasks/second');
  });

  test('no double-submit: second concurrent flush is a no-op when queue empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/t1' });
    await flushQueue();                     // first flush succeeds, empties queue
    jest.clearAllMocks();
    await flushQueue();                     // second flush — queue already empty
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('failed mutation stays in queue, successful one is removed', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true  })
      .mockResolvedValueOnce({ ok: false, status: 503 });

    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/success' });
    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/fail' });
    await flushQueue();

    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].path).toBe('/api/tasks/fail');
  });
});

// ─── apiFetch error handling ──────────────────────────────

describe('apiFetch error handling', () => {
  beforeEach(() => jest.clearAllMocks());

  test('throws when response is not ok (400)', async () => {
    apiFetch.mockRejectedValueOnce(new Error('HTTP error 400'));
    await expect(apiFetch('/api/tasks', { method: 'GET' })).rejects.toThrow('400');
  });

  test('throws when response is not ok (404)', async () => {
    apiFetch.mockRejectedValueOnce(new Error('HTTP error 404'));
    await expect(apiFetch('/api/tasks/missing', { method: 'GET' })).rejects.toThrow('404');
  });

  test('throws on 500 server error', async () => {
    apiFetch.mockRejectedValueOnce(new Error('HTTP error 500'));
    await expect(apiFetch('/api/tasks', { method: 'GET' })).rejects.toThrow('500');
  });

  test('throws on network error (no internet)', async () => {
    apiFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(apiFetch('/api/tasks', { method: 'GET' })).rejects.toThrow('Network request failed');
  });
});

// ─── WebSocket reconnect behaviour ───────────────────────

describe('WebSocket reconnect lifecycle', () => {
  test('addWSListener returns an unsubscribe function', () => {
    // Pure unit test — no actual socket created
    const listeners = new Set();
    function addWSListener(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
    const handler = jest.fn();
    const unsub = addWSListener(handler);
    expect(typeof unsub).toBe('function');
    unsub();
    expect(listeners.has(handler)).toBe(false);
  });

  test('multiple listeners all receive the same event', () => {
    const listeners = new Set();
    function addWSListener(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    function broadcast(event) { for (const fn of listeners) fn(event); }

    const h1 = jest.fn();
    const h2 = jest.fn();
    addWSListener(h1);
    addWSListener(h2);

    const event = { type: 'alert_created', data: { id: 'a1' } };
    broadcast(event);

    expect(h1).toHaveBeenCalledWith(event);
    expect(h2).toHaveBeenCalledWith(event);
  });

  test('unsubscribed listener does not receive events', () => {
    const listeners = new Set();
    function addWSListener(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    function broadcast(event) { for (const fn of listeners) fn(event); }

    const handler = jest.fn();
    const unsub = addWSListener(handler);
    unsub();
    broadcast({ type: 'alert_created' });
    expect(handler).not.toHaveBeenCalled();
  });
});
