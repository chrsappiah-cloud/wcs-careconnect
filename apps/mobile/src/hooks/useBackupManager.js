import { useEffect, useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { createBackup, getBackupMeta } from '../services/iCloudBackup';
import { isOnline } from '../services/syncManager';

const AUTO_BACKUP_INTERVAL = 1000 * 60 * 15; // 15 minutes

/**
 * Hook that manages automatic iCloud-backed backups.
 * Triggers a backup when the app moves to the background and on a timer.
 */
export function useBackupManager() {
  const [lastBackup, setLastBackup] = useState(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const intervalRef = useRef(null);

  const runBackup = useCallback(async () => {
    if (!isOnline() || isBackingUp) return null;
    setIsBackingUp(true);
    try {
      const meta = await createBackup();
      setLastBackup(meta);
      return meta;
    } catch {
      return null;
    } finally {
      setIsBackingUp(false);
    }
  }, [isBackingUp]);

  // Load last backup metadata on mount
  useEffect(() => {
    getBackupMeta().then(setLastBackup);
  }, []);

  // Auto-backup when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        runBackup();
      }
    });
    return () => sub.remove();
  }, [runBackup]);

  // Periodic auto-backup
  useEffect(() => {
    intervalRef.current = setInterval(runBackup, AUTO_BACKUP_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [runBackup]);

  return { lastBackup, isBackingUp, runBackup };
}
