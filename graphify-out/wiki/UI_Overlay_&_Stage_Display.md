# UI Overlay & Stage Display

> 78 nodes · cohesion 0.06

## Key Concepts

- **index.ts** (34 connections) — `FaceGuardOffline/src/types/index.ts`
- **EnrollmentScreen.tsx** (30 connections) — `FaceGuardOffline/src/screens/EnrollmentScreen.tsx`
- **FacePipeline.ts** (23 connections) — `FaceGuardOffline/src/ml/FacePipeline.ts`
- **FacePipeline** (16 connections) — `FaceGuardOffline/src/ml/FacePipeline.ts`
- **LivenessDetector** (16 connections) — `FaceGuardOffline/src/ml/LivenessDetector.ts`
- **LivenessDetector.ts** (15 connections) — `FaceGuardOffline/src/ml/LivenessDetector.ts`
- **FaceRecogniser.ts** (14 connections) — `FaceGuardOffline/src/ml/FaceRecogniser.ts`
- **useFacePipeline.ts** (12 connections) — `FaceGuardOffline/src/hooks/useFacePipeline.ts`
- **FaceDetector** (12 connections) — `FaceGuardOffline/src/ml/FaceDetector.ts`
- **FaceDetector.ts** (11 connections) — `FaceGuardOffline/src/ml/FaceDetector.ts`
- **MODELS** (10 connections) — `FaceGuardOffline/src/constants/ModelConfig.ts`
- **FaceOverlay.tsx** (10 connections) — `FaceGuardOffline/src/components/FaceOverlay.tsx`
- **ModelConfig.ts** (10 connections) — `FaceGuardOffline/src/constants/ModelConfig.ts`
- **Employee** (10 connections) — `FaceGuardOffline/src/types/index.ts`
- **FaceRecogniser** (9 connections) — `FaceGuardOffline/src/ml/FaceRecogniser.ts`
- **BoundingBox** (9 connections) — `FaceGuardOffline/src/types/index.ts`
- **FaceLandmarks** (9 connections) — `FaceGuardOffline/src/types/index.ts`
- **DetectedFace** (8 connections) — `FaceGuardOffline/src/types/index.ts`
- **.processFrame()** (7 connections) — `FaceGuardOffline/src/ml/FacePipeline.ts`
- **HeadPose** (7 connections) — `FaceGuardOffline/src/types/index.ts`
- **l2Normalize()** (7 connections) — `FaceGuardOffline/src/utils/embedding.ts`
- **LIVENESS_CONFIG** (6 connections) — `FaceGuardOffline/src/constants/ModelConfig.ts`
- **FacePipeline.processFrame (4-stage orchestrator)** (6 connections) — `FaceGuardOffline/src/ml/FacePipeline.ts`
- **.embed()** (6 connections) — `FaceGuardOffline/src/ml/FaceRecogniser.ts`
- **PipelineResult** (6 connections) — `FaceGuardOffline/src/types/index.ts`
- *... and 53 more nodes in this community*

## Relationships

- [[Camera & Frame Processing]] (17 shared connections)
- [[Database & App Configuration]] (13 shared connections)
- [[Architectural Flows & Concepts]] (13 shared connections)
- [[Image Preprocessing Pipeline]] (13 shared connections)
- [[Embedding & Similarity Utilities]] (8 shared connections)
- [[Recognition Result UI]] (3 shared connections)
- [[INT8 Quantization Pipeline]] (1 shared connections)

## Source Files

- `FaceGuardOffline/src/components/FaceOverlay.tsx`
- `FaceGuardOffline/src/constants/ModelConfig.ts`
- `FaceGuardOffline/src/hooks/useFacePipeline.ts`
- `FaceGuardOffline/src/ml/FaceDetector.ts`
- `FaceGuardOffline/src/ml/FacePipeline.ts`
- `FaceGuardOffline/src/ml/FaceRecogniser.ts`
- `FaceGuardOffline/src/ml/LivenessDetector.ts`
- `FaceGuardOffline/src/screens/EnrollmentScreen.tsx`
- `FaceGuardOffline/src/types/index.ts`
- `FaceGuardOffline/src/utils/embedding.ts`

## Audit Trail

- EXTRACTED: 420 (100%)
- INFERRED: 2 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*