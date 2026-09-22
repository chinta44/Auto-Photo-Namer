// Gallery storage, all in IndexedDB (no 5 MB localStorage limit):
//  - store "images": the original-quality photo of every gallery entry (key = photo id)
//  - store "meta"  : the gallery list itself (metadata + a small thumbnail per photo)
// Older versions kept everything in localStorage; loadLibrary() migrates that automatically.
import type { SavedPhoto } from '../types';
import { createGalleryCopy } from './imageUtils';

const DB_NAME = 'AutoPhotoNamerPhotos';
const DB_VERSION = 2;
const STORE = 'images';
const META_STORE = 'meta';
const LIBRARY_KEY = 'library';
const LEGACY_LOCALSTORAGE_KEY = 'auto_photo_saved_library';

export const THUMB_MAX_DIMENSION = 360;
const THUMB_QUALITY = 0.72;
const THUMB_KEEP_BELOW_CHARS = 60000; // a data URL this small is already a fine thumbnail
const LEGACY_FULL_THRESHOLD_CHARS = 90000; // older entries: dataUrl above this is a full-size image

export type PhotoWithOriginal = SavedPhoto & { fullDataUrl?: string };

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
        if (!req.result.objectStoreNames.contains(META_STORE)) req.result.createObjectStore(META_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => {
      dbPromise = null; // allow a later retry
    });
  }
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>, storeName: string = STORE): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const req = fn(tx.objectStore(storeName));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
      })
  );
}

export async function putFullImage(id: string, dataUrl: string): Promise<void> {
  await run('readwrite', (s) => s.put(dataUrl, id));
}

export async function getFullImage(id: string): Promise<string | null> {
  try {
    const v = await run<unknown>('readonly', (s) => s.get(id));
    return typeof v === 'string' ? v : null;
  } catch {
    return null;
  }
}

export async function deleteFullImages(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      ids.forEach((id) => store.delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // best effort
  }
}

export async function listFullImageIds(): Promise<string[]> {
  try {
    const keys = await run<IDBValidKey[]>('readonly', (s) => s.getAllKeys());
    return keys.map(String);
  } catch {
    return [];
  }
}

/** Deletes every stored original whose id is not in `keepIds` (used after "overwrite" restores). */
export async function pruneFullImages(keepIds: Iterable<string>): Promise<void> {
  const keep = new Set(keepIds);
  const stored = await listFullImageIds();
  await deleteFullImages(stored.filter((id) => !keep.has(id)));
}

export function makeThumbnail(dataUrl: string): Promise<string> {
  return createGalleryCopy(dataUrl, THUMB_MAX_DIMENSION, THUMB_QUALITY, THUMB_KEEP_BELOW_CHARS);
}

/**
 * Stores a photo for the gallery: original in IndexedDB, thumbnail inline.
 * If IndexedDB is unavailable, falls back to one downsized copy inline (the old behaviour).
 */
export async function storePhoto(photo: SavedPhoto): Promise<SavedPhoto> {
  try {
    await putFullImage(photo.id, photo.dataUrl);
    const thumb = await makeThumbnail(photo.dataUrl);
    return { ...photo, dataUrl: thumb, fullStored: true };
  } catch (e) {
    console.warn('IndexedDB unavailable, keeping a downsized copy in localStorage instead:', e);
    const small = await createGalleryCopy(photo.dataUrl);
    return { ...photo, dataUrl: small, fullStored: false };
  }
}

/** The best quality image we have for a gallery photo (original if stored, else the inline image). */
export async function getFullDataUrl(photo: SavedPhoto): Promise<string> {
  if (photo.fullStored) {
    const full = await getFullImage(photo.id);
    if (full) return full;
  }
  return photo.dataUrl;
}

/**
 * Moves entries saved by older versions (full or 1280px image inline in localStorage)
 * into the new layout. Returns the same array (changed = false) when nothing needed to move.
 */
export async function migrateLegacyPhotos(photos: SavedPhoto[]): Promise<{ photos: SavedPhoto[]; changed: boolean }> {
  if (!photos.some((p) => !p.fullStored && p.dataUrl.length > LEGACY_FULL_THRESHOLD_CHARS)) {
    return { photos, changed: false };
  }
  const out: SavedPhoto[] = [];
  let changed = false;
  for (const p of photos) {
    if (!p.fullStored && p.dataUrl.length > LEGACY_FULL_THRESHOLD_CHARS) {
      try {
        await putFullImage(p.id, p.dataUrl);
        const thumb = await makeThumbnail(p.dataUrl);
        out.push({ ...p, dataUrl: thumb, fullStored: true });
        changed = true;
        continue;
      } catch (e) {
        console.warn('Could not migrate a gallery photo to IndexedDB:', p.id, e);
      }
    }
    out.push(p);
  }
  return { photos: out, changed };
}

/**
 * Prepares photos coming from a backup file for the gallery.
 * - entries with `fullDataUrl` (backup made with "include originals"): original -> IndexedDB
 * - older backups (big inline `dataUrl`): treated like legacy entries
 */
export async function importPhotos(photos: PhotoWithOriginal[]): Promise<SavedPhoto[]> {
  const out: SavedPhoto[] = [];
  for (const raw of photos) {
    const { fullDataUrl, ...photo } = raw;
    try {
      if (fullDataUrl) {
        await putFullImage(photo.id, fullDataUrl);
        const thumb = photo.dataUrl && photo.dataUrl.length <= LEGACY_FULL_THRESHOLD_CHARS ? photo.dataUrl : await makeThumbnail(fullDataUrl);
        out.push({ ...photo, dataUrl: thumb, fullStored: true });
        continue;
      }
      if (!photo.fullStored && photo.dataUrl.length > LEGACY_FULL_THRESHOLD_CHARS) {
        await putFullImage(photo.id, photo.dataUrl);
        out.push({ ...photo, dataUrl: await makeThumbnail(photo.dataUrl), fullStored: true });
        continue;
      }
    } catch (e) {
      console.warn('Could not store an imported photo in IndexedDB:', photo.id, e);
    }
    // small entry, or IndexedDB failed: keep inline (drop the flag so we never look for a missing original)
    out.push({ ...photo, fullStored: false });
  }
  return out;
}

/** Best-effort request so the browser does not evict our data under storage pressure. */
export function requestPersistentStorage(): void {
  try {
    (navigator as any)?.storage?.persist?.().catch?.(() => {});
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// The gallery list
// ---------------------------------------------------------------------------

let writeChain: Promise<unknown> = Promise.resolve();

/** Saves the whole gallery list. Writes are serialized so an older list can never overwrite a newer one. */
export function saveLibrary(photos: SavedPhoto[]): Promise<boolean> {
  const job = writeChain.then(() => run('readwrite', (s) => s.put(photos, LIBRARY_KEY), META_STORE)).then(
    () => true,
    (e) => {
      console.warn('Saving the gallery failed:', e);
      return false;
    }
  );
  writeChain = job;
  return job;
}

/**
 * Loads the gallery list. Order: IndexedDB -> (first run after updating) localStorage of older
 * versions, which is moved into IndexedDB and then removed from localStorage.
 */
export async function loadLibrary(): Promise<{ photos: SavedPhoto[]; source: 'indexeddb' | 'localStorage' | 'empty' }> {
  try {
    const stored = await run<unknown>('readonly', (s) => s.get(LIBRARY_KEY), META_STORE);
    if (Array.isArray(stored)) return { photos: stored as SavedPhoto[], source: 'indexeddb' };
  } catch (e) {
    console.warn('Could not read the gallery from IndexedDB:', e);
    return { photos: readLegacyLocalStorage(), source: 'localStorage' };
  }

  const legacy = readLegacyLocalStorage();
  if (legacy.length === 0) return { photos: [], source: 'empty' };

  const migrated = await migrateLegacyPhotos(legacy);
  if (await saveLibrary(migrated.photos)) {
    try {
      localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return { photos: migrated.photos, source: 'localStorage' };
}

function readLegacyLocalStorage(): SavedPhoto[] {
  try {
    const raw = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
