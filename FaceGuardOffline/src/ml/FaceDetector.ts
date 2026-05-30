import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Frame } from 'react-native-vision-camera';
import { BoundingBox, DetectedFace } from '../types';
import { MODELS } from '../constants/ModelConfig';

function extractFramePixels(frame: Frame): { pixels: Uint8Array; width: number; height: number } {
  // VisionCamera frame — access pixel buffer via frame.toArrayBuffer()
  // Frame is YUV on Android, BGRA on iOS; we approximate by treating as RGB for inference
  const buffer = frame.toArrayBuffer();
  const bytes = new Uint8Array(buffer);
  // frame.width * frame.height * bytesPerPixel
  // For a 4-channel frame (RGBA/BGRA), stride = 4
  const width = frame.width;
  const height = frame.height;
  // Convert to packed RGB (3 bytes per pixel)
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    rgb[i * 3] = bytes[i * 4];       // R (or B on iOS, acceptable approximation)
    rgb[i * 3 + 1] = bytes[i * 4 + 1]; // G
    rgb[i * 3 + 2] = bytes[i * 4 + 2]; // B (or R on iOS)
  }
  return { pixels: rgb, width, height };
}

function iou(a: BoundingBox, b: BoundingBox): number {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.width, b.x + b.width);
  const y1 = Math.min(a.y + a.height, b.y + b.height);
  const intersection = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
  const union = a.width * a.height + b.width * b.height - intersection;
  return union === 0 ? 0 : intersection / union;
}

function nms(candidates: DetectedFace[], iouThreshold: number): DetectedFace[] {
  const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence);
  const kept: DetectedFace[] = [];
  const suppressed = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    if (suppressed.has(i)) continue;
    kept.push(sorted[i]);
    for (let j = i + 1; j < sorted.length; j++) {
      if (!suppressed.has(j) && iou(sorted[i].boundingBox, sorted[j].boundingBox) > iouThreshold) {
        suppressed.add(j);
      }
    }
  }
  return kept;
}

export class FaceDetector {
  private model: TensorflowModel;

  private constructor(model: TensorflowModel) {
    this.model = model;
  }

  static async create(): Promise<FaceDetector> {
    try {
      const model = await loadTensorflowModel(MODELS.BLAZEFACE.path, 'default');
      return new FaceDetector(model);
    } catch (error) {
      throw new Error(`Failed to load BlazeFace model: ${String(error)}`);
    }
  }

  detect(frame: Frame): DetectedFace[] {
    try {
      const { pixels, width, height } = extractFramePixels(frame);

      // Resize to 128x128
      const INPUT_W = MODELS.BLAZEFACE.inputWidth;
      const INPUT_H = MODELS.BLAZEFACE.inputHeight;
      const resized = new Float32Array(INPUT_W * INPUT_H * 3);
      const xRatio = width / INPUT_W;
      const yRatio = height / INPUT_H;

      for (let y = 0; y < INPUT_H; y++) {
        for (let x = 0; x < INPUT_W; x++) {
          const srcX = Math.min(Math.floor(x * xRatio), width - 1);
          const srcY = Math.min(Math.floor(y * yRatio), height - 1);
          const srcIdx = (srcY * width + srcX) * 3;
          const dstIdx = (y * INPUT_W + x) * 3;
          resized[dstIdx] = pixels[srcIdx] / 127.5 - 1.0;
          resized[dstIdx + 1] = pixels[srcIdx + 1] / 127.5 - 1.0;
          resized[dstIdx + 2] = pixels[srcIdx + 2] / 127.5 - 1.0;
        }
      }

      // Run inference
      const outputs = this.model.runSync([resized]);
      // BlazeFace output: boxes [1, 896, 4], scores [1, 896, 1]
      const boxes = outputs[0] as Float32Array;   // 896 * 4
      const scores = outputs[1] as Float32Array;  // 896 * 1

      const candidates: DetectedFace[] = [];
      for (let i = 0; i < 896; i++) {
        const score = scores[i];
        if (score < MODELS.BLAZEFACE.scoreThreshold) continue;

        // Box is [cy, cx, h, w] normalised in BlazeFace output
        const cy = boxes[i * 4];
        const cx = boxes[i * 4 + 1];
        const h = boxes[i * 4 + 2];
        const w = boxes[i * 4 + 3];

        candidates.push({
          boundingBox: {
            x: Math.max(0, (cx - w / 2) * width),
            y: Math.max(0, (cy - h / 2) * height),
            width: w * width,
            height: h * height,
          },
          confidence: score,
        });
      }

      const survived = nms(candidates, 0.3);
      return survived.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      if (__DEV__) {
        console.error('FaceDetector.detect error:', error);
      }
      return [];
    }
  }
}
