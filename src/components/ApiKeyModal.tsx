import React, { useState } from 'react';
import { Key, ExternalLink, Check, AlertCircle, Eye, EyeOff, ShieldCheck, Sparkles, HelpCircle, X } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(inputKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setInputKey('');
    onSaveApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Gemini APIキー設定
              </h2>
              <p className="text-xs text-slate-400">
                自分専用の無料APIキーを設定して制限なしで利用
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Benefits Box */}
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>なぜ自分のAPIキーを使うの？</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              共有サーバーの無料利用枠には上限があるため、混雑時にAPI制限がかかることがあります。ご自身のGemini APIキーを設定すると、個人専用の高速解析枠で制限を気にせず快適に利用できます。
            </p>
          </div>

          {/* Guide / How to get link */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                Gemini APIキーの取得方法（完全無料・約1分）
              </span>
            </div>

            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal pl-4">
              <li>Google AI StudioのAPIキー発行ページにアクセス</li>
              <li>Googleアカウントでログインし「Get API key」をタップ</li>
              <li>発行された文字列（AIzaSy...）をコピーして下記に入力</li>
            </ol>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition duration-200"
            >
              <span>Google AI Studio でAPIキーを発行する</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Gemini API Key</span>
                {apiKey && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    保存済みキー使用中
                  </span>
                )}
              </label>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 pr-10 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm font-mono text-white placeholder-slate-600 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                ※ 入力されたキーはお使いのブラウザ（ローカルストレージ）内にのみ安全に保持されます。
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!inputKey.trim()}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>保存しました！</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>APIキーを保存して適用</span>
                  </>
                )}
              </button>

              {inputKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs font-bold rounded-xl transition"
                >
                  削除
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
