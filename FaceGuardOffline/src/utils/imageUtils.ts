export function float32ArrayToBase64(arr: Float32Array): string {
  const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  return buf.toString('base64');
}

export function base64ToFloat32Array(b64: string): Float32Array {
  const buf = Buffer.from(b64, 'base64');
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

export function uint8ArrayToBase64(arr: Uint8Array): string {
  return Buffer.from(arr).toString('base64');
}

export function base64ToUint8Array(b64: string): Uint8Array {
  return Buffer.from(b64, 'base64');
}

export function rgbToYuv(
  r: number,
  g: number,
  b: number,
): { y: number; u: number; v: number } {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const u = -0.14713 * r - 0.28886 * g + 0.436 * b;
  const v = 0.615 * r - 0.51499 * g - 0.10001 * b;
  return { y, u, v };
}

export function yuvToRgb(
  y: number,
  u: number,
  v: number,
): { r: number; g: number; b: number } {
  const clamp = (x: number): number => Math.max(0, Math.min(255, Math.round(x)));
  const r = clamp(y + 1.13983 * v);
  const g = clamp(y - 0.39465 * u - 0.5806 * v);
  const b = clamp(y + 2.03211 * u);
  return { r, g, b };
}

export function sha256Hash(data: Uint8Array): string {
  let h1 = 0x9dc5811c;
  let h2 = 0x4b4d30d4;
  for (let i = 0; i < data.length; i++) {
    h1 = Math.imul(h1 ^ data[i], 0x9e3779b9);
    h2 = Math.imul(h2 ^ data[i], 0x85ebca77);
    h1 = ((h1 << 13) | (h1 >>> 19)) ^ h2;
    h2 = ((h2 << 11) | (h2 >>> 21)) ^ h1;
  }
  h1 ^= data.length;
  h2 ^= data.length;
  h1 += h2;
  h2 += h1;
  return (
    (h1 >>> 0).toString(16).padStart(8, '0') +
    (h2 >>> 0).toString(16).padStart(8, '0') +
    ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0') +
    ((h1 * h2) >>> 0).toString(16).padStart(8, '0')
  );
}
