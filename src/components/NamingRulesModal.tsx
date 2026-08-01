import React, { useState, useEffect } from 'react';
import { NamingRuleConfig } from '../types';
import { Settings, FileCode, Folder, FolderCheck, RotateCcw, FolderPlus, Download, CheckCircle2 } from 'lucide-react';
import {
  getSavedDirectoryInfo,
  pickCustomSaveDirectory,
  resetToDefaultDownloadsDirectory,
} from '../utils/fileSaveUtils';

interface NamingRulesProps {
  config: NamingRuleConfig;
  onUpdateConfig: (config: NamingRuleConfig) => void;
}

export const NamingRulesModal: React.FC<NamingRulesProps> = ({ config, onUpdateConfig }) => {
  const [savedFolderName, setSavedFolderName] = useState<string | null>(null);
  const [saveStatusMsg, setSaveStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    getSavedDirectoryInfo().then(({ name }) => {
      setSavedFolderName(name);
    });
  }, []);

  const handleChange = <K extends keyof NamingRuleConfig>(key: K, value: NamingRuleConfig[K]) => {
    onUpdateConfig({
      ...config,
      [key]: value,
    });
  };

  const handlePickDirectory = async () => {
    setSaveStatusMsg(null);
    const res = await pickCustomSaveDirectory();
    if (res.success && res.folderName) {
      setSavedFolderName(res.folderName);
      setSaveStatusMsg(`保存先フォルダを「${res.folderName}」に設定しました。`);
    } else if (res.error) {
      setSaveStatusMsg(res.error);
    }
  };

  const handleResetDirectory = async () => {
    await resetToDefaultDownloadsDirectory();
    setSavedFolderName(null);
    setSaveStatusMsg('デフォルトの「ダウンロード」フォルダ保存に戻しました。');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl text-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold shadow-sm">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-white tracking-tight">AI自動命名・保存ルールの設定</h2>
            <p className="text-xs text-slate-400 font-medium">
              保存場所のフォルダ設定、ファイル名の命名規則（日付・カテゴリ・区切り文字）をカスタマイズできます。
            </p>
          </div>
        </div>
      </div>

      {/* Save Location Settings Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">ファイルの保存先フォルダ設定</h3>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
            {savedFolderName ? '指定フォルダ使用中' : 'デフォルト (ダウンロード)'}
          </span>
        </div>

        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/90 space-y-3">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              savedFolderName
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
            }`}>
              {savedFolderName ? <FolderCheck className="w-5 h-5" /> : <Download className="w-5 h-5" />}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                現在の保存先:
                <span className={savedFolderName ? 'text-emerald-400 font-extrabold' : 'text-indigo-300 font-extrabold'}>
                  {savedFolderName ? `📁 ${savedFolderName}` : 'ダウンロード（Downloads）フォルダ'}
                </span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {savedFolderName
                  ? '撮影・保存ボタンを押すと、毎回ダイアログを表示せず上記フォルダへダイレクト保存されます。'
                  : 'デフォルト状態です。撮影・保存ボタンを押すと、毎回ダイアログを表示せずブラウザ標準の「ダウンロード」フォルダへ自動保存されます。'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={handlePickDirectory}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <FolderPlus className="w-4 h-4 text-indigo-200" />
              <span>保存先フォルダを変更・指定</span>
            </button>

            {savedFolderName && (
              <button
                onClick={handleResetDirectory}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>デフォルト (ダウンロード) に戻す</span>
              </button>
            )}
          </div>

          {saveStatusMsg && (
            <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-200 text-xs font-medium flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveStatusMsg}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-slate-100">
        <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">AI自動命名ルール設定</h3>

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
