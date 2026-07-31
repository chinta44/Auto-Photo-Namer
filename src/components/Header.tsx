import React from 'react';
import { Camera, Image as ImageIcon, Dog, Settings, HelpCircle, Sparkles, Zap } from 'lucide-react';

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
    <header id="main-header" className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 text-white shadow-2xl">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => setActiveTab('camera')}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-10 h-10 bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg">
              <img src="/favicon.jpg" alt="いちいち面倒なカメラアプリ" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base md:text-lg tracking-tight text-white flex items-center gap-1.5">
                いちいち面倒な<span className="text-indigo-400">カメラアプリ</span>
              </h1>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Gemini Vision
              </span>
              <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-bold rounded-md">
                v1.2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              写真の命名・文字起こし・自動仕分けはおまかせ
            </p>
          </div>
        </div>

        {/* Desktop / Tablet Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <button
            id="nav-camera"
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'camera'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            カメラ撮影
          </button>

          <button
            id="nav-gallery"
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'gallery'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            保存済み
            {savedCount > 0 && (
              <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                activeTab === 'gallery' ? 'bg-indigo-950 text-indigo-200' : 'bg-slate-800 text-indigo-400 border border-indigo-500/30'
              }`}>
                {savedCount}
              </span>
            )}
          </button>

          <button
            id="nav-pets"
            onClick={() => setActiveTab('pets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'pets'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Dog className="w-4 h-4" />
            ペット識別
            {petCount > 0 && (
              <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                activeTab === 'pets' ? 'bg-indigo-950 text-pink-300' : 'bg-slate-800 text-pink-400 border border-pink-500/30'
              }`}>
                {petCount}
              </span>
            )}
          </button>

          <button
            id="nav-rules"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            命名ルール
          </button>

          <button
            id="nav-guide"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'guide'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 font-extrabold'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            無課金ガイド
          </button>
        </nav>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-2 py-1.5 justify-around text-xs font-semibold text-slate-400">
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'camera' ? 'bg-indigo-600 text-white font-extrabold shadow-md' : 'hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          カメラ
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl relative transition-all ${
            activeTab === 'gallery' ? 'bg-indigo-600 text-white font-extrabold shadow-md' : 'hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          ギャラリー
          {savedCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('pets')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'pets' ? 'bg-indigo-600 text-white font-extrabold shadow-md' : 'hover:text-slate-200'
          }`}
        >
          <Dog className="w-4 h-4" />
          ペット
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'rules' ? 'bg-indigo-600 text-white font-extrabold shadow-md' : 'hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          ルール
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'guide' ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md' : 'text-emerald-400 hover:bg-emerald-500/10'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Q&A
        </button>
      </div>
    </header>
  );
};

