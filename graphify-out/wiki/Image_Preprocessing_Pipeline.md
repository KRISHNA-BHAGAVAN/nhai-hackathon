# Image Preprocessing Pipeline

> 22 nodes · cohesion 0.19

## Key Concepts

- **Preprocessor.ts** (18 connections) — `FaceGuardOffline/src/ml/Preprocessor.ts`
- **preprocessor.test.ts** (14 connections) — `FaceGuardOffline/__tests__/preprocessor.test.ts`
- **prepareFaceForMobileFaceNet()** (10 connections) — `FaceGuardOffline/src/ml/Preprocessor.ts`
- **prepareFaceForMiniFASNet()** (7 connections) — `FaceGuardOffline/src/ml/Preprocessor.ts`
- **cropFace()** (6 connections) — `FaceGuardOffline/src/ml/Preprocessor.ts`
- **resizeBilinear()** (6 connections) — `FaceGuardOffline/src/ml/Preprocessor.ts`
- **claheEqualize()** (5 connections) — `FaceGuardOffline/src/ml/Preprocessor.ts`
- **normalizeForMiniFASNet()** (5 connections) — `FaceGuardOffline/src/ml/Preprocessor.ts`
- **normalizeForMobileFaceNet()** (5 connections) — `FaceGuardOffline/src/ml/Preprocessor.ts`
- **prepareFaceForBlazeFace()** (4 connections) — `FaceGuardOffline/src/ml/Preprocessor.ts`
- **normalizeForBlazeFace()** (3 connections) — `FaceGuardOffline/src/ml/Preprocessor.ts`
- **normalizeForBlazeFace (÷127.5 − 1, range [-1,1])** (3 connections) — `FaceGuardOffline/src/ml/Preprocessor.ts`
- **prepareFaceForBlazeFace (crop→resize 128x128→normalize)** (3 connections) — `FaceGuardOffline/src/ml/Preprocessor.ts`
- **rgbToYuv()** (3 connections) — `FaceGuardOffline/src/utils/imageUtils.ts`
- **yuvToRgb()** (3 connections) — `FaceGuardOffline/src/utils/imageUtils.ts`
- **bbox** (1 connections) — `FaceGuardOffline/__tests__/preprocessor.test.ts`
- **frame** (1 connections) — `FaceGuardOffline/__tests__/preprocessor.test.ts`
- **input** (1 connections) — `FaceGuardOffline/__tests__/preprocessor.test.ts`
- **output** (1 connections) — `FaceGuardOffline/__tests__/preprocessor.test.ts`
- **pixels** (1 connections) — `FaceGuardOffline/__tests__/preprocessor.test.ts`
- **result** (1 connections) — `FaceGuardOffline/__tests__/preprocessor.test.ts`
- **src** (1 connections) — `FaceGuardOffline/__tests__/preprocessor.test.ts`

## Relationships

- [[UI Overlay & Stage Display]] (13 shared connections)
- [[Architectural Flows & Concepts]] (3 shared connections)

## Source Files

- `FaceGuardOffline/__tests__/preprocessor.test.ts`
- `FaceGuardOffline/src/ml/Preprocessor.ts`
- `FaceGuardOffline/src/utils/imageUtils.ts`

## Audit Trail

- EXTRACTED: 100 (98%)
- INFERRED: 2 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*