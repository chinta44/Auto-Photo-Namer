import React from 'react';
import { Key, Sparkles, HardDrive } from 'lucide-react';

interface HeaderProps {
  activeTab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide';
  setActiveTab: (tab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide') => void;
  savedCount: number;
  petCount: number;
  hasApiKey?: boolean;
  onOpenApiKeyModal?: () => void;
  onOpenDriveModal?: () => void;
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
  isDriveConnected = false,
  lastBackupTime,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#0b0f19]/90 backdrop-blur-xl border-b border-slate-800/80 text-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* App Title & Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-md cursor-pointer hover:border-cyan-500/50 transition-all shrink-0"
            onClick={() => setActiveTab('camera')}
          >
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                SmartName AI
              </h1>
              <span className="px-1.5 py-0.5 bg-slate-800/90 text-slate-400 text-[10px] font-mono font-medium rounded border border-slate-700/60">
                v1.0.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse shrink-0"></span>
              AI自動写真命名カメラ · Gemini Vision (ブラウザ完結)
            </p>
          </div>
        </div>

        {/* Header Right Action Buttons */}
        <div className="flex items-center gap-2">
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

