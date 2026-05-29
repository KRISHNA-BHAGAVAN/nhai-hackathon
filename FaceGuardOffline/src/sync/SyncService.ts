import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import BackgroundFetch from 'react-native-background-fetch';
import { MMKV } from 'react-native-mmkv';
import { SyncStatus } from '../types';
import { APP_CONFIG } from '../constants/AppConfig';
import {
  getPendingRecords,
  markSynced,
  markSyncFailed,
  purgeSynced,
  getPendingCount,
} from '../db/AttendanceRepository';
import { S3Uploader } from './S3Uploader';

const storage = new MMKV({ id: 'sync-storage' });
const SYNC_STATUS_KEY = 'sync_status';
const DEVICE_ID_KEY = 'device_id';

function getOrCreateDeviceId(): string {
  const existing = storage.getString(DEVICE_ID_KEY);
  if (existing) return existing;
  const newId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  storage.set(DEVICE_ID_KEY, newId);
  return newId;
}

function saveSyncStatus(status: SyncStatus): void {
  storage.set(SYNC_STATUS_KEY, JSON.stringify(status));
}

function loadSyncStatus(): SyncStatus {
  const raw = storage.getString(SYNC_STATUS_KEY);
  if (!raw) {
    return { pending: 0, isSyncing: false };
  }
  try {
    return JSON.parse(raw) as SyncStatus;
  } catch {
    return { pending: 0, isSyncing: false };
  }
}

export class SyncService {
  private uploader: S3Uploader;
  private isSyncing: boolean = false;
  private netInfoUnsubscribe: (() => void) | null = null;

  constructor() {
    const deviceId = getOrCreateDeviceId();
    this.uploader = new S3Uploader(deviceId);
  }

  async startListening(): Promise<void> {
    this.netInfoUnsubscribe = NetInfo.addEventListener(
      (state: NetInfoState) => {
        if (state.isConnected === true) {
          this.triggerSync().catch((err: unknown) => {
            if (__DEV__) {
              console.error('SyncService: auto-sync failed:', err);
            }
          });
        }
      },
    );

    try {
      await BackgroundFetch.configure(
        {
          minimumFetchInterval:
            APP_CONFIG.SYNC.BACKGROUND_FETCH_INTERVAL_MINUTES,
          stopOnTerminate: false,
          startOnBoot: true,
          enableHeadless: true,
          requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
        },
        async (taskId: string) => {
          try {
            await this.triggerSync();
          } finally {
            BackgroundFetch.finish(taskId);
          }
        },
        (taskId: string) => {
          if (__DEV__) {
            console.warn('SyncService: background fetch timeout:', taskId);
          }
          BackgroundFetch.finish(taskId);
        },
      );

      await BackgroundFetch.start();
    } catch (error: unknown) {
      if (__DEV__) {
        console.warn('SyncService: background fetch setup failed:', error);
      }
    }
  }

  stopListening(): void {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
    BackgroundFetch.stop().catch(() => {});
  }

  async triggerSync(): Promise<SyncStatus> {
    if (this.isSyncing) {
      return this.getSyncStatus();
    }

    this.isSyncing = true;
    const currentStatus = this.getSyncStatus();
    saveSyncStatus({ ...currentStatus, isSyncing: true });

    try {
      const pending = await getPendingRecords(APP_CONFIG.SYNC.BATCH_SIZE);

      if (pending.length === 0) {
        const pendingCount = await getPendingCount();
        const status: SyncStatus = {
          pending: pendingCount,
          lastSyncAt: currentStatus.lastSyncAt,
          isSyncing: false,
        };
        saveSyncStatus(status);
        return status;
      }

      let uploadedIds: string[] = [];
      let lastError: string | undefined;

      try {
        uploadedIds = await this.uploader.uploadBatch(pending);
        await markSynced(uploadedIds);
        await purgeSynced();
      } catch (uploadError: unknown) {
        const failedIds = pending.map((r) => r.id);
        await markSyncFailed(failedIds);
        lastError =
          uploadError instanceof Error
            ? uploadError.message
            : String(uploadError);
        if (__DEV__) {
          console.error('SyncService: upload failed:', lastError);
        }
      }

      const pendingCount = await getPendingCount();
      const status: SyncStatus = {
        pending: pendingCount,
        lastSyncAt:
          uploadedIds.length > 0 ? Date.now() : currentStatus.lastSyncAt,
        isSyncing: false,
        lastError,
      };
      saveSyncStatus(status);
      return status;
    } catch (error: unknown) {
      const status: SyncStatus = {
        ...currentStatus,
        isSyncing: false,
        lastError:
          error instanceof Error ? error.message : String(error),
      };
      saveSyncStatus(status);
      return status;
    } finally {
      this.isSyncing = false;
    }
  }

  getSyncStatus(): SyncStatus {
    return loadSyncStatus();
  }

  async refreshPendingCount(): Promise<void> {
    const count = await getPendingCount();
    const status = this.getSyncStatus();
    saveSyncStatus({ ...status, pending: count });
  }
}

export const syncService = new SyncService();
