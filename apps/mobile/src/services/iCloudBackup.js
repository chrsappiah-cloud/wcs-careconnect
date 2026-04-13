import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from './apiClient';

// ──────────────────────────────────────────────
// iCloud Backup Service
// ──────────────────────────────────────────────
// On iOS, AsyncStorage is stored in the app sandbox which is
// automatically backed up to iCloud. By persisting data here,
// it survives app reinstalls and device transfers via iCloud.
// ──────────────────────────────────────────────

const BACKUP_PREFIX = '@careconnect_backup_';
const BACKUP_META_KEY = '@careconnect_backup_meta';

const TABLES = ['residents', 'alerts', 'tasks', 'contacts', 'conversations', 'conversation_participants', 'messages', 'readings'];

/**
 * Fetch all data from the backend and save a snapshot to AsyncStorage (→ iCloud).
 */
export async function createBackup() {
  const snapshot = {};
  const errors = [];

  for (const table of TABLES) {
    try {
      const res = await fetch(apiUrl(`/api/${table}`));
      if (!res.ok) throw new Error(`${table}: ${res.status}`);
      snapshot[table] = await res.json();
    } catch (err) {
      errors.push({ table, error: err.message });
    }
  }

  // Persist each table separately (better for large datasets)
  const pairs = TABLES.filter((t) => snapshot[t]).map((t) => [
    `${BACKUP_PREFIX}${t}`,
    JSON.stringify(snapshot[t]),
  ]);

  await AsyncStorage.multiSet(pairs);

  // Save metadata
  const meta = {
    createdAt: new Date().toISOString(),
    tables: TABLES.reduce((acc, t) => {
      acc[t] = snapshot[t] ? snapshot[t].length : 0;
      return acc;
    }, {}),
    errors: errors.length ? errors : undefined,
  };
  await AsyncStorage.setItem(BACKUP_META_KEY, JSON.stringify(meta));

  return meta;
}

/**
 * Restore data from the local iCloud-backed AsyncStorage cache.
 * Returns the cached snapshot (doesn't push to server — use restoreToServer for that).
 */
export async function getLocalBackup() {
  const keys = TABLES.map((t) => `${BACKUP_PREFIX}${t}`);
  const pairs = await AsyncStorage.multiGet(keys);

  const snapshot = {};
  for (const [key, value] of pairs) {
    const table = key.replace(BACKUP_PREFIX, '');
    snapshot[table] = value ? JSON.parse(value) : [];
  }
  return snapshot;
}

/**
 * Push a locally-cached backup to the server's restore endpoint.
 */
export async function restoreToServer() {
  const snapshot = await getLocalBackup();

  const res = await fetch(apiUrl('/api/backup/restore'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Restore failed' }));
    throw new Error(err.error || 'Restore failed');
  }

  return res.json();
}

/**
 * Get metadata about the most recent backup.
 */
export async function getBackupMeta() {
  const raw = await AsyncStorage.getItem(BACKUP_META_KEY);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Delete the local iCloud-backed cache.
 */
export async function clearBackup() {
  const keys = [BACKUP_META_KEY, ...TABLES.map((t) => `${BACKUP_PREFIX}${t}`)];
  await AsyncStorage.multiRemove(keys);
}
