import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chinta44.autophotonamer',
  appName: 'いちいち面倒なカメラアプリ',
  webDir: 'dist',
  // The frontend (HTML/CSS/JS) is bundled inside the APK, so the app opens
  // instantly without waiting on the network. Only the AI analysis request
  // (fetch to /api/analyze-photo) reaches out to the live Render backend —
  // see src/utils/apiConfig.ts, which points that specific call at
  // https://auto-photo-namer.onrender.com when running natively.
  //
  // NOTE: Because the frontend is now bundled at build time, updating the
  // app's UI/logic requires rebuilding and reinstalling the APK. Only the
  // AI analysis behavior (server-side) can be updated live without a new
  // APK, since that part still talks to the live Render server.
  android: {
    allowMixedContent: false,
  },
};

export default config;
