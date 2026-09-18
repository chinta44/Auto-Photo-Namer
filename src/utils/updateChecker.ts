import { Capacitor } from '@capacitor/core';

// Keep this in sync with the version string shown in Header.tsx / index.html
// whenever you bump the app version.
export const CURRENT_APP_VERSION = '1.7.0';

const GITHUB_REPO = 'chinta44/Auto-Photo-Namer';

export interface UpdateInfo {
  available: boolean;
  latestVersion?: string;
  downloadUrl?: string;
  releaseNotes?: string;
  releaseUrl?: string;
}

function parseVersion(v: string): number[] {
  return v
    .replace(/^v/i, '')
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
}

function isNewer(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

/**
 * Checks GitHub Releases for a newer version than what's currently
 * installed. Only meaningful for the native Android app — the web version
 * is always up to date via Render's own deployment, so this is a no-op there.
 */
export async function checkForAppUpdate(): Promise<UpdateInfo> {
  if (!Capacitor.isNativePlatform()) {
    return { available: false };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return { available: false };

    const data = await res.json();
    const latestVersion = String(data.tag_name || '').replace(/^v/i, '');
    const apkAsset = (data.assets || []).find((a: any) => a.name?.toLowerCase().endsWith('.apk'));

    if (latestVersion && apkAsset && isNewer(latestVersion, CURRENT_APP_VERSION)) {
      return {
        available: true,
        latestVersion,
        downloadUrl: apkAsset.browser_download_url,
        releaseNotes: data.body || '',
        releaseUrl: data.html_url,
      };
    }
    return { available: false };
  } catch (err) {
    console.warn('[SmartName][UpdateCheck] Failed to check for updates:', err);
    return { available: false };
  }
}
