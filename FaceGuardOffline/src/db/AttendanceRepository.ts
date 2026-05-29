import { AttendanceRecord } from '../types';
import { getDatabase } from './Database';
import { APP_CONFIG } from '../constants/AppConfig';

function rowToRecord(row: {
  id: string;
  employee_id: string;
  employee_name: string;
  timestamp: number;
  confidence: number;
  liveness_score: number;
  latitude: number | null;
  longitude: number | null;
  synced: number;
  sync_attempts: number;
  created_at: number;
}): AttendanceRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    timestamp: row.timestamp,
    confidence: row.confidence,
    livenessScore: row.liveness_score,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    synced: row.synced === 1,
    syncAttempts: row.sync_attempts,
  };
}

export async function insertAttendanceRecord(
  record: AttendanceRecord,
): Promise<void> {
  const db = await getDatabase();
  await db.executeSql(
    `INSERT INTO attendance_log
       (id, employee_id, employee_name, timestamp, confidence, liveness_score,
        latitude, longitude, synced, sync_attempts, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      record.id,
      record.employeeId,
      record.employeeName,
      record.timestamp,
      record.confidence,
      record.livenessScore,
      record.latitude ?? null,
      record.longitude ?? null,
      record.synced ? 1 : 0,
      record.syncAttempts,
      Date.now(),
    ],
  );
}

export async function getPendingRecords(
  limit: number = 100,
): Promise<AttendanceRecord[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM attendance_log WHERE synced = 0 ORDER BY timestamp ASC LIMIT ?;',
    [limit],
  );
  const records: AttendanceRecord[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    records.push(rowToRecord(result.rows.item(i)));
  }
  return records;
}

export async function markSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(', ');
  await db.executeSql(
    `UPDATE attendance_log SET synced = 1, sync_attempts = sync_attempts + 1
     WHERE id IN (${placeholders});`,
    ids,
  );
}

export async function markSyncFailed(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(', ');
  await db.executeSql(
    `UPDATE attendance_log SET sync_attempts = sync_attempts + 1
     WHERE id IN (${placeholders});`,
    ids,
  );
}

export async function purgeSynced(
  olderThanMs: number = APP_CONFIG.SYNC.PURGE_AFTER_MS,
): Promise<number> {
  const db = await getDatabase();
  const cutoff = Date.now() - olderThanMs;
  const [countResult] = await db.executeSql(
    'SELECT COUNT(*) as cnt FROM attendance_log WHERE synced = 1 AND timestamp < ?;',
    [cutoff],
  );
  const count = (countResult.rows.item(0) as { cnt: number }).cnt;
  await db.executeSql(
    'DELETE FROM attendance_log WHERE synced = 1 AND timestamp < ?;',
    [cutoff],
  );
  return count;
}

export async function getTodayCount(): Promise<number> {
  const db = await getDatabase();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [result] = await db.executeSql(
    'SELECT COUNT(*) as cnt FROM attendance_log WHERE timestamp >= ?;',
    [startOfDay.getTime()],
  );
  return (result.rows.item(0) as { cnt: number }).cnt;
}

export async function getRecentRecords(
  limit: number,
): Promise<AttendanceRecord[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM attendance_log ORDER BY timestamp DESC LIMIT ?;',
    [limit],
  );
  const records: AttendanceRecord[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    records.push(rowToRecord(result.rows.item(i)));
  }
  return records;
}

export async function getPendingCount(): Promise<number> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT COUNT(*) as cnt FROM attendance_log WHERE synced = 0;',
  );
  return (result.rows.item(0) as { cnt: number }).cnt;
}

export async function getTodayRecords(): Promise<AttendanceRecord[]> {
  const db = await getDatabase();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [result] = await db.executeSql(
    'SELECT * FROM attendance_log WHERE timestamp >= ? ORDER BY timestamp DESC;',
    [startOfDay.getTime()],
  );
  const records: AttendanceRecord[] = [];
  for (let i = 0; i < result.rows.length; i++) {
    records.push(rowToRecord(result.rows.item(i)));
  }
  return records;
}
