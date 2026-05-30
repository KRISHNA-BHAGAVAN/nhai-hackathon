import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Frame } from 'react-native-vision-camera';
import { BoundingBox, FaceLandmarks, HeadPose, Point } from '../types';
import { MODELS, LIVENESS_CONFIG } from '../constants/ModelConfig';
import { prepareFaceForMiniFASNet } from './Preprocessor';

function extractFramePixels(frame: Frame): { pixels: Uint8Array; width: number; height: number } {
  const buffer = frame.toArrayBuffer();
  const bytes = new Uint8Array(buffer);
  const width = frame.width;
  const height = frame.height;
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    rgb[i * 3] = bytes[i * 4];
    rgb[i * 3 + 1] = bytes[i * 4 + 1];
    rgb[i * 3 + 2] = bytes[i * 4 + 2];
  }
  return { pixels: rgb, width, height };
}

function pointDistance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function softmax2(a: number, b: number): [number, number] {
  const maxVal = Math.max(a, b);
  const ea = Math.exp(a - maxVal);
  const eb = Math.exp(b - maxVal);
  const sum = ea + eb;
  return [ea / sum, eb / sum];
}

export class LivenessDetector {
  private model: TensorflowModel;

  private constructor(model: TensorflowModel) {
    this.model = model;
  }

  static async create(): Promise<LivenessDetector> {
    try {
      const model = await loadTensorflowModel(MODELS.MINIFASNET.path, 'default');
      return new LivenessDetector(model);
    } catch (error) {
      throw new Error(`Failed to load MiniFASNet model: ${String(error)}`);
    }
  }

  async passiveCheck(frame: Frame, bbox: BoundingBox): Promise<number> {
    try {
      const { pixels, width, height } = extractFramePixels(frame);
      const prepared = prepareFaceForMiniFASNet(pixels, bbox, width, height);
      const outputs = this.model.runSync([prepared]);
      const logits = outputs[0] as Float32Array;
      // logits[0] = real score, logits[1] = spoof score
      const [realScore] = softmax2(logits[0], logits[1]);
      return realScore;
    } catch (error) {
      if (__DEV__) {
        console.error('LivenessDetector.passiveCheck error:', error);
      }
      return 0;
    }
  }

  computeEAR(landmarks: FaceLandmarks): number {
    const eyeAspectRatio = (eye: Point[]): number => {
      if (eye.length < 6) return 1.0;
      // EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
      const vertical1 = pointDistance(eye[1], eye[5]);
      const vertical2 = pointDistance(eye[2], eye[4]);
      const horizontal = pointDistance(eye[0], eye[3]);
      if (horizontal === 0) return 1.0;
      return (vertical1 + vertical2) / (2.0 * horizontal);
    };

    const leftEAR = eyeAspectRatio(landmarks.leftEye);
    const rightEAR = eyeAspectRatio(landmarks.rightEye);
    return (leftEAR + rightEAR) / 2.0;
  }

  computeSmileScore(landmarks: FaceLandmarks): number {
    if (landmarks.mouth.length < 6) return 0;
    // Mouth corners
    const leftCorner = landmarks.mouth[0];
    const rightCorner = landmarks.mouth[landmarks.mouth.length > 6 ? 6 : landmarks.mouth.length - 1];
    // Top lip center and bottom lip center
    const topCenter = landmarks.mouth[Math.floor(landmarks.mouth.length / 4)];
    const bottomCenter = landmarks.mouth[Math.floor(landmarks.mouth.length * 3 / 4)];

    const mouthWidth = pointDistance(leftCorner, rightCorner);
    const mouthHeight = pointDistance(topCenter, bottomCenter);

    if (mouthHeight === 0) return 0;
    // Normalised ratio — higher means wider smile
    return Math.min(1.0, mouthWidth / (mouthHeight * 3.0 + 1));
  }

  extractHeadPose(landmarks: FaceLandmarks): HeadPose {
    return {
      yaw: landmarks.yaw,
      pitch: landmarks.pitch,
      roll: landmarks.roll,
    };
  }

  detectBlink(earHistory: number[]): boolean {
    if (earHistory.length < 3) return false;
    const threshold = LIVENESS_CONFIG.EAR_BLINK_THRESHOLD;
    // Look for EAR dip then recovery
    for (let i = 1; i < earHistory.length - 1; i++) {
      const prevAbove = earHistory[i - 1] > threshold;
      const currBelow = earHistory[i] <= threshold;
      const nextBelow = i + 1 < earHistory.length && earHistory[i + 1] <= threshold;
      const recovered = earHistory.length > i + 2 && earHistory[i + 2] > threshold;
      if (prevAbove && currBelow && (nextBelow || recovered)) {
        return true;
      }
    }
    return false;
  }

  detectSmile(landmarks: FaceLandmarks): boolean {
    return this.computeSmileScore(landmarks) > LIVENESS_CONFIG.SMILE_THRESHOLD;
  }

  detectHeadTurn(poseHistory: HeadPose[], direction: 'LEFT' | 'RIGHT'): boolean {
    if (poseHistory.length < 2) return false;
    const firstYaw = poseHistory[0].yaw;
    const lastYaw = poseHistory[poseHistory.length - 1].yaw;
    const delta = lastYaw - firstYaw;

    if (direction === 'LEFT') {
      return delta > LIVENESS_CONFIG.HEAD_TURN_DEGREES;
    }
    return delta < -LIVENESS_CONFIG.HEAD_TURN_DEGREES;
  }

  detectNod(poseHistory: HeadPose[]): boolean {
    if (poseHistory.length < 2) return false;
    const firstPitch = poseHistory[0].pitch;
    let maxDelta = 0;
    for (const pose of poseHistory) {
      const delta = Math.abs(pose.pitch - firstPitch);
      if (delta > maxDelta) maxDelta = delta;
    }
    return maxDelta > LIVENESS_CONFIG.NOD_DEGREES;
  }
}
