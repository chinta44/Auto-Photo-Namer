// One place that talks to /api/analyze-photo: image preparation, timeouts, automatic retries.
import type { AnalysisResult, FocusPoint, LocationData, NamingRuleConfig, PetProfile } from '../types';
import { apiUrl } from './apiConfig';
import { convertToJpegBase64, createAnalysisResizedCopy } from './imageUtils';
import { normalizeAnalysis } from '../shared/analysisShared';

export const MAX_ATTEMPTS = 4;
const BACKOFF_MS = [2000, 6000, 15000]; // waits before attempt 2, 3, 4 (network / 5xx errors)
const RATE_LIMIT_BACKOFF_MS = [15000, 30000, 45000]; // waits for HTTP 429 (Gemini per-minute limits)
const REQUEST_TIMEOUT_MS = 90000; // covers a Render free-plan cold start (about 1 minute)
const SLOW_NOTICE_MS = 8000;

export class AnalyzeError extends Error {
  status?: number;
  code?: string;
  retryable: boolean;
  retryAfterMs?: number;
  constructor(message: string, opts: { status?: number; code?: string; retryable: boolean; retryAfterMs?: number }) {
    super(message);
    this.name = 'AnalyzeError';
    this.status = opts.status;
    this.code = opts.code;
    this.retryable = opts.retryable;
    this.retryAfterMs = opts.retryAfterMs;
  }
}

export interface RetryInfo {
  attempt: number; // the attempt that is about to start (2..MAX_ATTEMPTS)
  max: number;
  waitMs: number;
  reason: string;
}

export interface AnalyzeParams {
  dataUrl: string;
  petProfiles: PetProfile[];
  namingConfig: NamingRuleConfig;
  userApiKey: string;
  focusPoint?: FocusPoint;
  location?: LocationData | null;
  /** "YYYY-MM-DD" - the photo's own date (imported photos). Omit for "today". */
  capturedDate?: string | null;
  onConverted?: (fullDataUrl: string) => void;
  onRetry?: (info: RetryInfo) => void;
  /** Called once if the server has not answered after a few seconds (e.g. waking up). */
  onSlow?: () => void;
  signal?: AbortSignal;
  // Injection points for tests
  fetchFn?: typeof fetch;
  sleepFn?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function requestOnce(url: string, init: RequestInit, fetchFn: typeof fetch, outerSignal?: AbortSignal): Promise<AnalysisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  outerSignal?.addEventListener('abort', onOuterAbort);
  try {
    let res: Response;
    try {
      res = await fetchFn(url, { ...init, signal: controller.signal });
    } catch (e: any) {
      if (outerSignal?.aborted) throw new AnalyzeError('解析をキャンセルしました。', { retryable: false, code: 'CANCELLED' });
      const timedOut = e?.name === 'AbortError';
      throw new AnalyzeError(
        timedOut ? 'サーバーの応答がありません（タイムアウト）。' : 'サーバーに接続できません。通信状況を確認してください。',
        { retryable: true, code: timedOut ? 'TIMEOUT' : 'NETWORK' }
      );
    }

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // non-JSON body (e.g. a proxy error page)
    }

    if (!res.ok) {
      const retryHeader = Number(res.headers?.get?.('Retry-After'));
      const retryAfterSec = Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : Number(data?.retryAfterSec);
      throw new AnalyzeError(data?.message || `サーバーエラーが発生しました (${res.status})`, {
        status: res.status,
        code: data?.error,
        retryable: isRetryableStatus(res.status),
        retryAfterMs: Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? Math.min(120, retryAfterSec) * 1000 : undefined,
      });
    }
    if (!data || typeof data.suggestedFilename !== 'string') {
      throw new AnalyzeError('AIの応答を読み取れませんでした。', { status: res.status, code: 'BAD_RESPONSE', retryable: true });
    }
    return normalizeAnalysis(data);
  } finally {
    clearTimeout(timeout);
    outerSignal?.removeEventListener('abort', onOuterAbort);
  }
}

/** Analyzes one photo. Retries automatically on network errors, timeouts, HTTP 429 and 5xx. */
export async function analyzePhoto(p: AnalyzeParams): Promise<{ analysis: AnalysisResult; fullDataUrl: string }> {
  const fetchFn = p.fetchFn ?? fetch;
  const sleep = p.sleepFn ?? defaultSleep;

  const converted = await convertToJpegBase64(p.dataUrl);
  p.onConverted?.(converted.fullDataUrl);
  // A downscaled copy is sent to Gemini for speed; the full-resolution photo is what gets saved.
  const forAnalysis = await createAnalysisResizedCopy(converted.fullDataUrl);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (p.userApiKey) headers['x-gemini-api-key'] = p.userApiKey;
  const body = JSON.stringify({
    imageBase64: forAnalysis.base64Data,
    mimeType: forAnalysis.mimeType,
    petProfiles: p.petProfiles,
    namingConfig: p.namingConfig,
    focusPoint: p.focusPoint,
    location: p.location,
    capturedDate: p.capturedDate || undefined,
    customApiKey: p.userApiKey,
  });

  const slowTimer = p.onSlow ? setTimeout(() => p.onSlow?.(), SLOW_NOTICE_MS) : null;
  try {
    for (let attempt = 1; ; attempt++) {
      try {
        const analysis = await requestOnce(apiUrl('/api/analyze-photo'), { method: 'POST', headers, body }, fetchFn, p.signal);
        return { analysis, fullDataUrl: converted.fullDataUrl };
      } catch (e: any) {
        const err: AnalyzeError =
          e instanceof AnalyzeError ? e : new AnalyzeError(e?.message || 'AI解析エラー', { retryable: false });
        if (!err.retryable || attempt >= MAX_ATTEMPTS || p.signal?.aborted) throw err;
        const table = err.status === 429 ? RATE_LIMIT_BACKOFF_MS : BACKOFF_MS;
        const waitMs = err.retryAfterMs ?? table[Math.min(attempt - 1, table.length - 1)];
        p.onRetry?.({ attempt: attempt + 1, max: MAX_ATTEMPTS, waitMs, reason: err.message });
        await sleep(waitMs);
      }
    }
  } finally {
    if (slowTimer) clearTimeout(slowTimer);
  }
}
