/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { AnalysisModal } from './components/AnalysisModal';
import { BatchAnalysisModal } from './components/BatchAnalysisModal';
import { PetManagerModal } from './components/PetManagerModal';
import { PhotoGallery } from './components/PhotoGallery';
import { NamingRulesModal } from './components/NamingRulesModal';
import { ExplanationCard } from './components/ExplanationCard';
import { ApiKeyModal } from './components/ApiKeyModal';
import { DataBackupModal } from './components/DataBackupModal';
import { AnalysisResult, PetProfile, SavedPhoto, NamingRuleConfig, FocusPoint, BatchPhotoItem, LocationData } from './types';
import { convertToJpegBase64 } from './utils/imageUtils';
import { initDriveAuth, getAccessToken, uploadBackupToDrive, BackupDataPayload } from './utils/driveService';
import { Sparkles, Camera, Key } from 'lucide-react';

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

  const [savedPhotos, setSavedPhotos] = useState<SavedPhoto[]>(() => {
    try {
      const saved = localStorage.getItem('auto_photo_saved_library');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [namingConfig, setNamingConfig] = useState<NamingRuleConfig>(() => {
    try {
      const saved = localStorage.getItem('auto_photo_naming_config');
      return saved ? JSON.parse(saved) : DEFAULT_NAMING_CONFIG;
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
          version: '1.6.1',
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

  // Restore data callback from Google Drive
  const handleRestoreData = (payload: BackupDataPayload) => {
    if (payload.petProfiles && Array.isArray(payload.petProfiles)) {
      setPetProfiles(payload.petProfiles);
    }
    if (payload.savedPhotos && Array.isArray(payload.savedPhotos)) {
      setSavedPhotos(payload.savedPhotos);
    }
    if (payload.namingConfig) {
      setNamingConfig(payload.namingConfig);
    }
  };

  // Current capture & analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentImageDataUrl, setCurrentImageDataUrl] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('auto_photo_pet_profiles', JSON.stringify(petProfiles));
    } catch (e) {}
  }, [petProfiles]);

  useEffect(() => {
    try {
      localStorage.setItem('auto_photo_saved_library', JSON.stringify(savedPhotos));
    } catch (e) {}
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

  // Main Photo Analysis Handler
  const handleCaptureImage = async (dataUrl: string, focusPoint?: FocusPoint, location?: LocationData | null) => {
    if (!userApiKey) {
      setIsApiKeyModalOpen(true);
      setAnalysisError('写真の解析にはご自身のGemini APIキーが必要です。画面上のキー設定から無料APIキーを入力してください。');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const converted = await convertToJpegBase64(dataUrl);
      setCurrentImageDataUrl(converted.fullDataUrl);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userApiKey) {
        headers['x-gemini-api-key'] = userApiKey;
      }

      const res = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64: converted.base64Data,
          mimeType: converted.mimeType,
          petProfiles,
          namingConfig,
          focusPoint,
          location,
          customApiKey: userApiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'API_KEY_REQUIRED') {
          setIsApiKeyModalOpen(true);
        }
        throw new Error(data.message || `サーバーエラーが発生しました (${res.status})`);
      }

      setCurrentAnalysis(data as AnalysisResult);
    } catch (err: any) {
      console.error('Failed to analyze photo:', err);
      setAnalysisError(err.message || 'AI解析処理でエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartBatchAnalysis = (items: BatchPhotoItem[], location?: LocationData | null) => {
    if (!userApiKey) {
      setIsApiKeyModalOpen(true);
      setAnalysisError('一括写真解析にはご自身のGemini APIキーが必要です。画面上のキー設定から無料APIキーを入力してください。');
      return;
    }
    setBatchQueuedItems(items);
    setBatchLocationData(location || null);
    setIsBatchModalOpen(true);
  };

  const handleSaveToGallery = (photo: SavedPhoto) => {
    setSavedPhotos((prev) => [photo, ...prev]);
  };

  const handleSaveMultipleToGallery = (photos: SavedPhoto[]) => {
    setSavedPhotos((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newUnique = photos.filter((p) => !existingIds.has(p.id));
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
        isDriveConnected={isDriveConnected}
        lastBackupTime={lastBackupTime}
      />

      {/* Main View Area */}
      <main className="flex-1 p-3 sm:p-5 md:p-8 max-w-6xl mx-auto w-full space-y-6">
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
              isAnalyzing={isAnalyzing}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              savedCount={savedPhotos.length}
              petCount={petProfiles.length}
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

      {/* Batch Analysis Modal (Multiple Photos) */}
      <BatchAnalysisModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        queuedItems={batchQueuedItems}
        petProfiles={petProfiles}
        namingConfig={namingConfig}
        userApiKey={userApiKey}
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

      {/* Modern Footer */}
      <footer className="py-6 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md text-center text-xs text-slate-500 font-medium">
        <p className="max-w-md mx-auto px-4 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          いちいち面倒なカメラアプリ v1.6.1 — Gemini Vision (Google Drive自動バックアップ・純正ICOファビコン統合)
        </p>
      </footer>
    </div>
  );
}
