# Active Liveness Gesture Detection

> 5 nodes · cohesion 0.40

## Key Concepts

- **evaluateChallenge (dispatch BLINK/SMILE/NOD/TURN to LivenessDetector)** (4 connections) — `FaceGuardOffline/src/ml/FacePipeline.ts`
- **detectBlink (EAR history dip detection)** (1 connections) — `FaceGuardOffline/src/ml/LivenessDetector.ts`
- **detectHeadTurn (yaw delta LEFT/RIGHT)** (1 connections) — `FaceGuardOffline/src/ml/LivenessDetector.ts`
- **detectNod (pitch delta)** (1 connections) — `FaceGuardOffline/src/ml/LivenessDetector.ts`
- **detectSmile (mouth width/height ratio)** (1 connections) — `FaceGuardOffline/src/ml/LivenessDetector.ts`

## Relationships

- No strong cross-community connections detected

## Source Files

- `FaceGuardOffline/src/ml/FacePipeline.ts`
- `FaceGuardOffline/src/ml/LivenessDetector.ts`

## Audit Trail

- EXTRACTED: 8 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*