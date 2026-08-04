import { Capacitor } from '@capacitor/core';

// When running inside the Capacitor native app (Android), the frontend is
// bundled locally and served from a local app-scheme origin, so relative
// paths like "/api/analyze-photo" don't resolve to the real backend.
// In that case, point requests at the live Render deployment instead.
// When running as a normal website (including on Render itself), relative
// paths already work correctly, so this resolves to an empty string.
export const API_BASE_URL = Capacitor.isNativePlatform()
  ? 'https://auto-photo-namer.onrender.com'
  : '';

export const apiUrl = (path: string): string => `${API_BASE_URL}${path}`;
