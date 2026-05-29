# Database & App Configuration

> 68 nodes · cohesion 0.06

## Key Concepts

- **AttendanceLogScreen.tsx** (24 connections) — `FaceGuardOffline/src/screens/AttendanceLogScreen.tsx`
- **SettingsScreen.tsx** (24 connections) — `FaceGuardOffline/src/screens/SettingsScreen.tsx`
- **getDatabase()** (22 connections) — `FaceGuardOffline/src/db/Database.ts`
- **AttendanceRepository.ts** (22 connections) — `FaceGuardOffline/src/db/AttendanceRepository.ts`
- **SyncService.ts** (18 connections) — `FaceGuardOffline/src/sync/SyncService.ts`
- **attendanceRepository.test.ts** (15 connections) — `FaceGuardOffline/__tests__/attendanceRepository.test.ts`
- **Database.ts** (11 connections) — `FaceGuardOffline/src/db/Database.ts`
- **APP_CONFIG** (10 connections) — `FaceGuardOffline/src/constants/AppConfig.ts`
- **AttendanceRecord** (10 connections) — `FaceGuardOffline/src/types/index.ts`
- **SyncService** (9 connections) — `FaceGuardOffline/src/sync/SyncService.ts`
- **.triggerSync()** (9 connections) — `FaceGuardOffline/src/sync/SyncService.ts`
- **getPendingRecords()** (8 connections) — `FaceGuardOffline/src/db/AttendanceRepository.ts`
- **AppConfig.ts** (8 connections) — `FaceGuardOffline/src/constants/AppConfig.ts`
- **useNetworkSync.ts** (8 connections) — `FaceGuardOffline/src/hooks/useNetworkSync.ts`
- **S3Uploader.ts** (8 connections) — `FaceGuardOffline/src/sync/S3Uploader.ts`
- **SyncStatus** (7 connections) — `FaceGuardOffline/src/types/index.ts`
- **getPendingCount()** (6 connections) — `FaceGuardOffline/src/db/AttendanceRepository.ts`
- **getRecentRecords()** (6 connections) — `FaceGuardOffline/src/db/AttendanceRepository.ts`
- **purgeSynced()** (6 connections) — `FaceGuardOffline/src/db/AttendanceRepository.ts`
- **S3Uploader** (6 connections) — `FaceGuardOffline/src/sync/S3Uploader.ts`
- **getTodayCount()** (5 connections) — `FaceGuardOffline/src/db/AttendanceRepository.ts`
- **insertAttendanceRecord()** (5 connections) — `FaceGuardOffline/src/db/AttendanceRepository.ts`
- **markSynced()** (5 connections) — `FaceGuardOffline/src/db/AttendanceRepository.ts`
- **markSyncFailed()** (5 connections) — `FaceGuardOffline/src/db/AttendanceRepository.ts`
- **.getSyncStatus()** (5 connections) — `FaceGuardOffline/src/sync/SyncService.ts`
- *... and 43 more nodes in this community*

## Relationships

- [[Camera & Frame Processing]] (20 shared connections)
- [[UI Overlay & Stage Display]] (13 shared connections)
- [[Architectural Flows & Concepts]] (12 shared connections)
- [[Confidence Bar Component]] (1 shared connections)

## Source Files

- `FaceGuardOffline/__tests__/attendanceRepository.test.ts`
- `FaceGuardOffline/src/constants/AppConfig.ts`
- `FaceGuardOffline/src/db/AttendanceRepository.ts`
- `FaceGuardOffline/src/db/Database.ts`
- `FaceGuardOffline/src/db/EmployeeRepository.ts`
- `FaceGuardOffline/src/hooks/useNetworkSync.ts`
- `FaceGuardOffline/src/screens/AttendanceLogScreen.tsx`
- `FaceGuardOffline/src/screens/SettingsScreen.tsx`
- `FaceGuardOffline/src/sync/S3Uploader.ts`
- `FaceGuardOffline/src/sync/SyncService.ts`
- `FaceGuardOffline/src/types/index.ts`

## Audit Trail

- EXTRACTED: 332 (99%)
- INFERRED: 2 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*