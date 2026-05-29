import { cosineSimilarity, l2Normalize, euclideanDistance } from '../src/utils/embedding';

describe('cosineSimilarity', () => {
  it('returns 1.0 for identical vectors', () => {
    const v = new Float32Array([1, 2, 3, 4, 5]);
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });

  it('returns -1.0 for opposite vectors', () => {
    const v = new Float32Array([1, 2, 3, 4, 5]);
    const neg = new Float32Array(v.map((x) => -x));
    expect(cosineSimilarity(v, neg)).toBeCloseTo(-1.0, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([0, 1, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
  });

  it('returns 0 for zero vector', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([0, 0, 0]);
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it('same-person embeddings score above 0.6 (simulated)', () => {
    // Simulate same-person: slight perturbation of normalised vector
    const base = new Float32Array(128).fill(0);
    // Set a specific pattern
    for (let i = 0; i < 128; i++) base[i] = Math.cos(i * 0.1);
    const norm = l2Normalize(base);
    // Slight perturbation (same person, different capture)
    const perturbed = new Float32Array(128);
    for (let i = 0; i < 128; i++) perturbed[i] = base[i] + (Math.random() - 0.5) * 0.05;
    const normPerturbed = l2Normalize(perturbed);
    const sim = cosineSimilarity(norm, normPerturbed);
    expect(sim).toBeGreaterThan(0.6);
  });

  it('different-person embeddings score below 0.6 (simulated)', () => {
    // Simulate different persons: orthogonal-ish vectors
    const a = new Float32Array(128);
    const b = new Float32Array(128);
    for (let i = 0; i < 64; i++) a[i] = 1;
    for (let i = 64; i < 128; i++) b[i] = 1;
    const normA = l2Normalize(a);
    const normB = l2Normalize(b);
    const sim = cosineSimilarity(normA, normB);
    expect(sim).toBeLessThan(0.6);
  });
});

describe('l2Normalize', () => {
  it('output vector has norm = 1.0', () => {
    const v = new Float32Array([3, 4, 0]); // norm = 5
    const normalised = l2Normalize(v);
    let norm = 0;
    for (let i = 0; i < normalised.length; i++) norm += normalised[i] ** 2;
    expect(Math.sqrt(norm)).toBeCloseTo(1.0, 5);
  });

  it('normalises 128-dim vector correctly', () => {
    const v = new Float32Array(128);
    for (let i = 0; i < 128; i++) v[i] = Math.random() * 2 - 1;
    const normalised = l2Normalize(v);
    let norm = 0;
    for (let i = 0; i < normalised.length; i++) norm += normalised[i] ** 2;
    expect(Math.sqrt(norm)).toBeCloseTo(1.0, 4);
  });

  it('returns zero vector for zero input', () => {
    const v = new Float32Array(4).fill(0);
    const normalised = l2Normalize(v);
    for (let i = 0; i < normalised.length; i++) {
      expect(normalised[i]).toBe(0);
    }
  });

  it('preserves direction', () => {
    const v = new Float32Array([1, 0, 0]);
    const normalised = l2Normalize(v);
    expect(normalised[0]).toBeCloseTo(1.0, 5);
    expect(normalised[1]).toBeCloseTo(0.0, 5);
    expect(normalised[2]).toBeCloseTo(0.0, 5);
  });
});

describe('euclideanDistance', () => {
  it('distance to self is 0', () => {
    const v = new Float32Array([1, 2, 3]);
    expect(euclideanDistance(v, v)).toBeCloseTo(0, 5);
  });

  it('3-4-5 right triangle', () => {
    const a = new Float32Array([0, 0, 0]);
    const b = new Float32Array([3, 4, 0]);
    expect(euclideanDistance(a, b)).toBeCloseTo(5, 5);
  });
});
