// On-device document scanning: finds the four corners of a receipt / paper in a photo and
// straightens it (perspective correction). No network, no dependencies - just canvas + math.

export interface Point {
  x: number;
  y: number;
}
/** Corners in order: top-left, top-right, bottom-right, bottom-left. Coordinates are 0..1 (fractions of the image). */
export type Quad = [Point, Point, Point, Point];

export const DETECT_MAX_SIDE = 480;

/** A rectangle slightly inside the image - the starting point for manual adjustment. */
export function defaultQuad(inset = 0.06): Quad {
  return [
    { x: inset, y: inset },
    { x: 1 - inset, y: inset },
    { x: 1 - inset, y: 1 - inset },
    { x: inset, y: 1 - inset },
  ];
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

function boxBlur(src: Uint8Array | Uint8ClampedArray, w: number, h: number, radius: number): Uint8Array {
  const tmp = new Float32Array(w * h);
  const out = new Uint8Array(w * h);
  const size = radius * 2 + 1;
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = -radius; x <= radius; x++) sum += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = sum / size;
      sum += src[y * w + Math.min(w - 1, x + radius + 1)] - src[y * w + Math.max(0, x - radius)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = Math.round(sum / size);
      sum += tmp[Math.min(h - 1, y + radius + 1) * w + x] - tmp[Math.max(0, y - radius) * w + x];
    }
  }
  return out;
}

function otsuThreshold(gray: Uint8Array): number {
  const hist = new Float64Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let bestVar = -1;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > bestVar) {
      bestVar = between;
      best = t;
    }
  }
  return best;
}

/** 3x3 erosion followed by dilation (removes specks and thin bridges). */
function openMask(mask: Uint8Array, w: number, h: number): Uint8Array {
  const eroded = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (
        mask[i] && mask[i - 1] && mask[i + 1] && mask[i - w] && mask[i + w] &&
        mask[i - w - 1] && mask[i - w + 1] && mask[i + w - 1] && mask[i + w + 1]
      ) {
        eroded[i] = 1;
      }
    }
  }
  const out = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (
        eroded[i] || eroded[i - 1] || eroded[i + 1] || eroded[i - w] || eroded[i + w] ||
        eroded[i - w - 1] || eroded[i - w + 1] || eroded[i + w - 1] || eroded[i + w + 1]
      ) {
        out[i] = 1;
      }
    }
  }
  return out;
}

/** Largest 4-connected component. Returns its pixel indices and bounding box. */
function largestComponent(mask: Uint8Array, w: number, h: number) {
  const label = new Int32Array(w * h);
  const stack = new Int32Array(w * h);
  let bestId = 0;
  let bestSize = 0;
  let nextId = 0;
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || label[start]) continue;
    nextId++;
    let sp = 0;
    let size = 0;
    stack[sp++] = start;
    label[start] = nextId;
    while (sp > 0) {
      const i = stack[--sp];
      size++;
      const x = i % w;
      const y = (i / w) | 0;
      if (x > 0 && mask[i - 1] && !label[i - 1]) { label[i - 1] = nextId; stack[sp++] = i - 1; }
      if (x < w - 1 && mask[i + 1] && !label[i + 1]) { label[i + 1] = nextId; stack[sp++] = i + 1; }
      if (y > 0 && mask[i - w] && !label[i - w]) { label[i - w] = nextId; stack[sp++] = i - w; }
      if (y < h - 1 && mask[i + w] && !label[i + w]) { label[i + w] = nextId; stack[sp++] = i + w; }
    }
    if (size > bestSize) {
      bestSize = size;
      bestId = nextId;
    }
  }
  if (!bestId) return null;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  const boundary: Point[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (label[i] !== bestId) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      const edge =
        x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
        label[i - 1] !== bestId || label[i + 1] !== bestId || label[i - w] !== bestId || label[i + w] !== bestId;
      if (edge) boundary.push({ x, y });
    }
  }
  return { size: bestSize, minX, minY, maxX, maxY, boundary };
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function convexHull(points: Point[]): Point[] {
  const pts = points.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  if (pts.length < 3) return pts;
  const lower: Point[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Point[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function polygonArea(poly: Point[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Ramer-Douglas-Peucker on an open chain, returns the kept points (endpoints included). */
function rdp(chain: Point[], eps: number): Point[] {
  if (chain.length < 3) return chain.slice();
  let maxD = 0;
  let idx = 0;
  const a = chain[0];
  const b = chain[chain.length - 1];
  for (let i = 1; i < chain.length - 1; i++) {
    const d = distToSegment(chain[i], a, b);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [a, b];
  const left = rdp(chain.slice(0, idx + 1), eps);
  const right = rdp(chain.slice(idx), eps);
  return left.slice(0, -1).concat(right);
}

/** Simplifies a closed convex polygon to exactly 4 vertices (or null if that is not possible). */
function approximateToQuad(hull: Point[]): Point[] | null {
  if (hull.length < 4) return null;
  // Split the closed polygon at the two mutually farthest vertices, simplify both halves.
  let bi = 0, bj = 1, best = -1;
  for (let i = 0; i < hull.length; i++) {
    for (let j = i + 1; j < hull.length; j++) {
      const d = (hull[i].x - hull[j].x) ** 2 + (hull[i].y - hull[j].y) ** 2;
      if (d > best) { best = d; bi = i; bj = j; }
    }
  }
  const half1: Point[] = [];
  for (let k = bi; ; k = (k + 1) % hull.length) { half1.push(hull[k]); if (k === bj) break; }
  const half2: Point[] = [];
  for (let k = bj; ; k = (k + 1) % hull.length) { half2.push(hull[k]); if (k === bi) break; }

  let lo = 0.1;
  let hi = Math.sqrt(best);
  let result: Point[] | null = null;
  for (let iter = 0; iter < 40; iter++) {
    const eps = (lo + hi) / 2;
    const poly = rdp(half1, eps).slice(0, -1).concat(rdp(half2, eps).slice(0, -1));
    if (poly.length === 4) { result = poly; hi = eps; }
    else if (poly.length > 4) lo = eps;
    else hi = eps;
    if (hi - lo < 0.05) break;
  }
  return result;
}

function orderClockwiseFromTopLeft(quad: Point[]): Point[] {
  const cx = quad.reduce((s, p) => s + p.x, 0) / 4;
  const cy = quad.reduce((s, p) => s + p.y, 0) / 4;
  const sorted = quad.slice().sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  // angles ascending in image coordinates (y down) = clockwise on screen
  let start = 0;
  let minSum = Infinity;
  sorted.forEach((p, i) => {
    if (p.x + p.y < minSum) { minSum = p.x + p.y; start = i; }
  });
  return [0, 1, 2, 3].map((k) => sorted[(start + k) % 4]);
}

function interiorAnglesOk(q: Point[], minDeg: number, maxDeg: number): boolean {
  for (let i = 0; i < 4; i++) {
    const p = q[(i + 3) % 4];
    const c = q[i];
    const n = q[(i + 1) % 4];
    const v1x = p.x - c.x, v1y = p.y - c.y, v2x = n.x - c.x, v2y = n.y - c.y;
    const cos = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) || 1);
    const deg = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
    if (deg < minDeg || deg > maxDeg) return false;
  }
  return true;
}

function tryDetect(blurred: Uint8Array, w: number, h: number, brightForeground: boolean): { quad: Point[]; score: number } | null {
  const t = otsuThreshold(blurred);
  const raw = new Uint8Array(w * h);
  let fg = 0;
  for (let i = 0; i < raw.length; i++) {
    const on = brightForeground ? blurred[i] > t : blurred[i] <= t;
    if (on) { raw[i] = 1; fg++; }
  }
  const frac = fg / raw.length;
  if (frac < 0.1 || frac > 0.9) return null;

  const comp = largestComponent(openMask(raw, w, h), w, h);
  if (!comp) return null;
  const imgArea = w * h;
  if (comp.size < imgArea * 0.1) return null;
  // A component touching all four image borders is the background, not a document.
  if (comp.minX <= 1 && comp.minY <= 1 && comp.maxX >= w - 2 && comp.maxY >= h - 2 && comp.size > imgArea * 0.6) return null;
  // A component spanning the full width or full height (e.g. one half of a smooth background
  // gradient split by the threshold) is not a document sitting on a surface either.
  const spansFullWidth = comp.minX <= 1 && comp.maxX >= w - 2;
  const spansFullHeight = comp.minY <= 1 && comp.maxY >= h - 2;
  if (spansFullWidth || spansFullHeight) return null;

  const hull = convexHull(comp.boundary);
  const approx = approximateToQuad(hull);
  if (!approx) return null;
  const quad = orderClockwiseFromTopLeft(approx);

  const quadArea = polygonArea(quad);
  const hullArea = polygonArea(hull);
  if (quadArea < imgArea * 0.12 || quadArea > imgArea * 0.97) return null;
  if (hullArea === 0 || quadArea / hullArea < 0.88) return null;
  if (!interiorAnglesOk(quad, 50, 130)) return null;
  const minSide = Math.min(w, h) * 0.12;
  for (let i = 0; i < 4; i++) {
    if (Math.hypot(quad[i].x - quad[(i + 1) % 4].x, quad[i].y - quad[(i + 1) % 4].y) < minSide) return null;
  }
  // how well the component fills the quad (holes from text are fine, a wall behind the paper is not)
  const fill = comp.size / quadArea;
  if (fill < 0.55) return null;
  return { quad, score: quadArea * Math.min(1, fill) };
}

/**
 * Finds the document in a grayscale image. Returns corners as fractions of the image size, or null
 * when nothing that looks like a sheet of paper stands out from its surroundings.
 */
export function detectDocumentQuadFromGray(gray: Uint8Array | Uint8ClampedArray, w: number, h: number): Quad | null {
  const blurred = boxBlur(boxBlur(gray, w, h, 2), w, h, 2);
  const candidates = [tryDetect(blurred, w, h, true), tryDetect(blurred, w, h, false)].filter(Boolean) as { quad: Point[]; score: number }[];
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  const q = candidates[0].quad;
  return q.map((p) => ({ x: Math.min(1, Math.max(0, p.x / (w - 1))), y: Math.min(1, Math.max(0, p.y / (h - 1))) })) as Quad;
}

// ---------------------------------------------------------------------------
// Perspective correction
// ---------------------------------------------------------------------------

/** Solves the 3x3 homography that maps the unit rectangle (0,0)-(w,h) onto the given quad. */
export function homographyFromRect(quadPx: Point[], outW: number, outH: number): number[] {
  const src = [
    [0, 0],
    [outW, 0],
    [outW, outH],
    [0, outH],
  ];
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const { x: X, y: Y } = quadPx[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
    b.push(Y);
  }
  // Gaussian elimination with partial pivoting
  const n = 8;
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    [A[col], A[piv]] = [A[piv], A[col]];
    [b[col], b[piv]] = [b[piv], b[col]];
    const d = A[col][col] || 1e-12;
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / d;
      for (let c = col; c < n; c++) A[r][c] -= f * A[col][c];
      b[r] -= f * b[col];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let c = r + 1; c < n; c++) s -= A[r][c] * x[c];
    x[r] = s / (A[r][r] || 1e-12);
  }
  return [...x, 1];
}

export function outputSizeForQuad(quadPx: Point[], maxSide: number): { width: number; height: number } {
  const d = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  let w = Math.max(d(quadPx[0], quadPx[1]), d(quadPx[3], quadPx[2]));
  let h = Math.max(d(quadPx[0], quadPx[3]), d(quadPx[1], quadPx[2]));
  const scale = Math.min(1, maxSide / Math.max(w, h));
  w = Math.max(32, Math.round(w * scale));
  h = Math.max(32, Math.round(h * scale));
  return { width: w, height: h };
}

/** Inverse-maps every output pixel into the source image (bilinear sampling). Pure function - easy to test. */
export function warpPixels(
  src: { data: Uint8ClampedArray; width: number; height: number },
  quadPx: Point[],
  outW: number,
  outH: number
): Uint8ClampedArray {
  const H = homographyFromRect(quadPx, outW, outH);
  const out = new Uint8ClampedArray(outW * outH * 4);
  const { data, width: sw, height: sh } = src;
  for (let v = 0; v < outH; v++) {
    for (let u = 0; u < outW; u++) {
      const px = u + 0.5;
      const py = v + 0.5;
      const wz = H[6] * px + H[7] * py + 1;
      const sx = (H[0] * px + H[1] * py + H[2]) / wz - 0.5;
      const sy = (H[3] * px + H[4] * py + H[5]) / wz - 0.5;
      const x0 = Math.max(0, Math.min(sw - 1, Math.floor(sx)));
      const y0 = Math.max(0, Math.min(sh - 1, Math.floor(sy)));
      const x1 = Math.min(sw - 1, x0 + 1);
      const y1 = Math.min(sh - 1, y0 + 1);
      const fx = Math.max(0, Math.min(1, sx - x0));
      const fy = Math.max(0, Math.min(1, sy - y0));
      const o = (v * outW + u) * 4;
      const i00 = (y0 * sw + x0) * 4;
      const i10 = (y0 * sw + x1) * 4;
      const i01 = (y1 * sw + x0) * 4;
      const i11 = (y1 * sw + x1) * 4;
      for (let c = 0; c < 3; c++) {
        out[o + c] =
          data[i00 + c] * (1 - fx) * (1 - fy) + data[i10 + c] * fx * (1 - fy) + data[i01 + c] * (1 - fx) * fy + data[i11 + c] * fx * fy;
      }
      out[o + 3] = 255;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Browser glue (canvas)
// ---------------------------------------------------------------------------

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('画像を読み込めませんでした。'));
    img.src = dataUrl;
  });
}

/** Detects the document in a photo. Resolves to null when none is found (never rejects for "not found"). */
export async function detectDocumentQuad(dataUrl: string): Promise<Quad | null> {
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, DETECT_MAX_SIDE / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const w = Math.max(16, Math.round((img.naturalWidth || img.width) * scale));
  const h = Math.max(16, Math.round((img.naturalHeight || img.height) * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  const rgba = ctx.getImageData(0, 0, w, h).data;
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = Math.round(0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2]);
  }
  return detectDocumentQuadFromGray(gray, w, h);
}

/** Cuts out the quad and straightens it into an upright rectangle. Returns a JPEG data URL. */
export async function warpToRectangle(dataUrl: string, quad: Quad, maxOutputSide = 2000, quality = 0.92): Promise<string> {
  const img = await loadImage(dataUrl);
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  // Bound memory: never work on more than ~3200px on the long side.
  const srcScale = Math.min(1, 3200 / Math.max(natW, natH));
  const sw = Math.max(1, Math.round(natW * srcScale));
  const sh = Math.max(1, Math.round(natH * srcScale));
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = sw;
  srcCanvas.height = sh;
  const sctx = srcCanvas.getContext('2d');
  if (!sctx) throw new Error('canvas is not available');
  sctx.drawImage(img, 0, 0, sw, sh);
  const src = sctx.getImageData(0, 0, sw, sh);

  const quadPx = quad.map((p) => ({ x: p.x * (sw - 1), y: p.y * (sh - 1) }));
  const { width, height } = outputSizeForQuad(quadPx, maxOutputSide);
  const pixels = warpPixels(src, quadPx, width, height);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const octx = outCanvas.getContext('2d');
  if (!octx) throw new Error('canvas is not available');
  const outData = octx.createImageData(width, height);
  outData.data.set(pixels);
  octx.putImageData(outData, 0, 0);
  return outCanvas.toDataURL('image/jpeg', quality);
}

/** True when the four points form a usable (convex, non-degenerate) quadrilateral - used by the crop UI. */
export function isUsableQuad(q: Quad, minAreaFraction = 0.02): boolean {
  const area = polygonArea(q);
  if (area < minAreaFraction) return false;
  for (let i = 0; i < 4; i++) {
    const a = q[i], b = q[(i + 1) % 4], c = q[(i + 2) % 4];
    if (cross(a, b, c) <= 0) return false; // must turn the same way at every corner (clockwise on screen)
  }
  return true;
}
