export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceLandmarks {
  leftEye: Point[];
  rightEye: Point[];
  mouth: Point[];
  noseTip: Point;
  yaw: number;
  pitch: number;
  roll: number;
}

export interface DetectedFace {
  boundingBox: BoundingBox;
  landmarks?: FaceLandmarks;
  confidence: number;
}

export interface FaceEmbedding {
  vector: Float32Array;
  norm: number;
}

export interface Employee {
  id: string;
  name: string;
  employeeCode: string;
  embedding: Float32Array;
  enrolledAt: number;
  thumbnailHash: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: number;
  confidence: number;
  livenessScore: number;
  latitude?: number;
  longitude?: number;
  synced: boolean;
  syncAttempts: number;
}

export interface RecognitionResult {
  matched: boolean;
  employee?: Employee;
  similarity: number;
  livenessScore: number;
  livenessPass: boolean;
  processingTimeMs: number;
}

export type ChallengeType = 'BLINK' | 'SMILE' | 'TURN_LEFT' | 'TURN_RIGHT' | 'NOD';

export interface LivenessChallenge {
  type: ChallengeType;
  completed: boolean;
  timeoutAt: number;
}

export interface SyncStatus {
  pending: number;
  lastSyncAt?: number;
  isSyncing: boolean;
  lastError?: string;
}

export interface HeadPose {
  yaw: number;
  pitch: number;
  roll: number;
}

export type PipelineStage =
  | 'NO_FACE'
  | 'FACE_DETECTED'
  | 'LIVENESS_CHALLENGE'
  | 'LIVENESS_FAIL'
  | 'RECOGNISING'
  | 'MATCH'
  | 'NO_MATCH';

export interface PipelineResult {
  stage: PipelineStage;
  detectedFace?: DetectedFace;
  currentChallenge?: ChallengeType;
  challengeProgress: number;
  recognitionResult?: RecognitionResult;
}
