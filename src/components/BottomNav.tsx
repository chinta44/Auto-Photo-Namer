import React from 'react';
import { Camera, Image as ImageIcon, Dog, Settings, HelpCircle, Key } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide';
  setActiveTab: (tab: 'camera' | 'gallery' | 'pets' | 'rules' | 'guide') => void;
  savedCount: number;
  onOpenApiKeyModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  onOpenApiKeyModal,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b0f19]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 shadow-2xl">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {/* カメラ */}
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'camera'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className={`w-5 h-5 ${activeTab === 'camera' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
          <span className="text-[10px] sm:text-[11px] tracking-tight">カメラ</span>
        </button>

        {/* 保存画像 */}
        <button
          onClick={() => setActiveTab('gallery')}
          className={`relative flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'gallery'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ImageIcon className={`w-5 h-5 ${activeTab === 'gallery' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-[#0b0f19]" />
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] tracking-tight">保存画像</span>
        </button>

        {/* ペット */}
        <button
          onClick={() => setActiveTab('pets')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'pets'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dog className={`w-5 h-5 ${activeTab === 'pets' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
          <span className="text-[10px] sm:text-[11px] tracking-tight">ペット</span>
        </button>

        {/* ルール */}
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'rules'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className={`w-5 h-5 ${activeTab === 'rules' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
          <span className="text-[10px] sm:text-[11px] tracking-tight">ルール</span>
        </button>

        {/* Q&A */}
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'guide'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className={`w-5 h-5 ${activeTab === 'guide' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
          <span className="text-[10px] sm:text-[11px] tracking-tight">Q&A</span>
        </button>

        {/* キー */}
        <button
          onClick={onOpenApiKeyModal}
          className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-slate-400 hover:text-cyan-400 transition-all"
        >
          <Key className="w-5 h-5" />
          <span className="text-[10px] sm:text-[11px] tracking-tight">キー</span>
        </button>
      </div>
    </nav>
  );
};
