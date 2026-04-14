// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onlineManager } from '@tanstack/react-query';
import { apiUrl } from './apiClient';

// ──────────────────────────────────────────────
// Sync Manager — offline queue + auto-sync
// ──────────────────────────────────────────────
// Queues mutations when offline and replays them
// when the device reconnects. Uses NetInfo to
// monitor connectivity and AsyncStorage to persist
// the queue (→ iCloud backup on iOS).
// ──────────────────────────────────────────────

const QUEUE_KEY = '@careconnect_mutation_queue';
let unsubscribe = null;

/**
 * Start listening for connectivity changes.
 * Wires React Query's onlineManager so queries pause when offline.
 */
export function startSyncManager() {
  // Wire React Query online state to NetInfo
  unsubscribe = NetInfo.addEventListener((state) => {
    const isOnline = state.isConnected && state.isInternetReachable !== false;
    onlineManager.setOnline(isOnline);

    if (isOnline) {
      flushQueue();
    }
  });
}

/**
 * Stop listening for connectivity changes.
 */
export function stopSyncManager() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

/**
 * Enqueue a mutation to be retried when online.
 * @param {{ method: string, path: string, body?: object }} mutation
 */
export async function enqueueMutation(mutation) {
  const queue = await getQueue();
  queue.push({ ...mutation, queuedAt: new Date().toISOString() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Get the current offline mutation queue.
 */
export async function getQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Replay all queued mutations sequentially, then clear the queue.
 */
export async function flushQueue() {
  const queue = await getQueue();
  if (!queue.length) return;

  const failed = [];

  for (const mutation of queue) {
    try {
      const res = await fetch(apiUrl(mutation.path), {
        method: mutation.method,
        headers: mutation.body ? { 'Content-Type': 'application/json' } : undefined,
        body: mutation.body ? JSON.stringify(mutation.body) : undefined,
      });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      failed.push(mutation);
    }
  }

  // Keep only the ones that still failed
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
}

/**
 * Get the current online/offline status.
 */
export function isOnline() {
  return onlineManager.isOnline();
}
