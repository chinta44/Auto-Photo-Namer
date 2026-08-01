/**
 * Utility to save files.
 * Default: Saves directly to browser's default Downloads folder via <a> download attribute (no popup dialog).
 * Custom: Allows user to pick a target directory handle (showDirectoryPicker) stored in IndexedDB.
 */

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
  return await setSavedDirectoryInfo(null);
}

export async function downloadImageWithPicker(
  dataUrl: string,
  suggestedFilename: string
): Promise<boolean> {
  const filename =
    suggestedFilename.endsWith('.jpg') || suggestedFilename.endsWith('.jpeg') || suggestedFilename.endsWith('.png')
      ? suggestedFilename
      : `${suggestedFilename}.jpg`;

  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    // Check if custom directory is saved in IndexedDB
    const { handle: dirHandle } = await getSavedDirectoryInfo();

    if (dirHandle) {
      try {
        let perm = await (dirHandle as any).queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          perm = await (dirHandle as any).requestPermission({ mode: 'readwrite' });
        }

        if (perm === 'granted') {
          const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          return true;
        }
      } catch (dirErr) {
        console.warn('Custom folder write failed or access expired, falling back to default downloads:', dirErr);
      }
    }

    // Default download action: direct browser download into Downloads folder without popup
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (e) {
    console.error('Failed to download image:', e);
    // Ultimate fallback
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
}
