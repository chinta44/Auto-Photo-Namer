import React from 'react';
import { Camera, Image as ImageIcon, Dog, Settings, HelpCircle, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide';
  setActiveTab: (tab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide') => void;
  savedCount: number;
  petCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  petCount,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-indigo-600 shadow-xl border-b border-indigo-700 text-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-indigo-950 animate-pulse" />
          </div>
          <div>
            <h1 className="font-black text-base md:text-lg leading-tight tracking-tight uppercase text-white flex items-center gap-2">
              SmartName AI
              <span className="hidden sm:inline-block px-2 py-0.5 bg-yellow-400 text-indigo-950 text-[10px] font-black rounded-full uppercase">
                無料モデル
              </span>
            </h1>
            <p className="text-[11px] text-indigo-200 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping"></span>
              AI自動写真命名カメラ (Gemini Vision)
            </p>
          </div>
        </div>

        {/* Desktop / Tablet Nav */}
        <nav className="hidden md:flex items-center gap-1.5 bg-indigo-700/60 p-1.5 rounded-xl border border-indigo-500/40">
          <button
            id="nav-camera"
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-indigo-900 shadow-md font-extrabold'
                : 'text-indigo-100 hover:bg-white/10'
            }`}
          >
            <Camera className="w-4 h-4" />
            カメラ撮影
          </button>

          <button
            id="nav-gallery"
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'gallery'
                ? 'bg-white text-indigo-900 shadow-md font-extrabold'
                : 'text-indigo-100 hover:bg-white/10'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            保存済み
            {savedCount > 0 && (
              <span className="ml-0.5 px-2 py-0.5 bg-yellow-400 text-indigo-950 text-[10px] font-bold rounded-full">
                {savedCount}
              </span>
            )}
          </button>

          <button
            id="nav-pets"
            onClick={() => setActiveTab('pets')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'pets'
                ? 'bg-white text-indigo-900 shadow-md font-extrabold'
                : 'text-indigo-100 hover:bg-white/10'
            }`}
          >
            <Dog className="w-4 h-4" />
            ペット登録
            {petCount > 0 && (
              <span className="ml-0.5 px-2 py-0.5 bg-pink-400 text-white text-[10px] font-bold rounded-full">
                {petCount}
              </span>
            )}
          </button>

          <button
            id="nav-rules"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'rules'
                ? 'bg-white text-indigo-900 shadow-md font-extrabold'
                : 'text-indigo-100 hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
            命名ルール
          </button>

          <button
            id="nav-guide"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'guide'
                ? 'bg-yellow-400 text-indigo-950 shadow-md font-extrabold'
                : 'text-yellow-300 hover:bg-white/10'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            無課金ガイド
          </button>
        </nav>
      </div>

      {/* Mobile Tab bar at bottom / subheader for smaller screens */}
      <div className="md:hidden flex border-t border-indigo-700 bg-indigo-700/80 backdrop-blur-md px-2 py-1.5 justify-around text-xs font-bold text-indigo-100">
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${
            activeTab === 'camera' ? 'bg-white text-indigo-950 font-black' : 'text-indigo-100'
          }`}
        >
          <Camera className="w-4 h-4" />
          カメラ
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg relative ${
            activeTab === 'gallery' ? 'bg-white text-indigo-950 font-black' : 'text-indigo-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          保存画像
          {savedCount > 0 && (
            <span className="absolute top-0.5 right-1.5 w-2 h-2 rounded-full bg-yellow-400"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('pets')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${
            activeTab === 'pets' ? 'bg-white text-indigo-950 font-black' : 'text-indigo-100'
          }`}
        >
          <Dog className="w-4 h-4" />
          ペット
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${
            activeTab === 'rules' ? 'bg-white text-indigo-950 font-black' : 'text-indigo-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          ルール
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg ${
            activeTab === 'guide' ? 'bg-yellow-400 text-indigo-950 font-black' : 'text-yellow-300'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Q&A
        </button>
      </div>
    </header>
  );
};
