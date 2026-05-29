import { useEffect, useState, useCallback } from 'react';
import { SyncStatus } from '../types';
import { syncService } from '../sync/SyncService';

export function useNetworkSync(): {
  syncStatus: SyncStatus;
  triggerSync: () => Promise<void>;
  isConnected: boolean;
} {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getSyncStatus());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Start listening for network changes and background fetch
    syncService.startListening().catch((err: unknown) => {
      if (__DEV__) {
        console.error('useNetworkSync: startListening failed:', err);
      }
    });

    // Poll sync status every 5 seconds to pick up background changes
    const interval = setInterval(() => {
      setSyncStatus(syncService.getSyncStatus());
    }, 5000);

    return () => {
      clearInterval(interval);
      syncService.stopListening();
    };
  }, []);

  const triggerSync = useCallback(async () => {
    try {
      const status = await syncService.triggerSync();
      setSyncStatus(status);
    } catch (error: unknown) {
      if (__DEV__) {
        console.error('useNetworkSync: triggerSync failed:', error);
      }
    }
  }, []);

  return { syncStatus, triggerSync, isConnected };
}
