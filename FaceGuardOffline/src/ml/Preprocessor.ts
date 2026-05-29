import { BoundingBox } from '../types';
import { rgbToYuv, yuvToRgb } from '../utils/imageUtils';

/**
 * Crops a face region from a frame buffer (RGB packed Uint8Array, row-major).
 * Expands bbox by 20% on each side, clamped to frame bounds.
 * Performs bilinear interpolation for the crop.
 */
export function cropFace(
  frameBuffer: Uint8Array,
  bbox: BoundingBox,
  frameWidth: number,
  frameHeight: number,
): Uint8Array {
  const padX = bbox.width * 0.2;
  const padY = bbox.height * 0.2;

  const x0 = Math.max(0, Math.floor(bbox.x - padX));
  const y0 = Math.max(0, Math.floor(bbox.y - padY));
  const x1 = Math.min(frameWidth - 1, Math.ceil(bbox.x + bbox.width + padX));
  const y1 = Math.min(frameHeight - 1, Math.ceil(bbox.y + bbox.height + padY));

  const cropW = x1 - x0;
  const cropH = y1 - y0;
  const out = new Uint8Array(cropW * cropH * 3);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcX = x0 + x;
      const srcY = y0 + y;
      const srcIdx = (srcY * frameWidth + srcX) * 3;
      const dstIdx = (y * cropW + x) * 3;
      out[dstIdx] = frameBuffer[srcIdx];
      out[dstIdx + 1] = frameBuffer[srcIdx + 1];
      out[dstIdx + 2] = frameBuffer[srcIdx + 2];
    }
  }

  return out;
}

/**
 * Pure JS bilinear interpolation resize.
 * Input: packed RGB Uint8Array (srcW * srcH * 3 bytes)
 * Output: Float32Array (dstW * dstH * 3 floats), values 0..255
 */
export function resizeBilinear(
  src: Uint8Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): Float32Array {
  const out = new Float32Array(dstW * dstH * 3);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const gx = x * xRatio;
      const gy = y * yRatio;

      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const y1 = Math.min(y0 + 1, srcH - 1);

      const dx = gx - x0;
      const dy = gy - y0;

      for (let c = 0; c < 3; c++) {
        const tl = src[(y0 * srcW + x0) * 3 + c];
        const tr = src[(y0 * srcW + x1) * 3 + c];
        const bl = src[(y1 * srcW + x0) * 3 + c];
        const br = src[(y1 * srcW + x1) * 3 + c];

        const top = tl + (tr - tl) * dx;
        const bot = bl + (br - bl) * dx;
        out[(y * dstW + x) * 3 + c] = top + (bot - top) * dy;
      }
    }
  }

  return out;
}

/**
 * CLAHE (Contrast Limited Adaptive Histogram Equalization) on the luminance channel.
 * Input/output: packed RGB Uint8Array (width * height * 3 bytes).
 * Converts to YUV, equalises Y channel with CLAHE, converts back.
 * clipLimit: contrast clip limit (default 2.0)
 * gridSize: number of tiles in each dimension (default 8)
 */
export function claheEqualize(
  pixels: Uint8Array,
  width: number,
  height: number,
  clipLimit: number = 2.0,
  gridSize: number = 8,
): Uint8Array {
  const n = width * height;

  // Extract Y channel
  const yChannel = new Float32Array(n);
  const uChannel = new Float32Array(n);
  const vChannel = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const r = pixels[i * 3];
    const g = pixels[i * 3 + 1];
    const b = pixels[i * 3 + 2];
    const yuv = rgbToYuv(r, g, b);
    yChannel[i] = yuv.y;
    uChannel[i] = yuv.u;
    vChannel[i] = yuv.v;
  }

  // CLAHE on Y channel (0..255 range)
  const tileW = Math.floor(width / gridSize);
  const tileH = Math.floor(height / gridSize);
  const tileArea = tileW * tileH;
  const absClipLimit = Math.max(1, Math.floor(clipLimit * tileArea / 256));

  // Build tile histograms and CDFs
  const cdfs: Float32Array[] = [];
  for (let ty = 0; ty < gridSize; ty++) {
    for (let tx = 0; tx < gridSize; tx++) {
      const hist = new Int32Array(256);
      const startX = tx * tileW;
      const startY = ty * tileH;
      const endX = tx < gridSize - 1 ? startX + tileW : width;
      const endY = ty < gridSize - 1 ? startY + tileH : height;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const yVal = Math.max(0, Math.min(255, Math.round(yChannel[y * width + x])));
          hist[yVal]++;
        }
      }

      // Clip histogram
      let excess = 0;
      for (let i = 0; i < 256; i++) {
        if (hist[i] > absClipLimit) {
          excess += hist[i] - absClipLimit;
          hist[i] = absClipLimit;
        }
      }
      const redistribution = Math.floor(excess / 256);
      for (let i = 0; i < 256; i++) {
        hist[i] += redistribution;
      }

      // Build CDF
      const cdf = new Float32Array(256);
      let cumSum = 0;
      let cdfMin = -1;
      for (let i = 0; i < 256; i++) {
        cumSum += hist[i];
        cdf[i] = cumSum;
        if (cdfMin === -1 && hist[i] > 0) cdfMin = cumSum;
      }
      const actualArea = (endX - startX) * (endY - startY);
      const cdfRange = actualArea - cdfMin;
      for (let i = 0; i < 256; i++) {
        cdf[i] = cdfRange > 0 ? Math.round(((cdf[i] - cdfMin) / cdfRange) * 255) : 0;
      }
      cdfs.push(cdf);
    }
  }

  // Bilinear interpolation between tile CDFs for each pixel
  const equalised = new Float32Array(n);
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const yVal = Math.max(0, Math.min(255, Math.round(yChannel[py * width + px])));

      // Tile coordinates (fractional)
      const tx = (px + 0.5) / tileW - 0.5;
      const ty = (py + 0.5) / tileH - 0.5;

      const tx0 = Math.max(0, Math.floor(tx));
      const ty0 = Math.max(0, Math.floor(ty));
      const tx1 = Math.min(gridSize - 1, tx0 + 1);
      const ty1 = Math.min(gridSize - 1, ty0 + 1);

      const dx = tx - tx0;
      const dy = ty - ty0;

      const cdfTL = cdfs[ty0 * gridSize + tx0][yVal];
      const cdfTR = cdfs[ty0 * gridSize + tx1][yVal];
      const cdfBL = cdfs[ty1 * gridSize + tx0][yVal];
      const cdfBR = cdfs[ty1 * gridSize + tx1][yVal];

      const top = cdfTL + (cdfTR - cdfTL) * dx;
      const bot = cdfBL + (cdfBR - cdfBL) * dx;
      equalised[py * width + px] = top + (bot - top) * dy;
    }
  }

  // Convert back to RGB
  const out = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) {
    const rgb = yuvToRgb(equalised[i], uChannel[i], vChannel[i]);
    out[i * 3] = rgb.r;
    out[i * 3 + 1] = rgb.g;
    out[i * 3 + 2] = rgb.b;
  }
  return out;
}

/**
 * Normalise Float32Array pixel values from [0,255] to [-1, 1].
 * Used for MobileFaceNet input.
 */
export function normalizeForMobileFaceNet(pixels: Float32Array): Float32Array {
  const out = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    out[i] = pixels[i] / 127.5 - 1.0;
  }
  return out;
}

/**
 * Normalise Float32Array pixel values from [0,255] to [-1, 1].
 * Used for BlazeFace input.
 */
export function normalizeForBlazeFace(pixels: Float32Array): Float32Array {
  const out = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    out[i] = pixels[i] / 127.5 - 1.0;
  }
  return out;
}

/**
 * Prepare a face crop for BlazeFace: crop → resize 128×128 → normalize.
 */
export function prepareFaceForBlazeFace(
  frameBuffer: Uint8Array,
  bbox: BoundingBox,
  frameWidth: number,
  frameHeight: number,
): Float32Array {
  const padX = bbox.width * 0.2;
  const padY = bbox.height * 0.2;
  const x0 = Math.max(0, Math.floor(bbox.x - padX));
  const y0 = Math.max(0, Math.floor(bbox.y - padY));
  const x1 = Math.min(frameWidth - 1, Math.ceil(bbox.x + bbox.width + padX));
  const y1 = Math.min(frameHeight - 1, Math.ceil(bbox.y + bbox.height + padY));
  const cw = x1 - x0;
  const ch = y1 - y0;

  const cropped = cropFace(frameBuffer, bbox, frameWidth, frameHeight);
  const resized = resizeBilinear(cropped, cw, ch, 128, 128);
  return normalizeForBlazeFace(resized);
}

/**
 * Prepare a face crop for MobileFaceNet: crop → CLAHE → resize 112×112 → normalize.
 */
export function prepareFaceForMobileFaceNet(
  frameBuffer: Uint8Array,
  bbox: BoundingBox,
  frameWidth: number,
  frameHeight: number,
): Float32Array {
  const padX = bbox.width * 0.2;
  const padY = bbox.height * 0.2;
  const x0 = Math.max(0, Math.floor(bbox.x - padX));
  const y0 = Math.max(0, Math.floor(bbox.y - padY));
  const x1 = Math.min(frameWidth - 1, Math.ceil(bbox.x + bbox.width + padX));
  const y1 = Math.min(frameHeight - 1, Math.ceil(bbox.y + bbox.height + padY));
  const cw = x1 - x0;
  const ch = y1 - y0;

  const cropped = cropFace(frameBuffer, bbox, frameWidth, frameHeight);
  const equalised = claheEqualize(cropped, cw, ch);
  const resized = resizeBilinear(equalised, cw, ch, 112, 112);
  return normalizeForMobileFaceNet(resized);
}

/**
 * Normalise Float32Array pixel values from [0,255] to [0, 1].
 * Used for MiniFASNet (facenox/face-antispoof-onnx model spec: pixels ÷ 255, RGB).
 */
export function normalizeForMiniFASNet(pixels: Float32Array): Float32Array {
  const out = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    out[i] = pixels[i] / 255.0;
  }
  return out;
}

/**
 * Prepare a face crop for MiniFASNet: crop → resize 128×128 → normalize to [0,1].
 * Model: facenox/face-antispoof-onnx (MiniFASNetV2-SE, 128×128 RGB input, pixels ÷ 255).
 */
export function prepareFaceForMiniFASNet(
  frameBuffer: Uint8Array,
  bbox: BoundingBox,
  frameWidth: number,
  frameHeight: number,
): Float32Array {
  const padX = bbox.width * 0.2;
  const padY = bbox.height * 0.2;
  const x0 = Math.max(0, Math.floor(bbox.x - padX));
  const y0 = Math.max(0, Math.floor(bbox.y - padY));
  const x1 = Math.min(frameWidth - 1, Math.ceil(bbox.x + bbox.width + padX));
  const y1 = Math.min(frameHeight - 1, Math.ceil(bbox.y + bbox.height + padY));
  const cw = x1 - x0;
  const ch = y1 - y0;

  const cropped = cropFace(frameBuffer, bbox, frameWidth, frameHeight);
  const resized = resizeBilinear(cropped, cw, ch, 128, 128);
  return normalizeForMiniFASNet(resized);
}
