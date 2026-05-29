# Architectural Flows & Concepts

> 33 nodes · cohesion 0.08

## Key Concepts

- **EmployeeRepository.ts** (21 connections) — `FaceGuardOffline/src/db/EmployeeRepository.ts`
- **SplashScreen.tsx** (18 connections) — `FaceGuardOffline/src/screens/SplashScreen.tsx`
- **imageUtils.ts** (10 connections) — `FaceGuardOffline/src/utils/imageUtils.ts`
- **getAllEmployees()** (9 connections) — `FaceGuardOffline/src/db/EmployeeRepository.ts`
- **float32ArrayToBlob()** (6 connections) — `FaceGuardOffline/src/db/EmployeeRepository.ts`
- **insertEmployee()** (6 connections) — `FaceGuardOffline/src/db/EmployeeRepository.ts`
- **rowToEmployee()** (5 connections) — `FaceGuardOffline/src/db/EmployeeRepository.ts`
- **updateEmployeeCache()** (5 connections) — `FaceGuardOffline/src/hooks/useFacePipeline.ts`
- **blobToFloat32Array()** (3 connections) — `FaceGuardOffline/src/db/EmployeeRepository.ts`
- **getEmployee()** (3 connections) — `FaceGuardOffline/src/db/EmployeeRepository.ts`
- **getEmployeeByCode()** (3 connections) — `FaceGuardOffline/src/db/EmployeeRepository.ts`
- **updateEmbedding()** (3 connections) — `FaceGuardOffline/src/db/EmployeeRepository.ts`
- **runBoot (permissions→db→models→employees→ready)** (3 connections) — `FaceGuardOffline/src/screens/SplashScreen.tsx`
- **base64ToFloat32Array()** (3 connections) — `FaceGuardOffline/src/utils/imageUtils.ts`
- **float32ArrayToBase64()** (3 connections) — `FaceGuardOffline/src/utils/imageUtils.ts`
- **Embedding Serialization Pipeline (Float32Array → base64 → SQLite BLOB)** (2 connections) — `FaceGuardOffline/src/db/EmployeeRepository.ts`
- **SQLite employees table (id, name, employee_code, embedding BLOB, thumbnail_hash)** (2 connections) — `FaceGuardOffline/src/db/Database.ts`
- **handleCapture (duplicate check + insert)** (2 connections) — `FaceGuardOffline/src/screens/EnrollmentScreen.tsx`
- **performInsert (insertEmployee + updateEmployeeCache)** (2 connections) — `FaceGuardOffline/src/screens/EnrollmentScreen.tsx`
- **float32ArrayToBase64 (Float32Array → Buffer → base64 string)** (2 connections) — `FaceGuardOffline/src/utils/imageUtils.ts`
- **sha256Hash()** (2 connections) — `FaceGuardOffline/src/utils/imageUtils.ts`
- **Boot Sequence (permissions → database → AI models → employees → navigate Home)** (1 connections) — `FaceGuardOffline/src/screens/SplashScreen.tsx`
- **Enrollment Flow (capture → cosine dup check → insertEmployee → updateEmployeeCache)** (1 connections) — `FaceGuardOffline/src/screens/EnrollmentScreen.tsx`
- **BootStep** (1 connections) — `FaceGuardOffline/src/screens/SplashScreen.tsx`
- **INITIAL_STEPS** (1 connections) — `FaceGuardOffline/src/screens/SplashScreen.tsx`
- *... and 8 more nodes in this community*

## Relationships

- [[UI Overlay & Stage Display]] (13 shared connections)
- [[Database & App Configuration]] (12 shared connections)
- [[Camera & Frame Processing]] (8 shared connections)
- [[Image Preprocessing Pipeline]] (3 shared connections)
- [[Encrypted Embedding Storage]] (1 shared connections)

## Source Files

- `FaceGuardOffline/src/db/Database.ts`
- `FaceGuardOffline/src/db/EmployeeRepository.ts`
- `FaceGuardOffline/src/hooks/useFacePipeline.ts`
- `FaceGuardOffline/src/screens/EnrollmentScreen.tsx`
- `FaceGuardOffline/src/screens/SplashScreen.tsx`
- `FaceGuardOffline/src/utils/imageUtils.ts`

## Audit Trail

- EXTRACTED: 119 (95%)
- INFERRED: 6 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*