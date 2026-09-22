// Android only: lets the user pick a folder once (Storage Access Framework); afterwards files are
// written straight into it without the share sheet. The native side is
// android/app/src/main/java/com/chinta44/autophotonamer/FolderSaverPlugin.java
import { Capacitor, registerPlugin } from '@capacitor/core';
import { blobToBase64 } from './nativeFileSave';

interface FolderSaverPlugin {
  pickFolder(): Promise<{ uri: string; name: string }>;
  checkFolder(options: { uri: string }): Promise<{ valid: boolean; name?: string }>;
  saveFile(options: { uri: string; filename: string; mimeType: string; data: string }): Promise<{ savedName: string }>;
}

const FolderSaver = registerPlugin<FolderSaverPlugin>('FolderSaver');
const STORAGE_KEY = 'auto_photo_native_save_folder';

export interface NativeFolder {
  uri: string;
  name: string;
}

export function getNativeFolder(): NativeFolder | null {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const f = JSON.parse(raw);
    return f && typeof f.uri === 'string' && typeof f.name === 'string' ? f : null;
  } catch {
    return null;
  }
}

function setNativeFolder(folder: NativeFolder | null): void {
  try {
    if (folder) localStorage.setItem(STORAGE_KEY, JSON.stringify(folder));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function clearNativeFolder(): void {
  setNativeFolder(null);
}

/** Opens Android's folder picker and remembers the choice (with a permission that survives restarts). */
export async function pickNativeFolder(): Promise<{ success: boolean; folderName?: string; error?: string; cancelled?: boolean }> {
  try {
    const res = await FolderSaver.pickFolder();
    setNativeFolder({ uri: res.uri, name: res.name });
    return { success: true, folderName: res.name };
  } catch (e: any) {
    if (e?.code === 'CANCELLED' || /cancel/i.test(String(e?.message))) {
      return { success: false, cancelled: true, error: 'フォルダ選択がキャンセルされました。' };
    }
    return { success: false, error: `フォルダの指定に失敗しました: ${e?.message || e}` };
  }
}

/** Returns the saved folder if it can still be written to; forgets it otherwise. */
export async function verifyNativeFolder(): Promise<NativeFolder | null> {
  const folder = getNativeFolder();
  if (!folder) return null;
  try {
    const res = await FolderSaver.checkFolder({ uri: folder.uri });
    if (res.valid) {
      if (res.name && res.name !== folder.name) setNativeFolder({ uri: folder.uri, name: res.name });
      return { uri: folder.uri, name: res.name || folder.name };
    }
  } catch {
    // treat as invalid
  }
  clearNativeFolder();
  return null;
}

export async function saveToNativeFolder(
  blob: Blob,
  filename: string,
  mimeType: string
): Promise<{ success: boolean; savedName?: string; error?: string; folderInvalid?: boolean }> {
  const folder = getNativeFolder();
  if (!folder) return { success: false, error: '保存先フォルダが設定されていません。', folderInvalid: true };
  try {
    const data = await blobToBase64(blob);
    const res = await FolderSaver.saveFile({ uri: folder.uri, filename, mimeType, data });
    return { success: true, savedName: res.savedName };
  } catch (e: any) {
    const code = e?.code;
    return {
      success: false,
      error: e?.message || String(e),
      folderInvalid: code === 'NO_PERMISSION' || code === 'FOLDER_GONE',
    };
  }
}
