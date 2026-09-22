/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CameraView } from './components/CameraView';
import { AnalysisModal } from './components/AnalysisModal';
import { BatchAnalysisModal } from './components/BatchAnalysisModal';
import { PetManagerModal } from './components/PetManagerModal';
import { PhotoGallery } from './components/PhotoGallery';
import { NamingRulesModal } from './components/NamingRulesModal';
import { ExplanationCard } from './components/ExplanationCard';
import { ApiKeyModal } from './components/ApiKeyModal';
import { DataBackupModal } from './components/DataBackupModal';
import { ThemeSettingsModal, ThemeId } from './components/ThemeSettingsModal';
import { AnalysisResult, PetProfile, SavedPhoto, NamingRuleConfig, FocusPoint, BatchPhotoItem, LocationData } from './types';
import { analyzePhoto, AnalyzeError } from './utils/analyzeClient';
import { useAnalysisQueue, Analyzer } from './utils/analysisQueue';
import { wakeServer } from './utils/serverWake';
import { loadLibrary, saveLibrary, storePhoto, deleteFullImages, importPhotos } from './utils/photoStore';
import { initDriveAuth, getAccessToken, uploadBackupToDrive, BackupDataPayload } from './utils/driveService';
import { checkForAppUpdate, CURRENT_APP_VERSION, UpdateInfo } from './utils/updateChecker';
import { APP_VERSION } from './version';
import { Sparkles, Camera, Key, Download, X, AlertTriangle, RefreshCw } from 'lucide-react';

const DEFAULT_PETS: PetProfile[] = [
  {
    id: 'pet-default-1',
    name: 'ポチ',
    species: 'dog',
    breedOrDescription: '茶色の柴犬。三角耳と巻尾が特徴',
    registeredAt: '2026/07/29',
  },
];

const DEFAULT_NAMING_CONFIG: NamingRuleConfig = {
  dateFormat: 'YYYYMMDD',
  includeCategory: true,
  includeAmount: true,
  separator: '_',
  customPrefix: '',
  extension: '.jpg',
  photoQuality: 'high',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'camera' | 'gallery' | 'pets' | 'rules' | 'guide'>('camera');

  // Local storage persisted states
  const [petProfiles, setPetProfiles] = useState<PetProfile[]>(() => {
    try {
      const saved = localStorage.getItem('auto_photo_pet_profiles');
      return saved ? JSON.parse(saved) : DEFAULT_PETS;
    } catch (e) {
      return DEFAULT_PETS;
    }
  });

  // Photos are stored in IndexedDB (see utils/photoStore.ts): the original-quality image plus a
  // small thumbnail per photo, so the gallery is not limited by localStorage's ~5MB quota.
  const [savedPhotos, setSavedPhotos] = useState<SavedPhoto[]>([]);
  const libraryLoadedRef = useRef(false);
  useEffect(() => {
    loadLibrary().then(({ photos }) => {
      setSavedPhotos(photos);
      libraryLoadedRef.current = true;
    });
  }, []);

  const [namingConfig, setNamingConfig] = useState<NamingRuleConfig>(() => {
    try {
      const saved = localStorage.getItem('auto_photo_naming_config');
      return saved ? { ...DEFAULT_NAMING_CONFIG, ...JSON.parse(saved) } : DEFAULT_NAMING_CONFIG;
    } catch (e) {
      return DEFAULT_NAMING_CONFIG;
    }
  });

  // Custom User Gemini API Key
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('custom_gemini_api_key') || '';
    } catch (e) {
      return '';
    }
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Design theme (accent/background color scheme)
  const [theme, setTheme] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('auto_photo_theme') as ThemeId | null;
      return saved && ['ocean', 'forest', 'sunset', 'mono'].includes(saved) ? saved : 'ocean';
    } catch (e) {
      return 'ocean';
    }
  });
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Check GitHub Releases for a newer APK version (native app only)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateBannerDismissed, setUpdateBannerDismissed] = useState(false);
  useEffect(() => {
    checkForAppUpdate().then((info) => {
      if (info.available) setUpdateInfo(info);
    });
    wakeServer(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('auto_photo_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Google Drive Backup state
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('auto_photo_drive_autobackup') === 'true';
    } catch (e) {
      return true;
    }
  });
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem('auto_photo_last_backup_time');
    } catch (e) {
      return null;
    }
  });

  // Check Drive Auth status
  useEffect(() => {
    const unsubscribe = initDriveAuth(
      () => setIsDriveConnected(true),
      () => setIsDriveConnected(false)
    );
    return () => unsubscribe();
  }, []);

  // Save auto backup toggle to LocalStorage
  const handleToggleAutoBackup = (enabled: boolean) => {
    setIsAutoBackupEnabled(enabled);
    try {
      localStorage.setItem('auto_photo_drive_autobackup', String(enabled));
    } catch (e) {}
  };

  const handleUpdateLastBackupTime = (time: string) => {
    setLastBackupTime(time);
    try {
      localStorage.setItem('auto_photo_last_backup_time', time);
    } catch (e) {}
  };

  // Auto-backup to Google Drive if connected and enabled
  useEffect(() => {
    if (!isAutoBackupEnabled || !isDriveConnected) return;

    const token = getAccessToken();
    if (!token) return;

    const timer = setTimeout(async () => {
      try {
        const payload: BackupDataPayload = {
          version: APP_VERSION,
          timestamp: new Date().toISOString(),
          petProfiles,
          savedPhotos,
          namingConfig,
        };
        await uploadBackupToDrive(token, payload);
        const formatted = new Date().toLocaleString('ja-JP');
        handleUpdateLastBackupTime(formatted);
      } catch (e) {
        console.warn('Auto-backup background sync notice:', e);
      }
    }, 3000); // Debounce 3s

    return () => clearTimeout(timer);
  }, [petProfiles, savedPhotos, namingConfig, isAutoBackupEnabled, isDriveConnected]);

  // Restore data callback from local file / Google Drive.
  // mode: 'overwrite' replaces all data (previous behavior).
  //       'merge' only merges pet profiles into the existing ones,
  //       skipping any incoming pet whose id already exists locally.
  //       savedPhotos / namingConfig are left untouched in merge mode.
  const handleRestoreData = async (
    payload: BackupDataPayload,
    mode: 'overwrite' | 'merge' = 'overwrite'
  ): Promise<{ addedCount: number; skippedCount: number }> => {
    if (mode === 'merge') {
      let addedCount = 0;
      let skippedCount = 0;
      if (payload.petProfiles && Array.isArray(payload.petProfiles)) {
        setPetProfiles((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const toAdd: PetProfile[] = [];
          for (const incoming of payload.petProfiles as PetProfile[]) {
            if (existingIds.has(incoming.id)) {
              skippedCount++;
            } else {
              toAdd.push(incoming);
              existingIds.add(incoming.id);
              addedCount++;
            }
          }
          return [...prev, ...toAdd];
        });
      }
      return { addedCount, skippedCount };
    }

    // overwrite mode (default / previous behavior)
    if (payload.petProfiles && Array.isArray(payload.petProfiles)) {
      setPetProfiles(payload.petProfiles);
    }
    if (payload.savedPhotos && Array.isArray(payload.savedPhotos)) {
      // Backup files predate IndexedDB storage, so photo data always arrives inline;
      // importPhotos() moves anything large into IndexedDB and keeps only a thumbnail inline.
      setSavedPhotos(await importPhotos(payload.savedPhotos));
    }
    if (payload.namingConfig) {
      setNamingConfig(payload.namingConfig);
    }
    return { addedCount: payload.petProfiles?.length || 0, skippedCount: 0 };
  };

  // Current capture & analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentImageDataUrl, setCurrentImageDataUrl] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  // "waiting to retry" / "server is slow to respond" notices shown during handleCaptureImage
  // (see utils/analyzeClient.ts - retries happen automatically, this is just user feedback).
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('auto_photo_pet_profiles', JSON.stringify(petProfiles));
    } catch (e) {}
  }, [petProfiles]);

  // Warning shown when the gallery can't be written to storage (quota exceeded).
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  useEffect(() => {
    // Skip the very first render: it fires before loadLibrary() above has a chance to run,
    // which would otherwise overwrite the stored gallery with an empty list.
    if (!libraryLoadedRef.current) return;
    saveLibrary(savedPhotos).then((ok) => {
      setStorageWarning(
        ok
          ? null
          : '端末の保存容量がいっぱいのため、ギャラリーの最新の変更を保存できませんでした。このままアプリを閉じると、新しく保存した写真が消える可能性があります。不要な写真を削除するか、ヘッダーの「データバックアップ＆復元」からバックアップを書き出してください。'
      );
    });
  }, [savedPhotos]);

  useEffect(() => {
    try {
      localStorage.setItem('auto_photo_naming_config', JSON.stringify(namingConfig));
    } catch (e) {}
  }, [namingConfig]);

  const handleSaveApiKey = (key: string) => {
    setUserApiKey(key);
    try {
      if (key) {
        localStorage.setItem('custom_gemini_api_key', key);
      } else {
        localStorage.removeItem('custom_gemini_api_key');
      }
    } catch (e) {}
  };

  // Batch Analysis Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchQueuedItems, setBatchQueuedItems] = useState<BatchPhotoItem[]>([]);
  const [batchLocationData, setBatchLocationData] = useState<LocationData | null>(null);

  // Background analysis queue: photos captured/imported in multi-shot mode start analyzing the
  // moment they are added (see CameraView's onQueuePhotos), not only once the batch modal is
  // opened, so shooting is never blocked on waiting for AI results. Failures retry automatically.
  const batchAnalyzer: Analyzer = useCallback(
    async (item, hooks) => {
      if (!userApiKey) {
        const err = new AnalyzeError('Gemini APIキーが設定されていません。', { code: 'API_KEY_REQUIRED', retryable: false });
        throw err;
      }
      const { analysis } = await analyzePhoto({
        dataUrl: item.dataUrl,
        petProfiles,
        namingConfig,
        userApiKey,
        focusPoint: item.focusPoint,
        location: item.location ?? batchLocationData,
        capturedDate: item.capturedDate,
        onRetry: hooks.onRetry,
        onSlow: hooks.onSlow,
      });
      return analysis;
    },
    [userApiKey, petProfiles, namingConfig, batchLocationData]
  );
  const { queue: batchQueue, items: batchQueueItems } = useAnalysisQueue(batchAnalyzer, () => setIsApiKeyModalOpen(true));
  const batchQueueItemsById = useMemo(() => {
    const map = new Map<string, BatchPhotoItem>();
    batchQueueItems.forEach((i) => map.set(i.id, i));
    return map;
  }, [batchQueueItems]);

  // Main Photo Analysis Handler (single-shot / gallery-single-import path).
  // Retries, timeouts and the "server is slow" notice are all handled by analyzeClient.analyzePhoto -
  // see that file for the Render free-plan cold-start note.
  const handleCaptureImage = async (
    dataUrl: string,
    focusPoint?: FocusPoint,
    location?: LocationData | null,
    capturedDate?: string | null
  ) => {
    if (!userApiKey) {
      setIsApiKeyModalOpen(true);
      setAnalysisError('写真の解析にはご自身のGemini APIキーが必要です。画面上のキー設定から無料APIキーを入力してください。');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisNotice(null);
    wakeServer();

    try {
      const { analysis } = await analyzePhoto({
        dataUrl,
        petProfiles,
        namingConfig,
        userApiKey,
        focusPoint,
        location,
        capturedDate,
        onConverted: setCurrentImageDataUrl,
        onRetry: (info) =>
          setAnalysisNotice(`サーバーが混み合っています。自動で再試行します (${info.attempt}/${info.max}回目)...`),
        onSlow: () => setAnalysisNotice('サーバーの起動待ちのようです。もうしばらくお待ちください...'),
      });
      setCurrentAnalysis(analysis);
    } catch (err: any) {
      console.error('Failed to analyze photo:', err);
      if (err instanceof AnalyzeError && (err.code === 'API_KEY_REQUIRED' || err.code === 'API_KEY_INVALID')) {
        setIsApiKeyModalOpen(true);
      }
      setAnalysisError(err.message || 'AI解析処理でエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsAnalyzing(false);
      setAnalysisNotice(null);
    }
  };

  // Adds photos to the background queue as soon as they are captured/imported (multi-shot mode) -
  // analysis starts immediately, while the user is still free to keep shooting.
  const handleQueuePhotosForAnalysis = (items: BatchPhotoItem[], location?: LocationData | null) => {
    if (!userApiKey) {
      setIsApiKeyModalOpen(true);
      setAnalysisError('一括写真解析にはご自身のGemini APIキーが必要です。画面上のキー設定から無料APIキーを入力してください。');
      return;
    }
    if (location) setBatchLocationData(location);
    batchQueue.add(items);
  };

  // Opens the results screen for the current queue (most items are typically already
  // analyzing or done in the background by the time the user taps this).
  const handleStartBatchAnalysis = (items: BatchPhotoItem[], location?: LocationData | null) => {
    if (!userApiKey) {
      setIsApiKeyModalOpen(true);
      setAnalysisError('一括写真解析にはご自身のGemini APIキーが必要です。画面上のキー設定から無料APIキーを入力してください。');
      return;
    }
    if (location) setBatchLocationData(location);
    // Fallback: pick up any item that, for whatever reason, never made it into the
    // background queue (e.g. it was added before the queue was ready).
    const missing = items.filter((i) => !batchQueue.has(i.id));
    if (missing.length > 0) batchQueue.add(missing);
    setBatchQueuedItems(items);
    setIsBatchModalOpen(true);
  };

  // The original-quality photo goes to IndexedDB; only a small thumbnail is kept inline (see photoStore.ts).
  const handleSaveToGallery = async (photo: SavedPhoto) => {
    const stored = await storePhoto(photo);
    setSavedPhotos((prev) => [stored, ...prev]);
  };

  const handleSaveMultipleToGallery = async (photos: SavedPhoto[]) => {
    const stored: SavedPhoto[] = [];
    for (const photo of photos) {
      // One at a time to keep peak memory low on phones.
      stored.push(await storePhoto(photo));
    }
    setSavedPhotos((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newUnique = stored.filter((p) => !existingIds.has(p.id));
      return [...newUnique, ...prev];
    });
  };

  const handleAddPet = (pet: PetProfile) => {
    setPetProfiles((prev) => [...prev, pet]);
  };

  const handleDeletePet = (id: string) => {
    setPetProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDeletePhoto = (id: string) => {
    setSavedPhotos((prev) => prev.filter((p) => p.id !== id));
    void deleteFullImages([id]);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedPhotos.length}
        petCount={petProfiles.length}
        hasApiKey={!!userApiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        isDriveConnected={isDriveConnected}
        lastBackupTime={lastBackupTime}
      />

      {/* Main View Area */}
      <main className="flex-1 p-3 sm:p-5 md:p-8 max-w-6xl mx-auto w-full space-y-6 pb-28">
        {analysisNotice && !analysisError && (
          <div className="p-3.5 bg-indigo-950/60 border border-indigo-800 text-indigo-200 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xl backdrop-blur-md">
            <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            <span>{analysisNotice}</span>
          </div>
        )}

        {analysisError && (
          <div className="p-4 bg-red-950/60 border border-red-800 text-red-200 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xl backdrop-blur-md">
            <span>{analysisError}</span>
            <button
              onClick={() => setAnalysisError(null)}
              className="text-red-400 font-bold hover:underline ml-2"
            >
              閉じる
            </button>
          </div>
        )}

        {/* App Update Available Banner (native Android app only) */}
        {updateInfo?.available && !updateBannerDismissed && (
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  新しいバージョン (v{updateInfo.latestVersion}) が利用可能です
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  現在: v{CURRENT_APP_VERSION} → 最新版をダウンロードして更新できます
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <a
                href={updateInfo.downloadUrl}
                target="_system"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none text-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
              >
                ダウンロード
              </a>
              <button
                onClick={() => setUpdateBannerDismissed(true)}
                className="p-2 text-slate-500 hover:text-white transition"
                title="閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Gallery storage full warning */}
        {storageWarning && (
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl flex items-start justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">ギャラリーの保存容量がいっぱいです</p>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{storageWarning}</p>
              </div>
            </div>
            <button
              onClick={() => setStorageWarning(null)}
              className="p-2 text-slate-500 hover:text-white transition shrink-0"
              title="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* API Key Recommendation Banner if not set */}
        {!userApiKey && (
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  自分専用のGemini APIキーを設定して使い放題にしよう！
                </p>
                <p className="text-[11px] text-slate-400">
                  Google AI Studioで無料・1分で取得可能。混雑時も制限なしで高速解析できます。
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition shrink-0 whitespace-nowrap"
            >
              無料キーを設定する
            </button>
          </div>
        )}

        {activeTab === 'camera' && (
          <div className="space-y-6">
            <CameraView
              onCaptureImage={handleCaptureImage}
              onStartBatchAnalysis={handleStartBatchAnalysis}
              onQueuePhotos={handleQueuePhotosForAnalysis}
              onRemoveQueuedPhoto={(id) => batchQueue.remove(id)}
              onClearQueuedPhotos={() => batchQueue.clear()}
              queueStatusById={batchQueueItemsById}
              isAnalyzing={isAnalyzing}
              analysisNotice={analysisNotice}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              savedCount={savedPhotos.length}
              petCount={petProfiles.length}
              photoQuality={namingConfig.photoQuality}
            />
          </div>
        )}

        {activeTab === 'gallery' && (
          <PhotoGallery photos={savedPhotos} onDeletePhoto={handleDeletePhoto} />
        )}

        {activeTab === 'pets' && (
          <PetManagerModal
            petProfiles={petProfiles}
            onAddPet={handleAddPet}
            onDeletePet={handleDeletePet}
          />
        )}

        {activeTab === 'rules' && (
          <NamingRulesModal config={namingConfig} onUpdateConfig={setNamingConfig} />
        )}

        {activeTab === 'guide' && (
          <ExplanationCard
            onSelectSample={handleCaptureImage}
            isAnalyzing={isAnalyzing}
          />
        )}
      </main>

      {/* Analysis Output Modal (Single Photo) */}
      {currentAnalysis && currentImageDataUrl && (
        <AnalysisModal
          imageDataUrl={currentImageDataUrl}
          analysis={currentAnalysis}
          petProfiles={petProfiles}
          onSaveToGallery={handleSaveToGallery}
          onRegisterPet={handleAddPet}
          onReAnalyzeWithFocus={handleCaptureImage}
          isAnalyzing={isAnalyzing}
          onClose={() => {
            setCurrentAnalysis(null);
            setCurrentImageDataUrl(null);
          }}
        />
      )}

      {/* Batch Analysis Modal (Multiple Photos) - shows the live background queue */}
      <BatchAnalysisModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        queuedItemIds={batchQueuedItems.map((i) => i.id)}
        queue={batchQueue}
        liveItems={batchQueueItems}
        onSaveToGallery={handleSaveMultipleToGallery}
        locationData={batchLocationData}
      />

      {/* API Key Settings Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={userApiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      {/* Data Backup & Restore Modal */}
      <DataBackupModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        petProfiles={petProfiles}
        savedPhotos={savedPhotos}
        namingConfig={namingConfig}
        onRestoreData={handleRestoreData}
        isAutoBackupEnabled={isAutoBackupEnabled}
        onToggleAutoBackup={handleToggleAutoBackup}
        lastBackupTime={lastBackupTime}
        onBackupSuccess={handleUpdateLastBackupTime}
      />

      {/* Theme Settings Modal */}
      <ThemeSettingsModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={theme}
        onSelectTheme={setTheme}
      />

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedPhotos.length}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Modern Footer */}
      <footer className="py-6 pb-24 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md text-center text-xs text-slate-500 font-medium">
        <p className="max-w-md mx-auto px-4 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          いちいち面倒なカメラアプリ v{APP_VERSION} — Gemini Vision (端末バックアップ対応)
        </p>
      </footer>
    </div>
  );
}
