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
      <div className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A] text-[#7FDBCA] flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-[#F2F0EC] tracking-tight">AI自動命名ルールのカスタマイズ</h2>
            <p className="text-xs text-[#9A9890] leading-relaxed">
              日付フォーマットや区切り記号、カテゴリ情報を含めるかどうかなど、生成ファイル名のルールのカスタマイズが可能です。
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-5 space-y-5">
        {/* Date Format */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#9A9890] tracking-wide">日付の書き方:</label>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            {[
              { id: 'YYYYMMDD', label: '20260729' },
              { id: 'YYYY-MM-DD', label: '2026-07-29' },
              { id: 'None', label: 'なし' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleChange('dateFormat', item.id as any)}
                className={`py-2 px-3 rounded-lg border text-center transition-all ${
                  config.dateFormat === item.id
                    ? 'bg-[#7FDBCA] border-[#7FDBCA] text-[#0F1E1C] font-semibold'
                    : 'bg-[#1A1A1A] border-[#3A3A3A] text-[#9A9890] hover:text-[#F2F0EC]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#9A9890] tracking-wide">単語の区切り文字:</label>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            {[
              { id: '_', label: '_' },
              { id: '-', label: '-' },
              { id: ' ', label: 'スペース' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleChange('separator', item.id as any)}
                className={`py-2 px-3 rounded-lg border text-center transition-all ${
                  config.separator === item.id
                    ? 'bg-[#7FDBCA] border-[#7FDBCA] text-[#0F1E1C] font-semibold'
                    : 'bg-[#1A1A1A] border-[#3A3A3A] text-[#9A9890] hover:text-[#F2F0EC]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Option toggles */}
        <div className="space-y-1 pt-2 border-t border-[#3A3A3A]">
          <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-lg hover:bg-[#1A1A1A] transition-colors">
            <div>
              <p className="text-xs font-medium text-[#F2F0EC]">ファイル名に「カテゴリ名（領収書/商品等）」を含める</p>
              <p className="text-[11px] text-[#9A9890] mt-0.5">例: 20260729_領収書_セブンイレブン.jpg</p>
            </div>
            <input
              type="checkbox"
              checked={config.includeCategory}
              onChange={(e) => handleChange('includeCategory', e.target.checked)}
              className="w-4 h-4 accent-[#7FDBCA] rounded shrink-0 ml-3"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-lg hover:bg-[#1A1A1A] transition-colors">
            <div>
              <p className="text-xs font-medium text-[#F2F0EC]">領収書の場合、金額もファイル名に自動挿入する</p>
              <p className="text-[11px] text-[#9A9890] mt-0.5">例: セブンイレブン_1280円.jpg</p>
            </div>
            <input
              type="checkbox"
              checked={config.includeAmount}
              onChange={(e) => handleChange('includeAmount', e.target.checked)}
              className="w-4 h-4 accent-[#7FDBCA] rounded shrink-0 ml-3"
            />
          </label>
        </div>

        {/* Preview example */}
        <div className="p-3 bg-[#0F0F0F] rounded-xl border border-[#3A3A3A] space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-[#9A9890] tracking-wide">
            <FileCode className="w-3.5 h-3.5" />
            命名設定のプレビュー例:
          </div>
          <p className="font-mono text-sm text-[#7FDBCA]">
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
