import React from 'react';
import { NamingRuleConfig } from '../types';
import { Settings, Sparkles, Check, FileCode } from 'lucide-react';

interface NamingRulesProps {
  config: NamingRuleConfig;
  onUpdateConfig: (config: NamingRuleConfig) => void;
}

export const NamingRulesModal: React.FC<NamingRulesProps> = ({ config, onUpdateConfig }) => {
  const handleChange = <K extends keyof NamingRuleConfig>(key: K, value: NamingRuleConfig[K]) => {
    onUpdateConfig({
      ...config,
      [key]: value,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl text-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold shadow-sm">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-white tracking-tight">AI自動命名ルールのカスタマイズ</h2>
            <p className="text-xs text-slate-400 font-medium">
              日付フォーマットや区切り記号、カテゴリ情報を含めるかどうかなど、生成ファイル名のルールのカスタマイズが可能です。
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-slate-100">
        {/* Date Format */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">日付の書き方:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold">
            {[
              { id: 'YYYYMMDD', label: '20260729 (8桁数字)' },
              { id: 'YYYY-MM-DD', label: '2026-07-29 (ハイフン)' },
              { id: 'None', label: '日付を含めない' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleChange('dateFormat', item.id as any)}
                className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                  config.dateFormat === item.id
                    ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">単語の区切り文字:</label>
          <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
            {[
              { id: '_', label: '_ (アンダースコア)' },
              { id: '-', label: '- (ハイフン)' },
              { id: ' ', label: ' (スペース)' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleChange('separator', item.id as any)}
                className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                  config.separator === item.id
                    ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Option toggles */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <label className="flex items-center justify-between cursor-pointer p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div>
              <p className="text-xs font-bold text-white">ファイル名に「カテゴリ名（領収書/商品等）」を含める</p>
              <p className="text-[11px] text-slate-400 font-medium">例: 20260729_領収書_セブンイレブン.jpg</p>
            </div>
            <input
              type="checkbox"
              checked={config.includeCategory}
              onChange={(e) => handleChange('includeCategory', e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div>
              <p className="text-xs font-bold text-white">領収書の場合、金額もファイル名に自動挿入する</p>
              <p className="text-[11px] text-slate-400 font-medium">例: セブンイレブン_1280円.jpg</p>
            </div>
            <input
              type="checkbox"
              checked={config.includeAmount}
              onChange={(e) => handleChange('includeAmount', e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
          </label>
        </div>

        {/* Preview example */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 shadow-inner">
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-mono font-bold tracking-wider">
            <FileCode className="w-4 h-4" />
            LIVE PREVIEW (命名設定のプレビュー):
          </div>
          <p className="font-mono text-sm text-emerald-400 font-bold bg-slate-900 p-3 rounded-xl border border-slate-800/80">
            {config.dateFormat === 'YYYYMMDD' ? '20260729' : config.dateFormat === 'YYYY-MM-DD' ? '2026-07-29' : ''}
            {config.dateFormat !== 'None' ? config.separator : ''}
            {config.includeCategory ? `領収書${config.separator}` : ''}
            セブンイレブン
            {config.includeAmount ? `${config.separator}1280円` : ''}.jpg
          </p>
        </div>
      </div>
    </div>
  );
};
