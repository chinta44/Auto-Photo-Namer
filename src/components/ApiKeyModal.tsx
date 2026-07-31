import React, { useState } from 'react';
import { KeyRound, X, ExternalLink, ShieldCheck, Trash2 } from 'lucide-react';

interface ApiKeyModalProps {
  currentKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ currentKey, onSave, onClose }) => {
  const [value, setValue] = useState(currentKey);
  const [revealed, setRevealed] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(value.trim());
    onClose();
  };

  const handleClear = () => {
    setValue('');
    onSave('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl max-w-md w-full overflow-hidden">
        <div className="p-4 bg-[#242424] border-b border-[#3A3A3A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg flex items-center justify-center text-[#7FDBCA]">
              <KeyRound className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#F2F0EC] tracking-tight">Gemini APIキー設定</h2>
              <p className="text-[11px] text-[#9A9890] font-mono">ブラウザ内にのみ保存されます</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#2C2C2C] border border-[#3A3A3A] text-[#9A9890]">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="p-3 bg-[#7FDBCA]/[0.06] border border-[#7FDBCA]/25 rounded-lg text-xs text-[#C9C7C1] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#7FDBCA] shrink-0 mt-0.5" />
            <span>
              このアプリにはバックエンドサーバーがありません。入力したAPIキーはこの端末のブラウザ(localStorage)にのみ保存され、
              解析リクエストはブラウザから直接 Google の Gemini API に送信されます。
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9A9890] tracking-wide">APIキー:</label>
            <div className="flex items-center gap-2">
              <input
                type={revealed ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 bg-[#0F0F0F] border border-[#3A3A3A] rounded-lg px-3 py-2 text-xs font-mono text-[#7FDBCA] focus:outline-none focus:border-[#7FDBCA]"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setRevealed((r) => !r)}
                className="px-3 py-2 bg-[#242424] hover:bg-[#2C2C2C] border border-[#3A3A3A] text-[#9A9890] rounded-lg text-xs font-medium"
              >
                {revealed ? '隠す' : '表示'}
              </button>
            </div>
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#7FDBCA] hover:underline w-fit"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Google AI Studioで無料のAPIキーを取得する
          </a>

          <div className="flex gap-2 pt-2">
            {currentKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 bg-[#242424] hover:bg-[#2C1414] border border-[#3A3A3A] text-[#9A9890] hover:text-[#F0B8B8] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                削除
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#7FDBCA] hover:brightness-110 text-[#0F1E1C] font-semibold rounded-lg text-xs transition-all"
            >
              保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
