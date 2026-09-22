// Render's free plan stops the server after a while without traffic and needs about a minute to
// start again. Pinging /api/health when the app opens (or comes back to the foreground) wakes it
// up in the background so the first photo does not have to wait for it.
import { Capacitor } from '@capacitor/core';
import { apiUrl } from './apiConfig';

let lastPing = 0;
const MIN_INTERVAL_MS = 4 * 60 * 1000;

export function wakeServer(force = false): void {
  if (!Capacitor.isNativePlatform()) return; // the website is served by the same server, so it is already awake
  const now = Date.now();
  if (!force && now - lastPing < MIN_INTERVAL_MS) return;
  lastPing = now;
  fetch(apiUrl('/api/health'), { method: 'GET', cache: 'no-store' }).catch(() => {
    // Best effort only.
  });
}
