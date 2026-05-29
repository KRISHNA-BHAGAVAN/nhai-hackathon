# Android Build Configuration

> 24 nodes · cohesion 0.11

## Key Concepts

- **jest.setup.js (mocks: sqlite, mmkv, tflite, vision-camera)** (7 connections) — `FaceGuardOffline/jest.setup.js`
- **package.json (RN 0.74.5, key deps)** (7 connections) — `FaceGuardOffline/package.json`
- **android/app/build.gradle (TFLite 2.14.0, aaptOptions, packagingOptions)** (5 connections) — `FaceGuardOffline/android/app/build.gradle`
- **SyncService.triggerSync** (5 connections) — `FaceGuardOffline/src/sync/SyncService.ts`
- **react-native-fast-tflite@1.3.0** (3 connections) — `FaceGuardOffline/package.json`
- **react-native-mmkv@2.12.2** (3 connections) — `FaceGuardOffline/package.json`
- **S3Uploader.uploadBatch (exponential backoff)** (3 connections) — `FaceGuardOffline/src/sync/S3Uploader.ts`
- **SyncService.startListening (NetInfo + BackgroundFetch triggers)** (3 connections) — `FaceGuardOffline/src/sync/SyncService.ts`
- **aaptOptions noCompress (.tflite/.task/.bin)** (2 connections) — `FaceGuardOffline/android/app/build.gradle`
- **TFLite 2.14.0 + GPU + Support deps** (2 connections) — `FaceGuardOffline/android/app/build.gradle`
- **aws-sdk@2.1692.0** (2 connections) — `FaceGuardOffline/package.json`
- **react-native-background-fetch@4.2.7** (2 connections) — `FaceGuardOffline/package.json`
- **@react-native-community/netinfo@11.3.2** (2 connections) — `FaceGuardOffline/package.json`
- **react-native-sqlite-storage@6.0.1** (2 connections) — `FaceGuardOffline/package.json`
- **react-native-vision-camera@4.5.3** (2 connections) — `FaceGuardOffline/package.json`
- **getOrCreateDeviceId (MMKV-persisted)** (2 connections) — `FaceGuardOffline/src/sync/SyncService.ts`
- **packagingOptions pickFirst libc++_shared.so (all ABIs)** (1 connections) — `FaceGuardOffline/android/app/build.gradle`
- **android/build.gradle (NDK 27.1.12297006, compileSdk 34)** (1 connections) — `FaceGuardOffline/android/build.gradle`
- **android/settings.gradle (autolinking via native_modules.gradle)** (1 connections) — `FaceGuardOffline/android/settings.gradle`
- **metro.config.js (assetExts: tflite/task/bin)** (1 connections) — `FaceGuardOffline/metro.config.js`
- **S3Uploader.getS3Key (date-partitioned key)** (1 connections) — `FaceGuardOffline/src/sync/S3Uploader.ts`
- **__tests__/attendanceRepository.test.ts** (1 connections) — `FaceGuardOffline/__tests__/attendanceRepository.test.ts`
- **__tests__/embedding.test.ts** (1 connections) — `FaceGuardOffline/__tests__/embedding.test.ts`
- **__tests__/preprocessor.test.ts** (1 connections) — `FaceGuardOffline/__tests__/preprocessor.test.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `FaceGuardOffline/__tests__/attendanceRepository.test.ts`
- `FaceGuardOffline/__tests__/embedding.test.ts`
- `FaceGuardOffline/__tests__/preprocessor.test.ts`
- `FaceGuardOffline/android/app/build.gradle`
- `FaceGuardOffline/android/build.gradle`
- `FaceGuardOffline/android/settings.gradle`
- `FaceGuardOffline/jest.setup.js`
- `FaceGuardOffline/metro.config.js`
- `FaceGuardOffline/package.json`
- `FaceGuardOffline/src/sync/S3Uploader.ts`
- `FaceGuardOffline/src/sync/SyncService.ts`

## Audit Trail

- EXTRACTED: 47 (80%)
- INFERRED: 12 (20%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*