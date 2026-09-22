// Tiny toast event bus so non-React code (file saving etc.) can show a message.
export type ToastKind = 'success' | 'info' | 'warn' | 'error';
export interface ToastMessage {
  id: number;
  message: string;
  kind: ToastKind;
  durationMs: number;
}

type Listener = (t: ToastMessage) => void;
const listeners = new Set<Listener>();
let nextId = 1;

export function showToast(message: string, kind: ToastKind = 'info', durationMs = 4000): void {
  const toast: ToastMessage = { id: nextId++, message, kind, durationMs };
  listeners.forEach((l) => l(toast));
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
