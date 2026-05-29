import { Frame } from 'react-native-vision-camera';
import {
  DetectedFace,
  Employee,
  HeadPose,
  ChallengeType,
  LivenessChallenge,
  PipelineResult,
  PipelineStage,
  RecognitionResult,
  FaceLandmarks,
} from '../types';
import { LIVENESS_CONFIG, MODELS } from '../constants/ModelConfig';
import { FaceDetector } from './FaceDetector';
import { FaceRecogniser } from './FaceRecogniser';
import { LivenessDetector } from './LivenessDetector';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export class FacePipeline {
  private detector: FaceDetector;
  private recogniser: FaceRecogniser;
  private livenessDetector: LivenessDetector;

  private challenges: LivenessChallenge[] = [];
  private challengeIndex: number = 0;
  private earHistory: number[] = [];
  private poseHistory: HeadPose[] = [];
  private passiveLivenessScore: number = 0;

  private constructor(
    detector: FaceDetector,
    recogniser: FaceRecogniser,
    livenessDetector: LivenessDetector,
  ) {
    this.detector = detector;
    this.recogniser = recogniser;
    this.livenessDetector = livenessDetector;
  }

  static async create(): Promise<FacePipeline> {
    const [detector, recogniser, livenessDetector] = await Promise.all([
      FaceDetector.create(),
      FaceRecogniser.create(),
      LivenessDetector.create(),
    ]);
    return new FacePipeline(detector, recogniser, livenessDetector);
  }

  private generateChallenges(): void {
    const possible = [...LIVENESS_CONFIG.POSSIBLE_CHALLENGES] as ChallengeType[];
    const shuffled = shuffleArray(possible);
    const selected = shuffled.slice(0, LIVENESS_CONFIG.CHALLENGES_REQUIRED);
    this.challenges = selected.map((type) => ({
      type,
      completed: false,
      timeoutAt: Date.now() + LIVENESS_CONFIG.CHALLENGE_TIMEOUT_MS,
    }));
    this.challengeIndex = 0;
  }

  reset(): void {
    this.challenges = [];
    this.challengeIndex = 0;
    this.earHistory = [];
    this.poseHistory = [];
    this.passiveLivenessScore = 0;
  }

  private getCurrentChallenge(): LivenessChallenge | null {
    if (this.challengeIndex >= this.challenges.length) return null;
    return this.challenges[this.challengeIndex];
  }

  private evaluateChallenge(
    challenge: LivenessChallenge,
    landmarks: FaceLandmarks | undefined,
  ): boolean {
    if (!landmarks) return false;

    switch (challenge.type) {
      case 'BLINK':
        return this.livenessDetector.detectBlink(this.earHistory);
      case 'SMILE':
        return this.livenessDetector.detectSmile(landmarks);
      case 'TURN_LEFT':
        return this.livenessDetector.detectHeadTurn(this.poseHistory, 'LEFT');
      case 'TURN_RIGHT':
        return this.livenessDetector.detectHeadTurn(this.poseHistory, 'RIGHT');
      case 'NOD':
        return this.livenessDetector.detectNod(this.poseHistory);
      default:
        return false;
    }
  }

  private largestFace(faces: DetectedFace[]): DetectedFace {
    return faces.reduce((best, face) =>
      face.boundingBox.width * face.boundingBox.height >
      best.boundingBox.width * best.boundingBox.height
        ? face
        : best,
    );
  }

  async processFrame(frame: Frame, employees: Employee[]): Promise<PipelineResult> {
    const startTime = Date.now();

    try {
      // Stage 1: Face Detection
      const faces = this.detector.detect(frame);
      if (faces.length === 0) {
        return { stage: 'NO_FACE', challengeProgress: 0 };
      }

      const face = this.largestFace(faces);

      // Stage 2: Passive Liveness Check
      if (this.passiveLivenessScore === 0) {
        const score = await this.livenessDetector.passiveCheck(frame, face.boundingBox);
        this.passiveLivenessScore = score;

        if (score < MODELS.MINIFASNET.livenessThreshold) {
          return {
            stage: 'LIVENESS_FAIL',
            detectedFace: face,
            challengeProgress: 0,
          };
        }
      }

      // Stage 3: Active Liveness Challenges
      if (this.challenges.length === 0) {
        this.generateChallenges();
      }

      const currentChallenge = this.getCurrentChallenge();

      // Update histories from landmarks
      if (face.landmarks) {
        const ear = this.livenessDetector.computeEAR(face.landmarks);
        this.earHistory.push(ear);
        if (this.earHistory.length > 30) this.earHistory.shift();

        const pose = this.livenessDetector.extractHeadPose(face.landmarks);
        this.poseHistory.push(pose);
        if (this.poseHistory.length > 30) this.poseHistory.shift();
      }

      if (currentChallenge !== null) {
        // Check for timeout
        if (Date.now() > currentChallenge.timeoutAt) {
          return {
            stage: 'LIVENESS_FAIL',
            detectedFace: face,
            challengeProgress: 0,
            currentChallenge: currentChallenge.type,
          };
        }

        const completed = this.evaluateChallenge(currentChallenge, face.landmarks);
        if (completed) {
          currentChallenge.completed = true;
          this.challengeIndex++;
          // Reset histories for next challenge
          this.earHistory = [];
          this.poseHistory = [];
        }

        const timeLeft = Math.max(0, currentChallenge.timeoutAt - Date.now());
        const progress = 1 - timeLeft / LIVENESS_CONFIG.CHALLENGE_TIMEOUT_MS;

        if (this.getCurrentChallenge() !== null) {
          return {
            stage: 'LIVENESS_CHALLENGE',
            detectedFace: face,
            currentChallenge: this.getCurrentChallenge()?.type ?? currentChallenge.type,
            challengeProgress: completed ? 1.0 : progress,
          };
        }
      }

      // All challenges passed — run recognition
      try {
        const embedding = await this.recogniser.embed(frame, face.boundingBox);
        const { employee, similarity } = this.recogniser.findBestMatch(embedding, employees);
        const processingTimeMs = Date.now() - startTime;

        const recognitionResult: RecognitionResult = {
          matched: employee !== null,
          employee: employee ?? undefined,
          similarity,
          livenessScore: this.passiveLivenessScore,
          livenessPass: true,
          processingTimeMs,
        };

        const stage: PipelineStage = employee !== null ? 'MATCH' : 'NO_MATCH';
        return {
          stage,
          detectedFace: face,
          challengeProgress: 1.0,
          recognitionResult,
        };
      } catch (embedError) {
        if (__DEV__) {
          console.error('FacePipeline: embedding error:', embedError);
        }
        return { stage: 'NO_MATCH', detectedFace: face, challengeProgress: 1.0 };
      }
    } catch (error) {
      if (__DEV__) {
        console.error('FacePipeline.processFrame error:', error);
      }
      return { stage: 'NO_FACE', challengeProgress: 0 };
    }
  }
}
