/**
 * Unit: Sync Manager (offline mutation queue)
 * ────────────────────────────────────────────
 * Release-blocking scenarios:
 *   - Mutations enqueued with correct shape + timestamp
 *   - Queue persisted across restarts (AsyncStorage)
 *   - Successful flush clears the queue
 *   - Failed flush retains failed mutations only
 *   - Empty flush is a no-op
 *   - Multiple concurrent enqueues don't lose items
 *   - isOnline() reflects onlineManager state
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { onlineManager } from '@tanstack/react-query';

// ─── Module setup & mocks ─────────────────────────────────

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('@tanstack/react-query', () => ({
  onlineManager: {
    setOnline: jest.fn(),
    isOnline: jest.fn(() => true),
  },
}));

// apiUrl mock — returns URL for path
jest.mock('../../services/apiClient', () => ({
  apiUrl: (path) => `http://localhost:3001${path}`,
}));

import {
  enqueueMutation,
  getQueue,
  flushQueue,
  isOnline,
  startSyncManager,
  stopSyncManager,
} from '../../services/syncManager';

const QUEUE_KEY = '@careconnect_mutation_queue';

// ─── Helpers ──────────────────────────────────────────────

function buildMutation(overrides = {}) {
  return { method: 'PATCH', path: '/api/tasks/t1', body: { status: 'complete' }, ...overrides };
}

// ─── enqueueMutation ──────────────────────────────────────

describe('enqueueMutation', () => {
  beforeEach(() => AsyncStorage.clear());

  test('adds mutation to empty queue', async () => {
    await enqueueMutation(buildMutation());
    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].path).toBe('/api/tasks/t1');
  });

  test('adds queuedAt timestamp', async () => {
    await enqueueMutation(buildMutation());
    const queue = await getQueue();
    expect(queue[0].queuedAt).toBeDefined();
    expect(() => new Date(queue[0].queuedAt)).not.toThrow();
  });

  test('multiple enqueues accumulate in order', async () => {
    await enqueueMutation(buildMutation({ path: '/api/tasks/t1' }));
    await enqueueMutation(buildMutation({ path: '/api/tasks/t2' }));
    await enqueueMutation(buildMutation({ path: '/api/tasks/t3' }));
    const queue = await getQueue();
    expect(queue).toHaveLength(3);
    expect(queue[0].path).toBe('/api/tasks/t1');
    expect(queue[2].path).toBe('/api/tasks/t3');
  });

  test('does not lose existing items when appending', async () => {
    await enqueueMutation(buildMutation({ path: '/api/existing' }));
    await enqueueMutation(buildMutation({ path: '/api/new' }));
    const queue = await getQueue();
    expect(queue.find((m) => m.path === '/api/existing')).toBeDefined();
    expect(queue.find((m) => m.path === '/api/new')).toBeDefined();
  });

  test('enqueue without body stores undefined-free object', async () => {
    await enqueueMutation({ method: 'GET', path: '/api/tasks' });
    const queue = await getQueue();
    expect(queue[0]).not.toHaveProperty('body');
  });
});

// ─── getQueue ─────────────────────────────────────────────

describe('getQueue', () => {
  beforeEach(() => AsyncStorage.clear());

  test('returns empty array when nothing queued', async () => {
    const queue = await getQueue();
    expect(queue).toEqual([]);
  });

  test('returns parsed array from AsyncStorage', async () => {
    const mutations = [buildMutation({ path: '/api/a' }), buildMutation({ path: '/api/b' })];
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(mutations));
    const queue = await getQueue();
    expect(queue).toHaveLength(2);
    expect(queue[1].path).toBe('/api/b');
  });
});

// ─── flushQueue ───────────────────────────────────────────

describe('flushQueue', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('no-op when queue is empty', async () => {
    global.fetch = jest.fn();
    await flushQueue();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('fires fetch for each queued mutation', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    await enqueueMutation(buildMutation({ path: '/api/tasks/t1' }));
    await enqueueMutation(buildMutation({ path: '/api/tasks/t2' }));
    await flushQueue();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('clears queue after successful flush', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    await enqueueMutation(buildMutation());
    await flushQueue();
    const queue = await getQueue();
    expect(queue).toHaveLength(0);
  });

  test('retains failed mutations after partial flush', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, status: 200 })   // first succeeds
      .mockResolvedValueOnce({ ok: false, status: 500 }); // second fails
    await enqueueMutation(buildMutation({ path: '/api/tasks/t1' }));
    await enqueueMutation(buildMutation({ path: '/api/tasks/t2' }));
    await flushQueue();
    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].path).toBe('/api/tasks/t2');
  });

  test('retains mutation when fetch throws network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    await enqueueMutation(buildMutation({ path: '/api/tasks/t1' }));
    await flushQueue();
    const queue = await getQueue();
    expect(queue).toHaveLength(1);
  });

  test('sends correct HTTP method and body', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    await enqueueMutation({ method: 'PATCH', path: '/api/tasks/t1', body: { status: 'complete' } });
    await flushQueue();
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/tasks/t1');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body)).toEqual({ status: 'complete' });
  });

  test('sends Content-Type header when body present', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    await enqueueMutation({ method: 'POST', path: '/api/residents', body: { name: 'Alice' } });
    await flushQueue();
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers?.['Content-Type']).toBe('application/json');
  });

  test('omits Content-Type header when no body', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    await enqueueMutation({ method: 'DELETE', path: '/api/tasks/t1' });
    await flushQueue();
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers).toBeUndefined();
  });
});

// ─── isOnline ─────────────────────────────────────────────

describe('isOnline', () => {
  test('returns onlineManager.isOnline() value (true)', () => {
    onlineManager.isOnline.mockReturnValue(true);
    expect(isOnline()).toBe(true);
  });

  test('returns onlineManager.isOnline() value (false)', () => {
    onlineManager.isOnline.mockReturnValue(false);
    expect(isOnline()).toBe(false);
  });
});

// ─── startSyncManager / stopSyncManager ──────────────────

describe('startSyncManager / stopSyncManager', () => {
  test('startSyncManager registers a NetInfo listener', () => {
    const NetInfo = require('@react-native-community/netinfo');
    startSyncManager();
    expect(NetInfo.addEventListener).toHaveBeenCalled();
  });

  test('stopSyncManager unsubscribes without throwing', () => {
    const unsubscribe = jest.fn();
    const NetInfo = require('@react-native-community/netinfo');
    NetInfo.addEventListener.mockReturnValue(unsubscribe);
    startSyncManager();
    expect(() => stopSyncManager()).not.toThrow();
    expect(unsubscribe).toHaveBeenCalled();
  });

  test('double stop does not throw', () => {
    stopSyncManager();
    expect(() => stopSyncManager()).not.toThrow();
  });
});
