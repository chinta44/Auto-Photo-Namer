// Pure helpers shared by the Express server (server.ts) and the React client.
// No DOM / Node-only APIs here, so both sides (and the unit tests) can import it.
import type { AnalysisResult, PhotoCategory } from '../types';

export const VALID_CATEGORIES: PhotoCategory[] = ['receipt', 'pet', 'product', 'document', 'food', 'other'];

const CATEGORY_LABELS: Record<PhotoCategory, string> = {
  receipt: '領収書',
  pet: 'ペット',
  product: '商品・物品',
  document: '書類・メモ',
  food: '料理・グルメ',
  other: '風景・その他',
};

const MAX_FILENAME_BYTES = 200; // Android/ext4 limit is 255 bytes; keep headroom for "_2" style suffixes.

/** Truncate a string so its UTF-8 encoding is at most maxBytes (never cuts a character in half). */
export function truncateUtf8(text: string, maxBytes: number): string {
  let bytes = 0;
  let out = '';
  for (const ch of text) {
    const size = ch.codePointAt(0)! <= 0x7f ? 1 : ch.codePointAt(0)! <= 0x7ff ? 2 : ch.codePointAt(0)! <= 0xffff ? 3 : 4;
    if (bytes + size > maxBytes) break;
    bytes += size;
    out += ch;
  }
  return out;
}

/**
 * Makes an AI/user supplied file name safe for Android / Windows file systems:
 * replaces characters that are not allowed, trims, limits the length and makes sure
 * the name ends in .jpg / .jpeg / .png.
 */
export function sanitizeFilename(name: unknown, fallback = 'photo.jpg'): string {
  let s = typeof name === 'string' ? name : '';
  s = s.replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, '_');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/_{2,}/g, '_');
  s = s.replace(/^\.+/, '').replace(/[. ]+$/, '');

  // Drop a known non-jpg/png image extension so we do not end up with "x.webp.jpg".
  s = s.replace(/\.(webp|heic|heif|gif|bmp|tiff?)$/i, '');

  let ext = '.jpg';
  const m = s.match(/\.(jpe?g|png)$/i);
  if (m) {
    ext = m[0].toLowerCase();
    s = s.slice(0, -m[0].length);
  }
  s = s.replace(/[. ]+$/, '');
  if (!s) return fallback;
  s = truncateUtf8(s, MAX_FILENAME_BYTES - ext.length);
  return `${s}${ext}`;
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
}

/** Coerces whatever the model returned into a well-formed AnalysisResult (never throws). */
export function normalizeAnalysis(raw: any): AnalysisResult {
  const r = raw && typeof raw === 'object' ? raw : {};
  const category: PhotoCategory = VALID_CATEGORIES.includes(r.category) ? r.category : 'other';
  const details = r.details && typeof r.details === 'object' && !Array.isArray(r.details) ? { ...r.details } : {};
  if (details.receiptItems !== undefined && !Array.isArray(details.receiptItems)) {
    details.receiptItems = typeof details.receiptItems === 'string' ? [details.receiptItems] : [];
  }
  if (Array.isArray(details.receiptItems)) {
    details.receiptItems = details.receiptItems.filter((x: unknown) => typeof x === 'string' && x.trim() !== '');
  }
  const alternativeNames: string[] = Array.isArray(r.alternativeNames)
    ? r.alternativeNames.filter((x: unknown) => typeof x === 'string' && x.trim() !== '').map((x: string) => sanitizeFilename(x))
    : [];
  let confidence = Number(r.confidence);
  if (!Number.isFinite(confidence)) confidence = 0.5;
  confidence = Math.min(1, Math.max(0, confidence));

  return {
    category,
    categoryLabel: asString(r.categoryLabel) ?? CATEGORY_LABELS[category],
    detectedTitle: asString(r.detectedTitle) ?? asString(details.restaurantName) ?? '不明',
    suggestedFilename: sanitizeFilename(r.suggestedFilename),
    confidence,
    details,
    alternativeNames,
    explanation: asString(r.explanation) ?? '',
  } as AnalysisResult;
}

export interface PhotoDate {
  compact: string; // 20260921
  hyphen: string; // 2026-09-21
  year: number;
  month: string; // '09'
  day: string; // '21'
  isCaptured: boolean; // true when the date comes from the photo, false when it is "today"
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * The date that goes into file names.
 * If the client sent a plausible capture date ("YYYY-MM-DD" or "YYYYMMDD") use it,
 * otherwise fall back to today's date in the given time zone (JST by default).
 */
export function resolvePhotoDate(capturedDate: unknown, now: Date = new Date(), timeZone = 'Asia/Tokyo'): PhotoDate {
  const today = new Date(now.toLocaleString('en-US', { timeZone }));
  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1;
  const todayD = today.getDate();

  if (typeof capturedDate === 'string') {
    const m = capturedDate.trim().match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      const probe = new Date(Date.UTC(y, mo - 1, d));
      const validCalendarDate =
        probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d;
      const tomorrow = Date.UTC(todayY, todayM - 1, todayD + 1);
      if (validCalendarDate && y >= 1990 && probe.getTime() <= tomorrow) {
        return { compact: `${y}${pad2(mo)}${pad2(d)}`, hyphen: `${y}-${pad2(mo)}-${pad2(d)}`, year: y, month: pad2(mo), day: pad2(d), isCaptured: true };
      }
    }
  }
  return {
    compact: `${todayY}${pad2(todayM)}${pad2(todayD)}`,
    hyphen: `${todayY}-${pad2(todayM)}-${pad2(todayD)}`,
    year: todayY,
    month: pad2(todayM),
    day: pad2(todayD),
    isCaptured: false,
  };
}

/** Maps an error thrown by the Gemini SDK to an HTTP status + client-facing code/message. */
export function mapGeminiError(err: any): { status: number; error: string; message: string; retryAfterSec?: number } {
  const rawMsg = String(err?.message ?? '');
  const sdkStatus = Number(err?.status ?? err?.code);
  const lower = rawMsg.toLowerCase();

  if (lower.includes('api key not valid') || lower.includes('api_key_invalid') || sdkStatus === 401 || sdkStatus === 403) {
    return {
      status: 401,
      error: 'API_KEY_INVALID',
      message: 'Gemini APIキーが無効か、権限がありません。キー設定でAPIキーを確認してください。',
    };
  }
  if (sdkStatus === 429 || lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('rate limit')) {
    const m = rawMsg.match(/retry(?: in|Delay"?:?\s*")\s*([0-9.]+)\s*s/i);
    return {
      status: 429,
      error: 'RATE_LIMITED',
      message: 'Gemini APIの利用上限（1分あたり/1日あたり）に達しました。少し待ってから自動で再試行します。',
      retryAfterSec: m ? Math.min(120, Math.ceil(Number(m[1]))) : undefined,
    };
  }
  if (sdkStatus === 503 || sdkStatus === 502 || sdkStatus === 504 || lower.includes('overloaded') || lower.includes('unavailable')) {
    return { status: 503, error: 'MODEL_UNAVAILABLE', message: 'AIモデルが混み合っています。少し待ってから自動で再試行します。' };
  }
  if (sdkStatus === 400) {
    return { status: 400, error: 'BAD_REQUEST', message: `AIに送信できない画像またはリクエストでした: ${rawMsg}` };
  }
  return { status: 500, error: 'ANALYSIS_FAILED', message: `AI画像の分析中にエラーが発生しました: ${rawMsg || 'モデル通信エラー'}` };
}
