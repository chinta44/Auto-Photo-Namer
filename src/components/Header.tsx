import React from 'react';
import { Key, Sparkles, HardDrive, Palette } from 'lucide-react';

interface HeaderProps {
  activeTab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide';
  setActiveTab: (tab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide') => void;
  savedCount: number;
  petCount: number;
  hasApiKey?: boolean;
  onOpenApiKeyModal?: () => void;
  onOpenDriveModal?: () => void;
  onOpenThemeModal?: () => void;
  isDriveConnected?: boolean;
  lastBackupTime?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  petCount,
  hasApiKey = false,
  onOpenApiKeyModal,
  onOpenDriveModal,
  onOpenThemeModal,
  isDriveConnected = false,
  lastBackupTime,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#0b0f19]/90 backdrop-blur-xl border-b border-slate-800/80 text-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* App Title & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer shrink-0" onClick={() => setActiveTab('camera')}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-10 h-10 bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg">
              <img
                src="/favicon.png"
                alt="いちいち面倒なカメラアプリ"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1">
                いちいち面倒な<span className="text-cyan-400">カメラアプリ</span>
              </h1>
              <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono font-bold rounded-md">
                v1.6.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse shrink-0"></span>
              Gemini Vision (ブラウザ完結) · 写真の命名・文字起こし・自動仕分け
            </p>
          </div>
        </div>

        {/* Header Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Theme Settings Modal Button */}
          {onOpenThemeModal && (
            <button
              onClick={onOpenThemeModal}
              title="デザインテーマを変更"
              className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition shadow-sm"
            >
              <Palette className="w-4 h-4 text-indigo-400" />
            </button>
          )}

          {/* Drive Backup Modal Button */}
          {onOpenDriveModal && (
            <button
              onClick={onOpenDriveModal}
              title={lastBackupTime ? `データ保存済み (最終保存: ${lastBackupTime})` : 'データバックアップ＆復元'}
              className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition shadow-sm"
            >
              <HardDrive className="w-4 h-4 text-indigo-400" />
            </button>
          )}

          {/* API Key Modal Button */}
          {onOpenApiKeyModal && (
            <button
              onClick={onOpenApiKeyModal}
              title={hasApiKey ? 'APIキー設定済み' : 'APIキーを設定'}
              className={`p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border transition shadow-sm ${
                hasApiKey
                  ? 'border-emerald-500/40 text-emerald-400'
                  : 'border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

