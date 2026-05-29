import {
  resizeBilinear,
  normalizeForMobileFaceNet,
  normalizeForBlazeFace,
  normalizeForMiniFASNet,
  claheEqualize,
  cropFace,
} from '../src/ml/Preprocessor';

// Mock imageUtils for the YUV conversion (used by claheEqualize)
jest.mock('../src/utils/imageUtils', () => ({
  rgbToYuv: (r: number, g: number, b: number) => ({
    y: 0.299 * r + 0.587 * g + 0.114 * b,
    u: -0.14713 * r - 0.28886 * g + 0.436 * b,
    v: 0.615 * r - 0.51499 * g - 0.10001 * b,
  }),
  yuvToRgb: (y: number, u: number, v: number) => ({
    r: Math.max(0, Math.min(255, Math.round(y + 1.13983 * v))),
    g: Math.max(0, Math.min(255, Math.round(y - 0.39465 * u - 0.5806 * v))),
    b: Math.max(0, Math.min(255, Math.round(y + 2.03211 * u))),
  }),
}));

describe('resizeBilinear', () => {
  it('produces correct output dimensions', () => {
    const src = new Uint8Array(100 * 100 * 3).fill(128);
    const result = resizeBilinear(src, 100, 100, 128, 128);
    expect(result.length).toBe(128 * 128 * 3);
  });

  it('2x upscale produces correct dimensions', () => {
    const src = new Uint8Array(64 * 64 * 3).fill(200);
    const result = resizeBilinear(src, 64, 64, 128, 128);
    expect(result.length).toBe(128 * 128 * 3);
  });

  it('downscale to 80x80 produces correct dimensions', () => {
    const src = new Uint8Array(200 * 200 * 3).fill(100);
    const result = resizeBilinear(src, 200, 200, 80, 80);
    expect(result.length).toBe(80 * 80 * 3);
  });

  it('pixel values stay in [0, 255] range', () => {
    const src = new Uint8Array(50 * 50 * 3);
    for (let i = 0; i < src.length; i++) src[i] = Math.floor(Math.random() * 256);
    const result = resizeBilinear(src, 50, 50, 112, 112);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(0);
      expect(result[i]).toBeLessThanOrEqual(255);
    }
  });

  it('constant color image stays constant after resize', () => {
    const src = new Uint8Array(32 * 32 * 3).fill(180);
    const result = resizeBilinear(src, 32, 32, 64, 64);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeCloseTo(180, 0);
    }
  });
});

describe('normalizeForMobileFaceNet', () => {
  it('maps 0 → -1.0', () => {
    const input = new Float32Array([0]);
    expect(normalizeForMobileFaceNet(input)[0]).toBeCloseTo(-1.0, 5);
  });

  it('maps 255 → 1.0', () => {
    const input = new Float32Array([255]);
    expect(normalizeForMobileFaceNet(input)[0]).toBeCloseTo(1.0, 5);
  });

  it('maps 127.5 → 0.0', () => {
    const input = new Float32Array([127.5]);
    expect(normalizeForMobileFaceNet(input)[0]).toBeCloseTo(0.0, 4);
  });

  it('all output values in [-1, 1]', () => {
    const input = new Float32Array(112 * 112 * 3);
    for (let i = 0; i < input.length; i++) input[i] = Math.random() * 255;
    const output = normalizeForMobileFaceNet(input);
    for (let i = 0; i < output.length; i++) {
      expect(output[i]).toBeGreaterThanOrEqual(-1.0);
      expect(output[i]).toBeLessThanOrEqual(1.0);
    }
  });
});

describe('normalizeForMiniFASNet', () => {
  it('maps 0 → 0.0', () => {
    const input = new Float32Array([0]);
    expect(normalizeForMiniFASNet(input)[0]).toBeCloseTo(0.0, 5);
  });

  it('maps 255 → 1.0', () => {
    const input = new Float32Array([255]);
    expect(normalizeForMiniFASNet(input)[0]).toBeCloseTo(1.0, 5);
  });

  it('maps 127.5 → 0.5', () => {
    const input = new Float32Array([127.5]);
    expect(normalizeForMiniFASNet(input)[0]).toBeCloseTo(0.5, 4);
  });

  it('all output values in [0, 1]', () => {
    const input = new Float32Array(128 * 128 * 3);
    for (let i = 0; i < input.length; i++) input[i] = Math.random() * 255;
    const output = normalizeForMiniFASNet(input);
    for (let i = 0; i < output.length; i++) {
      expect(output[i]).toBeGreaterThanOrEqual(0.0);
      expect(output[i]).toBeLessThanOrEqual(1.0);
    }
  });
});

describe('claheEqualize', () => {
  it('does not change image dimensions', () => {
    const pixels = new Uint8Array(100 * 100 * 3).fill(128);
    const result = claheEqualize(pixels, 100, 100);
    expect(result.length).toBe(100 * 100 * 3);
  });

  it('output pixel values stay in [0, 255]', () => {
    const pixels = new Uint8Array(80 * 80 * 3);
    for (let i = 0; i < pixels.length; i++) pixels[i] = Math.floor(Math.random() * 256);
    const result = claheEqualize(pixels, 80, 80);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(0);
      expect(result[i]).toBeLessThanOrEqual(255);
    }
  });

  it('handles uniform image without crashing', () => {
    const pixels = new Uint8Array(64 * 64 * 3).fill(100);
    expect(() => claheEqualize(pixels, 64, 64)).not.toThrow();
  });
});

describe('cropFace', () => {
  it('returns non-empty buffer for valid bbox', () => {
    const frame = new Uint8Array(200 * 200 * 3).fill(128);
    const bbox = { x: 50, y: 50, width: 80, height: 80 };
    const result = cropFace(frame, bbox, 200, 200);
    expect(result.length).toBeGreaterThan(0);
  });

  it('clamps to frame bounds', () => {
    const frame = new Uint8Array(100 * 100 * 3).fill(100);
    const bbox = { x: 90, y: 90, width: 40, height: 40 }; // exceeds bounds
    expect(() => cropFace(frame, bbox, 100, 100)).not.toThrow();
  });
});
