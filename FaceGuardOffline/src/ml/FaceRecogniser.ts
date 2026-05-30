import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Frame } from 'react-native-vision-camera';
import { BoundingBox, Employee, FaceEmbedding } from '../types';
import { MODELS } from '../constants/ModelConfig';
import { prepareFaceForMobileFaceNet } from './Preprocessor';
import { l2Normalize, cosineSimilarity } from '../utils/embedding';

// Extract frame pixels as Uint8Array RGB
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

export class FaceRecogniser {
  private model: TensorflowModel;

  private constructor(model: TensorflowModel) {
    this.model = model;
  }

  static async create(): Promise<FaceRecogniser> {
    try {
      const model = await loadTensorflowModel(MODELS.MOBILEFACENET.path, 'default');
      return new FaceRecogniser(model);
    } catch (error) {
      throw new Error(`Failed to load MobileFaceNet model: ${String(error)}`);
    }
  }

  async embed(frame: Frame, bbox: BoundingBox): Promise<FaceEmbedding> {
    try {
      const { pixels, width, height } = extractFramePixels(frame);
      const prepared = prepareFaceForMobileFaceNet(pixels, bbox, width, height);

      const outputs = this.model.runSync([prepared]);
      const rawVector = outputs[0] as Float32Array;

      const normalised = l2Normalize(rawVector);
      let norm = 0;
      for (let i = 0; i < normalised.length; i++) {
        norm += normalised[i] * normalised[i];
      }

      return { vector: normalised, norm: Math.sqrt(norm) };
    } catch (error) {
      throw new Error(`FaceRecogniser.embed failed: ${String(error)}`);
    }
  }

  findBestMatch(
    embedding: FaceEmbedding,
    database: Employee[],
  ): { employee: Employee | null; similarity: number } {
    let bestSimilarity = -1;
    let bestEmployee: Employee | null = null;

    for (const emp of database) {
      const sim = cosineSimilarity(embedding.vector, emp.embedding);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestEmployee = emp;
      }
    }

    if (bestSimilarity >= MODELS.MOBILEFACENET.similarityThreshold) {
      return { employee: bestEmployee, similarity: bestSimilarity };
    }
    return { employee: null, similarity: bestSimilarity };
  }
}
