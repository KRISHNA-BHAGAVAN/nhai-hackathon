import {
  insertAttendanceRecord,
  getPendingRecords,
  markSynced,
  markSyncFailed,
  purgeSynced,
  getTodayCount,
  getRecentRecords,
} from '../src/db/AttendanceRepository';
import { AttendanceRecord } from '../src/types';

// Mock the database
const mockExecuteSql = jest.fn();
const mockDb = { executeSql: mockExecuteSql };

jest.mock('../src/db/Database', () => ({
  getDatabase: jest.fn(() => Promise.resolve(mockDb)),
  APP_CONFIG: { DB: { NAME: 'test.db' } },
}));

jest.mock('../src/constants/AppConfig', () => ({
  APP_CONFIG: {
    SYNC: { PURGE_AFTER_MS: 86400000, BATCH_SIZE: 100 },
  },
}));

function makeRecord(overrides: Partial<AttendanceRecord> = {}): AttendanceRecord {
  return {
    id: 'test-id-1',
    employeeId: 'emp-1',
    employeeName: 'Test User',
    timestamp: Date.now() - 1000,
    confidence: 0.92,
    livenessScore: 0.95,
    latitude: 28.6139,
    longitude: 77.2090,
    synced: false,
    syncAttempts: 0,
    ...overrides,
  };
}

beforeEach(() => {
  mockExecuteSql.mockReset();
});

describe('insertAttendanceRecord', () => {
  it('calls executeSql with correct values', async () => {
    mockExecuteSql.mockResolvedValueOnce([{ rows: { length: 0 } }]);
    const record = makeRecord();
    await insertAttendanceRecord(record);
    expect(mockExecuteSql).toHaveBeenCalledTimes(1);
    const [sql, params] = mockExecuteSql.mock.calls[0];
    expect(sql).toContain('INSERT INTO attendance_log');
    expect(params).toContain(record.id);
    expect(params).toContain(record.employeeId);
    expect(params).toContain(record.timestamp);
  });

  it('stores latitude and longitude when provided', async () => {
    mockExecuteSql.mockResolvedValueOnce([{ rows: { length: 0 } }]);
    const record = makeRecord({ latitude: 28.6139, longitude: 77.2090 });
    await insertAttendanceRecord(record);
    const [, params] = mockExecuteSql.mock.calls[0];
    expect(params).toContain(28.6139);
    expect(params).toContain(77.2090);
  });

  it('stores null for missing latitude/longitude', async () => {
    mockExecuteSql.mockResolvedValueOnce([{ rows: { length: 0 } }]);
    const record = makeRecord({ latitude: undefined, longitude: undefined });
    await insertAttendanceRecord(record);
    const [, params] = mockExecuteSql.mock.calls[0];
    expect(params).toContain(null);
  });
});

describe('getPendingRecords', () => {
  it('returns only unsynced records', async () => {
    const mockRow = {
      id: 'test-1',
      employee_id: 'emp-1',
      employee_name: 'Test User',
      timestamp: Date.now(),
      confidence: 0.9,
      liveness_score: 0.95,
      latitude: null,
      longitude: null,
      synced: 0,
      sync_attempts: 0,
      created_at: Date.now(),
    };
    mockExecuteSql.mockResolvedValueOnce([{
      rows: {
        length: 1,
        item: (_i: number) => mockRow,
      },
    }]);
    const records = await getPendingRecords();
    expect(records).toHaveLength(1);
    expect(records[0].synced).toBe(false);
    const [sql] = mockExecuteSql.mock.calls[0];
    expect(sql).toContain('WHERE synced = 0');
  });

  it('uses default limit of 100', async () => {
    mockExecuteSql.mockResolvedValueOnce([{ rows: { length: 0 } }]);
    await getPendingRecords();
    const [sql, params] = mockExecuteSql.mock.calls[0];
    expect(sql).toContain('LIMIT ?');
    expect(params).toContain(100);
  });
});

describe('markSynced', () => {
  it('updates synced flag and increments sync_attempts', async () => {
    mockExecuteSql.mockResolvedValueOnce([{ rows: { length: 0 } }]);
    await markSynced(['id-1', 'id-2']);
    const [sql] = mockExecuteSql.mock.calls[0];
    expect(sql).toContain('synced = 1');
    expect(sql).toContain('sync_attempts = sync_attempts + 1');
  });

  it('is a no-op for empty array', async () => {
    await markSynced([]);
    expect(mockExecuteSql).not.toHaveBeenCalled();
  });
});

describe('markSyncFailed', () => {
  it('increments sync_attempts without setting synced', async () => {
    mockExecuteSql.mockResolvedValueOnce([{ rows: { length: 0 } }]);
    await markSyncFailed(['id-1']);
    const [sql] = mockExecuteSql.mock.calls[0];
    expect(sql).toContain('sync_attempts = sync_attempts + 1');
    expect(sql).not.toContain('synced = 1');
  });

  it('is a no-op for empty array', async () => {
    await markSyncFailed([]);
    expect(mockExecuteSql).not.toHaveBeenCalled();
  });
});

describe('purgeSynced', () => {
  it('deletes synced records older than cutoff', async () => {
    mockExecuteSql
      .mockResolvedValueOnce([{ rows: { length: 1, item: () => ({ cnt: 5 }) } }])
      .mockResolvedValueOnce([{ rows: { length: 0 } }]);
    const count = await purgeSynced();
    expect(count).toBe(5);
    const [selectSql] = mockExecuteSql.mock.calls[0];
    const [deleteSql] = mockExecuteSql.mock.calls[1];
    expect(selectSql).toContain('WHERE synced = 1 AND timestamp < ?');
    expect(deleteSql).toContain('DELETE FROM attendance_log WHERE synced = 1 AND timestamp < ?');
  });
});

describe('getTodayCount', () => {
  it('returns the count of today records', async () => {
    mockExecuteSql.mockResolvedValueOnce([{
      rows: { length: 1, item: () => ({ cnt: 7 }) },
    }]);
    const count = await getTodayCount();
    expect(count).toBe(7);
    const [sql] = mockExecuteSql.mock.calls[0];
    expect(sql).toContain('SELECT COUNT(*) as cnt FROM attendance_log WHERE timestamp >=');
  });
});

describe('getRecentRecords', () => {
  it('returns records ordered by timestamp DESC', async () => {
    const mockRow = {
      id: 'rec-1',
      employee_id: 'emp-2',
      employee_name: 'Alice',
      timestamp: Date.now(),
      confidence: 0.88,
      liveness_score: 0.91,
      latitude: null,
      longitude: null,
      synced: 1,
      sync_attempts: 1,
      created_at: Date.now(),
    };
    mockExecuteSql.mockResolvedValueOnce([{
      rows: { length: 1, item: () => mockRow },
    }]);
    const records = await getRecentRecords(5);
    expect(records).toHaveLength(1);
    expect(records[0].synced).toBe(true);
    const [sql, params] = mockExecuteSql.mock.calls[0];
    expect(sql).toContain('ORDER BY timestamp DESC LIMIT ?');
    expect(params).toContain(5);
  });
});
