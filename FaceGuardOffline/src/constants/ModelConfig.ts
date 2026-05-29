export const MODELS = Object.freeze({
  BLAZEFACE: {
    path: require('../../assets/models/blaze_face_short_range.tflite'),
    inputWidth: 128,
    inputHeight: 128,
    scoreThreshold: 0.75,
  },
  MOBILEFACENET: {
    path: require('../../assets/models/mobilefacenet.tflite'),
    inputWidth: 112,
    inputHeight: 112,
    embeddingDim: 128,
    similarityThreshold: 0.60,
  },
  MINIFASNET: {
    path: require('../../assets/models/minifasnet.tflite'),
    inputWidth: 128,
    inputHeight: 128,
    livenessThreshold: 0.80,
  },
  FACE_LANDMARKER: {
    path: require('../../assets/models/face_landmarker.task'),
  },
} as const);

export type ChallengeType = 'BLINK' | 'SMILE' | 'TURN_LEFT' | 'TURN_RIGHT' | 'NOD';

export const LIVENESS_CONFIG = Object.freeze({
  EAR_BLINK_THRESHOLD: 0.20,
  SMILE_THRESHOLD: 0.35,
  HEAD_TURN_DEGREES: 20,
  NOD_DEGREES: 15,
  CHALLENGE_TIMEOUT_MS: 2500,
  CHALLENGES_REQUIRED: 2,
  POSSIBLE_CHALLENGES: ['BLINK', 'SMILE', 'TURN_LEFT', 'TURN_RIGHT', 'NOD'] as ChallengeType[],
} as const);
