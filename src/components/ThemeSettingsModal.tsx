import React from 'react';
import { X, Palette, Check } from 'lucide-react';

export type ThemeId = 'ocean' | 'forest' | 'sunset' | 'mono';

interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  swatch: string[]; // preview dot colors: [background, accent1, accent2]
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'ocean',
    name: 'オーシャンブルー',
    description: '現在の配色（黒 × ブルー系）',
    swatch: ['#0f172a', '#4f46e5', '#22d3ee'],
  },
  {
    id: 'forest',
    name: 'フォレストグリーン',
    description: '黒（ニュートラル）× エメラルド系',
    swatch: ['#18181b', '#059669', '#2dd4bf'],
  },
  {
    id: 'sunset',
    name: 'サンセットオレンジ',
    description: '黒（ニュートラル）× オレンジ系',
    swatch: ['#18181b', '#ea580c', '#f59e0b'],
  },
  {
    id: 'mono',
    name: 'モノクローム',
    description: '黒 × シルバーグレーの落ち着いた配色',
    swatch: ['#18181b', '#a1a1aa', '#71717a'],
  },
];

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">デザインテーマ</h3>
              <p className="text-xs text-slate-400">好きな配色に切り替えられます</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {THEME_OPTIONS.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => onSelectTheme(theme.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition text-left ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/50 shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                {/* Color swatch preview */}
                <div className="shrink-0 w-14 h-14 rounded-2xl overflow-hidden border border-slate-700/80 flex items-center justify-center relative">
                  <div className="absolute inset-0" style={{ backgroundColor: theme.swatch[0] }} />
                  <div className="relative flex gap-1">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.swatch[1] }} />
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.swatch[2] }} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white">{theme.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{theme.description}</p>
                </div>

                {isSelected && (
                  <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 text-center text-[11px] text-slate-500 font-medium">
          <p>選択したテーマはこの端末のブラウザに保存され、次回起動時も引き継がれます。</p>
        </div>
      </div>
    </div>
  );
};
