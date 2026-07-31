import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might have expired or session restored without token in memory
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Googleアカウントからのアクセストークンの取得に失敗しました。');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

const BACKUP_FILENAME = 'auto_photo_pet_learning_backup.json';

export interface BackupDataPayload {
  version: string;
  timestamp: string;
  petProfiles: any[];
  savedPhotos: any[];
  namingConfig: any;
}

export interface DriveFileMeta {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

/**
 * Searches for existing backup file in Google Drive.
 */
export const findBackupFileInDrive = async (token: string): Promise<DriveFileMeta | null> => {
  const query = encodeURIComponent(`name = '${BACKUP_FILENAME}' and trashed = false`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Google Drive検索エラー (${response.status})`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0] as DriveFileMeta;
  }
  return null;
};

/**
 * Uploads (creates or updates) backup data to user's Google Drive.
 */
export const uploadBackupToDrive = async (
  token: string,
  payload: BackupDataPayload
): Promise<DriveFileMeta> => {
  const existingFile = await findBackupFileInDrive(token);

  const fileMetadata = {
    name: BACKUP_FILENAME,
    mimeType: 'application/json',
    description: 'Auto Photo Namer App - Pet Learning Data & Gallery Backup',
  };

  const fileContent = JSON.stringify(payload, null, 2);

  // Use multipart upload format for Google Drive API v3
  const boundary = 'foo_bar_baz_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(fileMetadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    fileContent +
    closeDelimiter;

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size';
  let method = 'POST';

  if (existingFile) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart&fields=id,name,modifiedTime,size`;
    method = 'PATCH';
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    throw new Error(errObj?.error?.message || `Google Driveアップロードに失敗しました (${response.status})`);
  }

  const savedMeta = await response.json();
  return savedMeta as DriveFileMeta;
};

/**
 * Restores backup data from Google Drive.
 */
export const downloadBackupFromDrive = async (
  token: string,
  fileId: string
): Promise<BackupDataPayload> => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    throw new Error(errObj?.error?.message || `バックアップデータのダウンロードに失敗しました (${response.status})`);
  }

  const payload = await response.json();
  return payload as BackupDataPayload;
};
