# INT8 Quantization Pipeline

> 3 nodes · cohesion 0.67

## Key Concepts

- **INT8 quantization (ONNX→TFLite, 533 nodes, 525 direct + 4 rewritten)** (2 connections) — `FaceGuardOffline/assets/models/best_model_quantized_tensor_correspondence_report.json`
- **best_model_quantized tensor correspondence report (533 nodes, INT8, Conv/PRelu pruning)** (2 connections) — `FaceGuardOffline/assets/models/best_model_quantized_tensor_correspondence_report.json`
- **Conv/PRelu/BN tensor pruning (prune_unused_tensors lineage events)** (1 connections) — `FaceGuardOffline/assets/models/best_model_quantized_tensor_correspondence_report.json`

## Relationships

- [[UI Overlay & Stage Display]] (1 shared connections)

## Source Files

- `FaceGuardOffline/assets/models/best_model_quantized_tensor_correspondence_report.json`

## Audit Trail

- EXTRACTED: 4 (80%)
- INFERRED: 1 (20%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*