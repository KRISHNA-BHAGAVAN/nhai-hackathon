import SQLite, { SQLiteDatabase, ResultSet } from 'react-native-sqlite-storage';
import { APP_CONFIG } from '../constants/AppConfig';

SQLite.enablePromise(true);

let dbInstance: SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabase({
    name: APP_CONFIG.DB.NAME,
    location: 'default',
  });
  await initDatabase(dbInstance);
  return dbInstance;
}

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.executeSql('PRAGMA journal_mode=WAL;');
  await db.executeSql('PRAGMA foreign_keys=ON;');

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `);

  await runMigrations(db);
}

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const [result] = await db.executeSql(
    'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;',
  );
  const currentVersion =
    result.rows.length > 0
      ? (result.rows.item(0) as { version: number }).version
      : 0;

  if (currentVersion < 1) {
    await migration_001(db);
    await db.executeSql(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?);',
      [1, Date.now()],
    );
  }
}

async function migration_001(db: SQLiteDatabase): Promise<void> {
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      employee_code TEXT UNIQUE NOT NULL,
      embedding BLOB NOT NULL,
      thumbnail_hash TEXT NOT NULL DEFAULT '',
      enrolled_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS attendance_log (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      confidence REAL NOT NULL,
      liveness_score REAL NOT NULL,
      latitude REAL,
      longitude REAL,
      synced INTEGER NOT NULL DEFAULT 0,
      sync_attempts INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(employee_id) REFERENCES employees(id)
    );
  `);

  await db.executeSql(
    'CREATE INDEX IF NOT EXISTS idx_attendance_synced ON attendance_log(synced);',
  );
  await db.executeSql(
    'CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance_log(timestamp);',
  );
  await db.executeSql(
    'CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);',
  );
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}

export type { SQLiteDatabase, ResultSet };
