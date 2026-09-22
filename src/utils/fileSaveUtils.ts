/**
 * Utility to save files (photos, CSV, backups).
 * Web default: saves into the browser's Downloads folder via an <a download> link.
 * Web custom : the user picks a folder once (showDirectoryPicker); its handle is kept in IndexedDB.
 * Android app: the user picks a folder once (Storage Access Framework, see folderSaver.ts) and files are
 *              written straight into it. Without a chosen folder the Android share sheet is used.
 * In every case an existing file with the same name is never overwritten - a numeric suffix
 * (name_2.jpg, name_3.jpg ...) is added instead.
 */
import { Capacitor } from '@capacitor/core';
import { saveOrShareFile } from './nativeFileSave';
import {
  getNativeFolder,
  verifyNativeFolder,
  pickNativeFolder,
  clearNativeFolder,
  saveToNativeFolder,
} from './folderSaver';
import { splitExt, toSafeImageFilename } from './filenameUtils';
import { showToast } from './toast';

const DB_NAME = 'PhotoNamingAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'settings';
const HANDLE_KEY = 'customDirectoryHandle';
const FOLDER_NAME_KEY = 'customDirectoryName';

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSavedDirectoryInfo(): Promise<{ handle: FileSystemDirectoryHandle | null; name: string | null }> {
  if (Capacitor.isNativePlatform()) {
    // Re-checks that the folder still exists and is still writable (it can be deleted,
    // or its permission revoked, from outside the app) and forgets it if not.
    const folder = await verifyNativeFolder();
    return { handle: null, name: folder?.name ?? null };
  }
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const reqHandle = store.get(HANDLE_KEY);
      const reqName = store.get(FOLDER_NAME_KEY);

      tx.oncomplete = () => {
        resolve({
          handle: reqHandle.result || null,
          name: reqName.result || null,
        });
      };
      tx.onerror = () => resolve({ handle: null, name: null });
    });
  } catch (e) {
    return { handle: null, name: null };
  }
}

export async function setSavedDirectoryInfo(handle: FileSystemDirectoryHandle | null, folderName?: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      if (handle) {
        store.put(handle, HANDLE_KEY);
        store.put(folderName || handle.name, FOLDER_NAME_KEY);
      } else {
        store.delete(HANDLE_KEY);
        store.delete(FOLDER_NAME_KEY);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(false);
    });
  } catch (e) {
    return false;
  }
}

export async function pickCustomSaveDirectory(): Promise<{ success: boolean; folderName?: string; error?: string }> {
  if (Capacitor.isNativePlatform()) {
    return pickNativeFolder();
  }

  if (!('showDirectoryPicker' in window)) {
    return {
      success: false,
      error: 'お使いのブラウザまたは通信環境ではフォルダ選択機能(showDirectoryPicker)が制限されています。標準のダウンロードフォルダへ保存されます。',
    };
  }

  try {
    const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
    });
    const folderName = handle.name;
    await setSavedDirectoryInfo(handle, folderName);
    return { success: true, folderName };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'フォルダ選択がキャンセルされました。' };
    }
    console.warn('showDirectoryPicker error:', err);
    return { success: false, error: 'フォルダの指定に失敗しました。' };
  }
}

export async function resetToDefaultDownloadsDirectory(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    clearNativeFolder();
    return true;
  }
  return await setSavedDirectoryInfo(null);
}

export interface SaveOptions {
  /** Do not show the "saved to ..." toast (used by bulk saves, which show one summary instead). */
  silent?: boolean;
}

export interface SaveResult {
  success: boolean;
  /** The name actually used (it can differ from the requested one when that name was already taken). */
  savedName?: string;
  where?: 'folder' | 'share' | 'downloads';
  folderName?: string;
  error?: string;
}

/** Finds a free name in a web directory handle: name.jpg, name_2.jpg, name_3.jpg ... */
export async function findFreeName(dir: FileSystemDirectoryHandle, filename: string): Promise<string> {
  const { base, ext } = splitExt(filename);
  let candidate = filename;
  for (let n = 2; n < 1000; n++) {
    try {
      await dir.getFileHandle(candidate); // exists -> try the next suffix
      candidate = `${base}_${n}${ext}`;
    } catch (e: any) {
      if (e?.name === 'NotFoundError') return candidate;
      throw e;
    }
  }
  return `${base}_${Date.now()}${ext}`;
}

/**
 * Saves a file to wherever the user configured (see the header comment).
 * `filename` must already be a safe file name.
 */
export async function saveBlobToConfiguredLocation(
  blob: Blob,
  filename: string,
  mimeType: string,
  opts: SaveOptions = {}
): Promise<SaveResult> {
  // ---- Android app ---------------------------------------------------------
  if (Capacitor.isNativePlatform()) {
    const folder = getNativeFolder();
    if (folder) {
      const r = await saveToNativeFolder(blob, filename, mimeType);
      if (r.success) {
        if (!opts.silent) showToast(`「${folder.name}」に保存しました: ${r.savedName}`, 'success');
        return { success: true, savedName: r.savedName, where: 'folder', folderName: folder.name };
      }
      if (r.folderInvalid) {
        clearNativeFolder();
        showToast('保存先フォルダにアクセスできなくなりました。今回は共有メニューで保存します。設定で選び直してください。', 'warn', 7000);
      } else {
        showToast(`フォルダへの保存に失敗したため、共有メニューで保存します（${r.error}）`, 'warn', 7000);
      }
    }
    const s = await saveOrShareFile(blob, filename, mimeType);
    return { success: s.success, savedName: filename, where: 'share', error: s.error };
  }

  // ---- Web: custom folder (File System Access API) -------------------------
  const { handle: dirHandle } = await getSavedDirectoryInfo();
  if (dirHandle) {
    try {
      let perm = await (dirHandle as any).queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') {
        perm = await (dirHandle as any).requestPermission({ mode: 'readwrite' });
      }
      if (perm === 'granted') {
        const finalName = await findFreeName(dirHandle, filename);
        const fileHandle = await dirHandle.getFileHandle(finalName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        if (!opts.silent) showToast(`「${dirHandle.name}」に保存しました: ${finalName}`, 'success');
        return { success: true, savedName: finalName, where: 'folder', folderName: dirHandle.name };
      }
    } catch (dirErr) {
      console.warn('Custom folder write failed or access expired, falling back to default downloads:', dirErr);
    }
  }

  // ---- Web: default download (the browser adds "(1)" itself if the name exists)
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { success: true, savedName: filename, where: 'downloads' };
  } catch (err: any) {
    return { success: false, error: `保存に失敗しました: ${err?.message || err}` };
  }
}

export async function downloadImageWithPicker(
  dataUrl: string,
  suggestedFilename: string,
  opts: SaveOptions = {}
): Promise<boolean> {
  const filename = toSafeImageFilename(suggestedFilename);

  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const result = await saveBlobToConfiguredLocation(blob, filename, blob.type || 'image/jpeg', opts);
    return result.success;
  } catch (e) {
    console.error('Failed to download image:', e);
    if (Capacitor.isNativePlatform()) return false;
    // Ultimate fallback (web): plain link download of the data URL
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
}
