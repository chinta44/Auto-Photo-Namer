import React, { useState, useRef, useEffect } from 'react';
import { getJSTDateString } from '../utils/dateUtils';
import { saveOrShareFile } from '../utils/nativeFileSave';
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
import {
  Download,
  Upload,
  HardDrive,
  FileCheck,
  Cloud,
  CloudUpload,
  CloudDownload,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  X,
  FileJson,
  Smartphone,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  petProfiles: PetProfile[];
  savedPhotos: SavedPhoto[];
  namingConfig: NamingRuleConfig;
  onRestoreData: (
    restored: BackupDataPayload,
    mode: 'overwrite' | 'merge'
  ) => { addedCount: number; skippedCount: number };
  isAutoBackupEnabled: boolean;
  onToggleAutoBackup: (enabled: boolean) => void;
  lastBackupTime: string | null;
  onBackupSuccess: (time: string) => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
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
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('merge');

  // Google Drive advanced section states
  const [showDriveSection, setShowDriveSection] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getAccessToken());
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isDriveProcessing, setIsDriveProcessing] = useState(false);
  const [driveFileMeta, setDriveFileMeta] = useState<DriveFileMeta | null>(null);

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

  // 1. Export JSON file to local device (Download)
  const handleExportToFile = async () => {
    try {
      const now = new Date();
      const dateStr = getJSTDateString();
      const payload: BackupDataPayload = {
        version: '1.6.3',
        timestamp: now.toISOString(),
        petProfiles,
        savedPhotos,
        namingConfig,
      };

      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const filename = `pet_namer_backup_${dateStr}.json`;

      const result = await saveOrShareFile(blob, filename, 'application/json');
      if (!result.success) {
        throw new Error(result.error || '保存に失敗しました。');
      }

      const formattedDate = now.toLocaleString('ja-JP');
      onBackupSuccess(formattedDate);
      setStatusMessage({
        type: 'success',
        text: `バックアップファイル (${filename}) を保存しました！ スマホの「ファイル」や「ダウンロード」フォルダをご確認ください。`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `ファイル出力に失敗しました: ${err.message}`,
      });
    }
  };

  // 2. Import JSON file from local device (Upload & Restore)
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const payload: BackupDataPayload = JSON.parse(content);

        if (!payload || !Array.isArray(payload.petProfiles)) {
          throw new Error('ファイルの形式が正しくありません (ペット情報が見つかりません)');
        }

        const { addedCount, skippedCount } = onRestoreData(payload, restoreMode);

        if (restoreMode === 'merge') {
          setStatusMessage({
            type: 'success',
            text: `ペット学習データを合成しました！ (追加: ${addedCount}頭${
              skippedCount > 0 ? ` / 既存とID重複でスキップ: ${skippedCount}頭` : ''
            })`,
          });
        } else {
          setStatusMessage({
            type: 'success',
            text: `データ復元が完了しました！ (ペット: ${payload.petProfiles.length}頭, 写真: ${payload.savedPhotos?.length || 0}枚)`,
          });
        }
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: `バックアップファイルの読み込みに失敗しました: ${err.message}`,
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Google Drive Auth Handlers
  const handleDriveSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setStatusMessage({ type: 'success', text: `Googleアカウント (${res.user.email}) で連携しました。` });
        await checkDriveFile(res.accessToken);
      }
    } catch (err: any) {
      const errMsg = err?.message || err?.code || '';
      if (errMsg.includes('auth/unauthorized-domain')) {
        const currentDomain = window.location.hostname;
        setStatusMessage({
          type: 'error',
          text: `未承認ドメイン (${currentDomain}) からのアクセスです。Firebase Console「Authentication > 承認済みドメイン」に「${currentDomain}」の追加が必要です。`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: err.message || 'Google認証に失敗しました。',
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDriveSignOut = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setAccessToken(null);
      setDriveFileMeta(null);
      setStatusMessage({ type: 'info', text: 'Googleアカウントからログアウトしました。' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'ログアウト処理でエラーが発生しました。' });
    }
  };

  const handleDriveBackup = async () => {
    if (!accessToken) return;
    setIsDriveProcessing(true);
    try {
      const payload: BackupDataPayload = {
        version: '1.6.1',
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
        text: `Google Driveへデータを保存しました！ (${formattedDate})`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Drive保存エラー: ${err.message}` });
    } finally {
      setIsDriveProcessing(false);
    }
  };

  const handleDriveRestore = async () => {
    if (!accessToken || !driveFileMeta) return;
    setIsDriveProcessing(true);
    try {
      const payload = await downloadBackupFromDrive(accessToken, driveFileMeta.id);
      const { addedCount, skippedCount } = onRestoreData(payload, restoreMode);
      if (restoreMode === 'merge') {
        setStatusMessage({
          type: 'success',
          text: `Google Driveのペット学習データを合成しました！ (追加: ${addedCount}頭${
            skippedCount > 0 ? ` / 重複スキップ: ${skippedCount}頭` : ''
          })`,
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Google Driveからデータを復元しました！ (ペット: ${payload.petProfiles.length}頭)`,
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Drive復元エラー: ${err.message}` });
    } finally {
      setIsDriveProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                データバックアップ＆復元
              </h3>
              <p className="text-xs text-slate-400">
                アカウント不要！スマホ本体に保存して他のブラウザへ移動できます
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

        {/* Modal Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Toast Notification */}
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

          {/* Current Local Data Summary */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">保存対象のデータ</span>
              <p className="font-semibold text-slate-200">
                ペット学習プロファイル: <span className="text-indigo-400 font-bold">{petProfiles.length}頭</span>
              </p>
              <p className="font-semibold text-slate-200">
                保存済みギャラリー写真: <span className="text-indigo-400 font-bold">{savedPhotos.length}枚</span>
              </p>
            </div>
            <div className="text-right">
              {lastBackupTime ? (
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">最終保存</span>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">{lastBackupTime}</span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-500 italic">未保存</span>
              )}
            </div>
          </div>

          {/* SECTION 1: Local File Backup & Restore (Easiest Method) */}
          <div className="p-5 bg-gradient-to-br from-indigo-950/40 via-slate-950/60 to-slate-900/60 border border-indigo-500/30 rounded-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-indigo-300">
              <Smartphone className="w-5 h-5 text-indigo-400" />
              <h4 className="font-bold text-sm text-white">端末ファイルで保存 / 復元（一番簡単）</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ログインや初期設定は一切不要！バックアップファイルをスマホやPCの「ファイル・ダウンロード」に保存し、別のブラウザや新しいスマホで読み込むだけで一瞬で復元できます。
            </p>

            {/* Restore mode toggle: overwrite vs merge */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                読み込み時の動作（ペット学習データ）
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRestoreMode('merge')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
                    restoreMode === 'merge'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow shadow-indigo-600/30'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  合成（追加）
                </button>
                <button
                  type="button"
                  onClick={() => setRestoreMode('overwrite')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
                    restoreMode === 'overwrite'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow shadow-indigo-600/30'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  上書き（全交換）
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {restoreMode === 'merge'
                  ? '既存のペット学習プロファイルは残したまま、ファイル内の新しいペットだけを追加します（同じIDのペットは既存を優先しスキップ）。写真・命名ルールは変更されません。'
                  : '現在のペット・写真・命名ルールを、読み込んだファイルの内容に完全に置き換えます。'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Export Button */}
              <button
                onClick={handleExportToFile}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>端末に保存 (JSON出力)</span>
              </button>

              {/* Import Button */}
              <div>
                <input
                  type="file"
                  accept=".json,application/json"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 font-bold text-xs rounded-2xl transition border border-slate-700 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>端末から読み込んで{restoreMode === 'merge' ? '合成' : '復元'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: Google Drive Auto Cloud Backup (Advanced Option) */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
            <button
              onClick={() => setShowDriveSection(!showDriveSection)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center gap-2.5">
                <Cloud className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-300">Google Drive クラウド連携（選択）</span>
              </div>
              {showDriveSection ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showDriveSection && (
              <div className="p-4 border-t border-slate-800 space-y-4 animate-fade-in">
                {!user ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Googleアカウントにログインしてクラウドに保管します。（※独自ドメインで公開している場合、Firebase設定が必要です）
                    </p>
                    <button
                      onClick={handleDriveSignIn}
                      disabled={isSigningIn}
                      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white text-slate-800 hover:bg-slate-100 font-bold text-xs rounded-xl transition shadow disabled:opacity-50"
                    >
                      <span>{isSigningIn ? '連携中...' : 'Googleアカウントでログイン'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-300 truncate">{user.email}</span>
                      <button
                        onClick={handleDriveSignOut}
                        className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        解除
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleDriveBackup}
                        disabled={isDriveProcessing}
                        className="px-3 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <CloudUpload className="w-3.5 h-3.5" />
                        <span>Driveへ保存</span>
                      </button>
                      <button
                        onClick={handleDriveRestore}
                        disabled={isDriveProcessing || !driveFileMeta}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                      >
                        <CloudDownload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Driveから{restoreMode === 'merge' ? '合成' : '復元'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 text-center text-[11px] text-slate-500 font-medium">
          <p>バックアップファイルにはペットの識別用データとギャラリー写真が含まれます。</p>
        </div>
      </div>
    </div>
  );
};
