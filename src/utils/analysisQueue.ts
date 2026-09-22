// Background analysis queue: photos are analyzed one after another while the user keeps shooting.
import { useRef, useSyncExternalStore } from 'react';
import type { AnalysisResult, BatchPhotoItem } from '../types';

export interface AnalyzerHooks {
  onRetry: (info: { attempt: number; max: number; waitMs: number; reason: string }) => void;
  onSlow: () => void;
}
export type Analyzer = (item: BatchPhotoItem, hooks: AnalyzerHooks) => Promise<AnalysisResult>;

export class AnalysisQueue {
  private items: BatchPhotoItem[] = [];
  private listeners = new Set<() => void>();
  private pumping = false;

  /** Set by the app on every render so it always sees the latest API key / pets / naming rules. */
  analyzer: Analyzer | null = null;
  onApiKeyMissing?: () => void;

  getSnapshot = (): BatchPhotoItem[] => this.items;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private set(next: BatchPhotoItem[]) {
    this.items = next;
    this.listeners.forEach((l) => l());
  }

  /** Adds new photos to the queue and starts analyzing them right away, in the background. */
  add(newItems: BatchPhotoItem[]) {
    // An id already in the queue keeps its current progress (e.g. the same batch was
    // handed to add() again) instead of being reset back to "queued".
    const existingIds = new Set(this.items.map((i) => i.id));
    const fresh = newItems.filter((i) => !existingIds.has(i.id));
    if (fresh.length === 0) return;
    this.set([...this.items, ...fresh.map((i) => ({ ...i, status: 'queued' as const, isAnalyzing: false, error: undefined }))]);
    void this.pump();
  }

  has(id: string): boolean {
    return this.items.some((i) => i.id === id);
  }

  remove(id: string) {
    this.set(this.items.filter((i) => i.id !== id));
  }

  clear() {
    this.set([]);
  }

  /** Patch one item (also used by the results screen for file name edits, saved flags...). */
  patch(id: string, patch: Partial<BatchPhotoItem>) {
    if (!this.items.some((i) => i.id === id)) return;
    this.set(this.items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  retry(id: string) {
    const item = this.items.find((i) => i.id === id);
    if (!item || item.status !== 'error') return;
    this.patch(id, { status: 'queued', error: undefined, attempt: undefined });
    void this.pump();
  }

  retryFailed() {
    let any = false;
    this.set(
      this.items.map((i) => {
        if (i.status !== 'error') return i;
        any = true;
        return { ...i, status: 'queued' as const, error: undefined, attempt: undefined };
      })
    );
    if (any) void this.pump();
  }

  private async pump(): Promise<void> {
    if (this.pumping) return;
    this.pumping = true;
    try {
      for (;;) {
        const next = this.items.find((i) => i.status === 'queued');
        if (!next) break;
        await this.processOne(next.id);
      }
    } finally {
      this.pumping = false;
    }
    // Something may have been queued between the last check and clearing the flag.
    if (this.items.some((i) => i.status === 'queued')) void this.pump();
  }

  private async processOne(id: string): Promise<void> {
    const analyzer = this.analyzer;
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    if (!analyzer) {
      this.patch(id, { status: 'error', isAnalyzing: false, error: '解析の準備ができていません。' });
      return;
    }
    this.patch(id, { status: 'analyzing', isAnalyzing: true, error: undefined, attempt: undefined, slow: false });
    try {
      const analysis = await analyzer(item, {
        onRetry: (info) => this.patch(id, { status: 'retrying', attempt: info.attempt }),
        onSlow: () => this.patch(id, { slow: true }),
      });
      if (!this.items.some((i) => i.id === id)) return; // removed while analyzing
      this.patch(id, {
        status: 'done',
        isAnalyzing: false,
        slow: false,
        attempt: undefined,
        analysis,
        selectedFilename: analysis.suggestedFilename,
        error: undefined,
      });
    } catch (e: any) {
      if (!this.items.some((i) => i.id === id)) return;
      this.patch(id, { status: 'error', isAnalyzing: false, slow: false, error: e?.message || 'AI解析エラー' });
      if (e?.code === 'API_KEY_REQUIRED') this.onApiKeyMissing?.();
    }
  }
}

/** React binding: returns the live item list plus the queue object (stable across renders). */
export function useAnalysisQueue(analyzer: Analyzer, onApiKeyMissing?: () => void) {
  const ref = useRef<AnalysisQueue | null>(null);
  if (!ref.current) ref.current = new AnalysisQueue();
  const queue = ref.current;
  queue.analyzer = analyzer;
  queue.onApiKeyMissing = onApiKeyMissing;
  const items = useSyncExternalStore(queue.subscribe, queue.getSnapshot);
  return { queue, items };
}
