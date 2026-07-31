import React from 'react';
import { Camera, Image as ImageIcon, Dog, Settings, HelpCircle, Sparkles, KeyRound } from 'lucide-react';
import { APP_VERSION } from '../version';

interface HeaderProps {
  activeTab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide';
  setActiveTab: (tab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide') => void;
  savedCount: number;
  petCount: number;
  hasApiKey: boolean;
  onOpenApiKey: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  petCount,
  hasApiKey,
  onOpenApiKey,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#1A1A1A] border-b border-[#3A3A3A] text-[#F2F0EC]">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border border-[#3A3A3A] bg-[#242424] flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-[#7FDBCA]" />
          </div>
          <div>
            <h1 className="font-semibold text-sm md:text-base leading-tight tracking-tight text-[#F2F0EC] flex items-center gap-2">
              SmartName AI
              <span className="text-[9px] font-mono font-normal text-[#9A9890] border border-[#3A3A3A] rounded px-1 py-0.5">
                v{APP_VERSION}
              </span>
            </h1>
            <p className="text-[10px] text-[#9A9890] font-mono tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7FDBCA] inline-block"></span>
              AI自動写真命名カメラ · Gemini Vision (ブラウザ完結)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop / Tablet Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-[#242424] p-1 rounded-xl border border-[#3A3A3A]">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                activeTab === 'camera' ? 'bg-[#7FDBCA] text-[#0F1E1C] font-semibold' : 'text-[#9A9890] hover:text-[#F2F0EC]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              カメラ撮影
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                activeTab === 'gallery' ? 'bg-[#7FDBCA] text-[#0F1E1C] font-semibold' : 'text-[#9A9890] hover:text-[#F2F0EC]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              保存済み
              {savedCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-[#0F1E1C]/20 text-[10px] font-mono font-semibold rounded-full">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pets')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                activeTab === 'pets' ? 'bg-[#7FDBCA] text-[#0F1E1C] font-semibold' : 'text-[#9A9890] hover:text-[#F2F0EC]'
              }`}
            >
              <Dog className="w-3.5 h-3.5" />
              ペット登録
              {petCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-[#0F1E1C]/20 text-[10px] font-mono font-semibold rounded-full">
                  {petCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                activeTab === 'rules' ? 'bg-[#7FDBCA] text-[#0F1E1C] font-semibold' : 'text-[#9A9890] hover:text-[#F2F0EC]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              命名ルール
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                activeTab === 'guide' ? 'bg-[#E8B04B] text-[#1A1A1A] font-semibold' : 'text-[#E8B04B]/80 hover:text-[#E8B04B]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              無課金ガイド
            </button>
          </nav>

          {/* API Key button (always visible) */}
          <button
            onClick={onOpenApiKey}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              hasApiKey
                ? 'bg-[#242424] border-[#3A3A3A] text-[#9A9890] hover:text-[#F2F0EC]'
                : 'bg-[#E8B04B]/10 border-[#E8B04B]/40 text-[#E8B04B]'
            }`}
            title="Gemini APIキー設定"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{hasApiKey ? 'APIキー' : 'キー未設定'}</span>
            {!hasApiKey && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E8B04B]" />}
          </button>
        </div>
      </div>

      {/* Mobile Tab bar at bottom / subheader for smaller screens */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-[#3A3A3A] bg-[#1A1A1A]/95 backdrop-blur-md px-1 py-1.5 justify-around text-xs">
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${activeTab === 'camera' ? 'text-[#7FDBCA]' : 'text-[#9A9890]'}`}
        >
          <Camera className="w-4 h-4" />
          <span className="text-[10px]">カメラ</span>
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg relative ${activeTab === 'gallery' ? 'text-[#7FDBCA]' : 'text-[#9A9890]'}`}
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-[10px]">保存画像</span>
          {savedCount > 0 && <span className="absolute top-0.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#E8B04B]"></span>}
        </button>
        <button
          onClick={() => setActiveTab('pets')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${activeTab === 'pets' ? 'text-[#7FDBCA]' : 'text-[#9A9890]'}`}
        >
          <Dog className="w-4 h-4" />
          <span className="text-[10px]">ペット</span>
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${activeTab === 'rules' ? 'text-[#7FDBCA]' : 'text-[#9A9890]'}`}
        >
          <Settings className="w-4 h-4" />
          <span className="text-[10px]">ルール</span>
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${activeTab === 'guide' ? 'text-[#E8B04B]' : 'text-[#9A9890]'}`}
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-[10px]">Q&A</span>
        </button>
        <button
          onClick={onOpenApiKey}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg relative ${hasApiKey ? 'text-[#9A9890]' : 'text-[#E8B04B]'}`}
        >
          <KeyRound className="w-4 h-4" />
          <span className="text-[10px]">キー</span>
          {!hasApiKey && <span className="absolute top-0.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#E8B04B]"></span>}
        </button>
      </div>
    </header>
  );
};
