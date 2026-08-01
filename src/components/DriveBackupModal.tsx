import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initDriveAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
  uploadBackupToDrive,
  downloadBackupFromDrive,
  findBackupFileInDrive,
  BackupDataPayload,
  DriveFileMeta,
} from '../utils/driveService';
import { PetProfile, SavedPhoto, NamingRuleConfig } from '../types';
import { Cloud, CloudUpload, CloudDownload, LogOut, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, X, HardDrive } from 'lucide-react';

interface DriveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  petProfiles: PetProfile[];
  savedPhotos: SavedPhoto[];
  namingConfig: NamingRuleConfig;
  onRestoreData: (restored: BackupDataPayload) => void;
  isAutoBackupEnabled: boolean;
  onToggleAutoBackup: (enabled: boolean) => void;
  lastBackupTime: string | null;
  onBackupSuccess: (time: string) => void;
}

export const DriveBackupModal: React.FC<DriveBackupModalProps> = ({
  isOpen,
  onClose,
  petProfiles,
  savedPhotos,
  namingConfig,
  onRestoreData,
  isAutoBackupEnabled,
  onToggleAutoBackup,
  lastBackupTime,
  onBackupSuccess,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getAccessToken());
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [driveFileMeta, setDriveFileMeta] = useState<DriveFileMeta | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<'backup' | 'restore' | null>(null);

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        checkDriveFile(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setDriveFileMeta(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const checkDriveFile = async (token: string) => {
    try {
      const file = await findBackupFileInDrive(token);
      setDriveFileMeta(file);
    } catch (e) {
      console.warn('Drive file check failed:', e);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setStatusMessage({ type: 'success', text: `Googleアカウント (${res.user.email}) で連携を開始しました。` });
        await checkDriveFile(res.accessToken);
      }
    } catch (err: any) {
      const errMsg = err?.message || err?.code || '';
      if (errMsg.includes('auth/unauthorized-domain')) {
        const currentDomain = window.location.hostname;
        setStatusMessage({
          type: 'error',
          text: `未承認のドメイン (${currentDomain}) からのアクセスです。Firebase Consoleでプロジェクト「boreal-breaker-hjlsj」を開き、「Authentication > 設定 > 承認済みドメイン」に「${currentDomain}」を追加してください。`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: err.message || 'Google認証に失敗しました。ポップアップの許可を確認してください。',
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setAccessToken(null);
      setDriveFileMeta(null);
      setStatusMessage({ type: 'info', text: 'ログアウトしました。' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'ログアウト処理中にエラーが発生しました。' });
    }
  };

  const handleExecuteBackup = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Googleアカウントにログインしてください。' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    setConfirmAction(null);

    try {
      const payload: BackupDataPayload = {
        version: '1.6.0',
        timestamp: new Date().toISOString(),
        petProfiles,
        savedPhotos,
        namingConfig,
      };

      const meta = await uploadBackupToDrive(accessToken, payload);
      setDriveFileMeta(meta);

      const formattedDate = new Date().toLocaleString('ja-JP');
      onBackupSuccess(formattedDate);
      setStatusMessage({
        type: 'success',
        text: `Google Driveへのバックアップ保存が完了しました！ (保存日時: ${formattedDate})`,
      });
    } catch (err: any) {
      console.error('Backup error:', err);
      setStatusMessage({
        type: 'error',
        text: `バックアップの保存に失敗しました: ${err.message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Googleアカウントにログインしてください。' });
      return;
    }

    if (!driveFileMeta) {
      setStatusMessage({ type: 'error', text: 'Google Drive上にバックアップファイルが見つかりません。' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    setConfirmAction(null);

    try {
      const payload = await downloadBackupFromDrive(accessToken, driveFileMeta.id);

      if (!payload || !Array.isArray(payload.petProfiles)) {
        throw new Error('バックアップデータの形式が不正です。');
      }

      onRestoreData(payload);

      setStatusMessage({
        type: 'success',
        text: `Google Driveからデータを復元しました！ (ペット数: ${payload.petProfiles.length}頭, ギャラリー写真数: ${payload.savedPhotos?.length || 0}枚)`,
      });
    } catch (err: any) {
      console.error('Restore error:', err);
      setStatusMessage({
        type: 'error',
        text: `データの復元に失敗しました: ${err.message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                Google Drive 自動バックアップ
              </h3>
              <p className="text-xs text-slate-400">
                ペット学習データ・写真ギャラリー・設定をクラウド保管
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Status Message Toast */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/60 border-rose-700/80 text-rose-200'
                  : 'bg-indigo-950/60 border-indigo-700/80 text-indigo-200'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
              <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {/* User Auth Section */}
          {!user ? (
            <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                <HardDrive className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">Googleアカウントで連携</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  お持ちのGoogle Driveに専用バックアップファイルを作成します。機種変更やブラウザのキャッシュ消去時もデータを安心引き継ぎ。
                </p>
              </div>

              {/* Official Google Sign-In Styled Button */}
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="gsi-material-button w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-slate-800 hover:bg-slate-100 active:bg-slate-200 font-bold text-sm rounded-2xl transition shadow-lg disabled:opacity-50"
              >
                <div className="w-5 h-5 shrink-0">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-full h-full">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span>{isSigningIn ? '連携中...' : 'Googleでログインして連携'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected User Profile Card */}
              <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-xl object-cover border border-indigo-500/40 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-base shrink-0">
                      {user.email?.[0].toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user.displayName || 'Google ユーザー'}</p>
                    <p className="text-[11px] text-indigo-300/80 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1.5 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-900/30 rounded-xl transition flex items-center gap-1 shrink-0 border border-rose-500/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>解除</span>
                </button>
              </div>

              {/* Local vs Cloud Data Summary */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">現在のローカルデータ</span>
                  <p className="font-semibold text-slate-200">ペット: <span className="text-indigo-400 font-bold">{petProfiles.length}</span>頭</p>
                  <p className="font-semibold text-slate-200">ギャラリー: <span className="text-indigo-400 font-bold">{savedPhotos.length}</span>枚</p>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Google Drive バックアップ</span>
                  {driveFileMeta ? (
                    <>
                      <p className="font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 保存済み
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {new Date(driveFileMeta.modifiedTime).toLocaleString('ja-JP')}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-500 italic">未作成</p>
                  )}
                </div>
              </div>

              {/* Auto Backup Toggle */}
              <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-200">変更時の自動バックアップ</h5>
                  <p className="text-[10px] text-slate-400">ペットの登録やギャラリー追加時に自動でGoogle Driveへ保存</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoBackupEnabled}
                    onChange={(e) => onToggleAutoBackup(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setConfirmAction('backup')}
                  disabled={isProcessing}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing && confirmAction === 'backup' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CloudUpload className="w-4 h-4" />
                  )}
                  <span>Driveへバックアップ</span>
                </button>

                <button
                  onClick={() => setConfirmAction('restore')}
                  disabled={isProcessing || !driveFileMeta}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 font-bold text-xs rounded-2xl transition border border-slate-700 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isProcessing && confirmAction === 'restore' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CloudDownload className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>Driveから復元</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Modal overlay for destructive/mutation operations */}
        {confirmAction && (
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 animate-fade-in space-y-3">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${confirmAction === 'restore' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <h5 className="font-bold text-white">
                  {confirmAction === 'backup' ? 'Google Drive上のデータを上書きしますか？' : '現在のローカルデータを復元データで置き換えますか？'}
                </h5>
                <p className="text-slate-400 leading-relaxed">
                  {confirmAction === 'backup'
                    ? `現在のペット(${petProfiles.length}頭)と保存写真(${savedPhotos.length}枚)をGoogle Drive上の「auto_photo_pet_learning_backup.json」に保存・上書きします。`
                    : `Google Driveから最新のペット情報およびギャラリー写真を読み込み、ブラウザ内のデータを置き換えます。`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl transition"
              >
                キャンセル
              </button>
              <button
                onClick={confirmAction === 'backup' ? handleExecuteBackup : handleExecuteRestore}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl text-white transition shadow-md ${
                  confirmAction === 'backup'
                    ? 'bg-indigo-600 hover:bg-indigo-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                実行する
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 text-center text-[11px] text-slate-500 font-medium">
          <p>Google Drive APIスコープ (drive.file) を使用し、本アプリが作成したバックアップファイルのみにアクセスします。</p>
        </div>
      </div>
    </div>
  );
};
