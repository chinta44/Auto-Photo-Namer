import React from 'react';
import { Key } from 'lucide-react';

interface HeaderProps {
  activeTab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide';
  setActiveTab: (tab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide') => void;
  savedCount: number;
  petCount: number;
  hasApiKey?: boolean;
  onOpenApiKeyModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  petCount,
  hasApiKey = false,
  onOpenApiKeyModal,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 text-white shadow-2xl">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* App Title & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => setActiveTab('camera')}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-10 h-10 bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg">
              <img src="/apple-touch-icon.png?v=1.4.0" alt="いちいち面倒なカメラアプリ" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h1 className="font-extrabold text-base md:text-lg tracking-tight text-white flex items-center gap-1.5">
                いちいち面倒な<span className="text-indigo-400">カメラアプリ</span>
              </h1>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Gemini Vision
              </span>
              <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-bold rounded-md">
                v1.4.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              写真の命名・文字起こし・自動仕分けはおまかせ
            </p>
          </div>
        </div>

        {/* API Key setting button on the right */}
        <div className="flex items-center gap-2">
          {onOpenApiKeyModal && (
            <button
              onClick={onOpenApiKeyModal}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                hasApiKey
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 animate-pulse'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">
                {hasApiKey ? 'My APIキー設定済み' : '自分のAPIキーを設定'}
              </span>
              <span className="sm:hidden">
                {hasApiKey ? 'Key設定済' : 'Key設定'}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
