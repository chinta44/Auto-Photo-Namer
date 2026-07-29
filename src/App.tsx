/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { AnalysisModal } from './components/AnalysisModal';
import { PetManagerModal } from './components/PetManagerModal';
import { PhotoGallery } from './components/PhotoGallery';
import { NamingRulesModal } from './components/NamingRulesModal';
import { ExplanationCard } from './components/ExplanationCard';
import { AnalysisResult, PetProfile, SavedPhoto, NamingRuleConfig } from './types';
import { Sparkles, Camera } from 'lucide-react';

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

  // Main Photo Analysis Handler
  const handleCaptureImage = async (dataUrl: string) => {
    setCurrentImageDataUrl(dataUrl);
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: 'image/jpeg',
          petProfiles,
          namingConfig,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned error status ${res.status}`);
      }

      const data: AnalysisResult = await res.json();
      setCurrentAnalysis(data);
    } catch (err: any) {
      console.error('Failed to analyze photo:', err);
      setAnalysisError('AI解析処理でエラーが発生しました。もう一度お試しください。');
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

      {/* Simple Footer */}
      <footer className="hidden md:block py-6 border-t border-[#3A3A3A] bg-[#1A1A1A] text-center text-xs text-[#9A9890] font-medium">
        <p className="max-w-md mx-auto px-4 flex items-center justify-center gap-2 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7FDBCA]"></span>
          SmartName AI — Google Gemini Vision API (完全無料モデル対応)
        </p>
      </footer>
    </div>
  );
}
