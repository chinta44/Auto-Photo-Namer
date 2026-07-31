import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { AnalysisModal } from './components/AnalysisModal';
import { PetManagerModal } from './components/PetManagerModal';
import { PhotoGallery } from './components/PhotoGallery';
import { NamingRulesModal } from './components/NamingRulesModal';
import { ExplanationCard } from './components/ExplanationCard';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AnalysisResult, PetProfile, SavedPhoto, NamingRuleConfig } from './types';
import { analyzePhotoInBrowser, GeminiClientError } from './lib/geminiClient';
import { convertToJpegBase64 } from './utils/imageUtils';
import { APP_VERSION } from './version';

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

  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('smartname_gemini_api_key') || '';
    } catch (e) {
      return '';
    }
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

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

  // Show the API key modal automatically on first launch if no key is set yet
  useEffect(() => {
    if (!apiKey) {
      setShowApiKeyModal(true);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    try {
      if (key) {
        localStorage.setItem('smartname_gemini_api_key', key);
      } else {
        localStorage.removeItem('smartname_gemini_api_key');
      }
    } catch (e) {}
  };

  // Main Photo Analysis Handler — calls Gemini directly from the browser, no backend involved
  const handleCaptureImage = async (rawDataUrl: string) => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // サンプル写真(SVG)やその他の形式でも、Gemini APIが確実に読める
      // JPEGに変換してから送信する。実写真も念のため必ず通す。
      const dataUrl = await convertToJpegBase64(rawDataUrl);
      setCurrentImageDataUrl(dataUrl);

      const data = await analyzePhotoInBrowser({
        imageDataUrl: dataUrl,
        apiKey,
        petProfiles,
        namingConfig,
      });
      setCurrentAnalysis(data);
    } catch (err: any) {
      console.error('Failed to analyze photo:', err);
      const message =
        err instanceof GeminiClientError
          ? err.message
          : 'AI解析処理でエラーが発生しました。もう一度お試しください。';
      setAnalysisError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToGallery = (photo: SavedPhoto) => {
    setSavedPhotos((prev) => [photo, ...prev]);
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
    <div className="min-h-screen bg-[#1A1A1A] text-[#F2F0EC] flex flex-col font-sans antialiased selection:bg-[#7FDBCA] selection:text-[#0F1E1C]">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedPhotos.length}
        petCount={petProfiles.length}
        hasApiKey={!!apiKey}
        onOpenApiKey={() => setShowApiKeyModal(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6 pb-24 md:pb-8">
        {analysisError && (
          <div className="p-4 bg-[#2C1414] border border-[#7A2E2E] text-[#F0B8B8] rounded-xl text-xs font-medium flex items-center justify-between">
            <span>{analysisError}</span>
            <button
              onClick={() => setAnalysisError(null)}
              className="text-[#F0B8B8] font-semibold hover:underline shrink-0 ml-3"
            >
              閉じる
            </button>
          </div>
        )}

        {activeTab === 'camera' && (
          <div className="space-y-6">
            <CameraView
              onCaptureImage={handleCaptureImage}
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

      {/* Analysis Output Modal */}
      {currentAnalysis && currentImageDataUrl && (
        <AnalysisModal
          imageDataUrl={currentImageDataUrl}
          analysis={currentAnalysis}
          petProfiles={petProfiles}
          onSaveToGallery={handleSaveToGallery}
          onRegisterPet={handleAddPet}
          onClose={() => {
            setCurrentAnalysis(null);
            setCurrentImageDataUrl(null);
          }}
        />
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal
          currentKey={apiKey}
          onSave={handleSaveApiKey}
          onClose={() => setShowApiKeyModal(false)}
        />
      )}

      {/* Simple Footer */}
      <footer className="hidden md:block py-6 border-t border-[#3A3A3A] bg-[#1A1A1A] text-center text-xs text-[#9A9890] font-medium">
        <p className="max-w-md mx-auto px-4 flex items-center justify-center gap-2 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7FDBCA]"></span>
          SmartName AI v{APP_VERSION} — Gemini Vision API 直接呼び出し・サーバーレス版
        </p>
      </footer>
    </div>
  );
}
