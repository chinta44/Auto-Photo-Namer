import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Saves a file on the device.
 * - On the web (including when this app is opened as a normal website),
 *   this keeps using the classic <a download> blob trick, which works fine
 *   in real browsers.
 * - Inside the Capacitor native app (Android), the browser download
 *   mechanism and the File System Access API (showDirectoryPicker) are not
 *   available, so instead we write the file to app storage via the
 *   Filesystem plugin and open the native Android share sheet, from which
 *   the user can pick "Save to Files", Google Drive, etc.
 */
export async function saveOrShareFile(
  blob: Blob,
  filename: string,
  mimeType: string
): Promise<{ success: boolean; error?: string }> {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: filename,
        url: writeResult.uri,
        dialogTitle: `${filename} を保存`,
      });

      return { success: true };
    } catch (err: any) {
      // Share sheet dismissed by the user is not a real error
      if (err?.message?.toLowerCase?.().includes('cancel')) {
        return { success: false, error: 'キャンセルされました。' };
      }
      console.error('Native file save/share failed:', err);
      return { success: false, error: `保存に失敗しました: ${err?.message || err}` };
    }
  }

  // Web fallback: classic anchor-download trick
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `保存に失敗しました: ${err?.message || err}` };
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:<mime>;base64," prefix — Filesystem.writeFile wants raw base64
      const base64 = result.substring(result.indexOf(',') + 1);
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
