import React from 'react';
import { HelpCircle, CheckCircle, Zap, ShieldCheck, Sparkles, DollarSign, Smartphone, Camera, Cpu, ArrowRight } from 'lucide-react';
import { SAMPLE_PHOTOS } from '../data/samplePhotos';

interface ExplanationCardProps {
  onSelectSample?: (dataUrl: string) => void;
  isAnalyzing?: boolean;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  onSelectSample,
  isAnalyzing,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 relative overflow-hidden shadow-2xl text-slate-100">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          ご質問への回答：完全無課金（Google AI Studio無料枠）で作成可能です！
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
          写真のAI自動名前付け＆自動整理アプリは<br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-300 bg-clip-text text-transparent font-extrabold">
            Gemini Vision API (無料枠) で完全ゼロ円実現可能
          </span>
          です！
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-2xl">
          ご相談いただいた「領収書の読み取り」「ペットの顔・特徴認識」「商品の自動カテゴリ命名」のすべてを、Googleの最新AI（Gemini Vision）を組み込むことで、月額費用やサーバー代を一切かけることなくスマホアプリとして作ることができます。
        </p>
      </div>

      {/* Demo Sample Photos Test Section (Moved here from Camera View) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center font-bold text-indigo-400 shadow-sm">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                ワンクリック体験サンプル写真（AI自動命名テスト）
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                カメラを起動せずにGemini Vision AIの自動解析・命名精度を即座にお試しいただけます
              </p>
            </div>
          </div>
          <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-full shadow-xs">
            実機カメラ不要で即分析
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SAMPLE_PHOTOS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample?.(sample.dataUrl)}
              disabled={isAnalyzing}
              className="group relative text-left bg-slate-950 hover:bg-slate-800/80 rounded-2xl border border-slate-800 hover:border-indigo-500/60 p-3 transition-all flex flex-col justify-between shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 mb-2 border border-slate-800 shadow-inner">
                <img
                  src={sample.dataUrl}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-100 group-hover:text-indigo-300 line-clamp-1">
                  {sample.name}
                </p>
                <p className="text-[10px] text-slate-400 font-medium line-clamp-1">
                  {sample.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Receipt */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 hover:border-emerald-500/50 transition-all shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-lg flex items-center justify-center shadow-sm">
            🧾
          </div>
          <h3 className="font-bold text-base text-white tracking-tight">1. 領収書の自動OCR</h3>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            店舗名・日付・合計金額を文字起こしして<br />
            <span className="font-mono text-emerald-400 font-bold bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 inline-block my-1">20260729_セブンイレブン_1280円.jpg</span><br />
            のように家計簿・確定申告に最適な名前で自動保存できます。
          </p>
        </div>

        {/* Pet */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 hover:border-pink-500/50 transition-all shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-lg flex items-center justify-center shadow-sm">
            🐶
          </div>
          <h3 className="font-bold text-base text-white tracking-tight">2. ペットの個体識別命名</h3>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            初回撮影時に「名前入力欄」を出し、毛色や犬種・猫種の特徴を記憶。次回撮影からは<br />
            <span className="font-mono text-pink-300 font-bold bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 inline-block my-1">ポチ_20260729.jpg</span><br />
            と自動で判別して命名します。
          </p>
        </div>

        {/* Product */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 hover:border-indigo-500/50 transition-all shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-lg flex items-center justify-center shadow-sm">
            👟
          </div>
          <h3 className="font-bold text-base text-white tracking-tight">3. 商品・物品の自動判定</h3>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            写っているアイテムやブランドを自動特定。<br />
            <span className="font-mono text-indigo-300 font-bold bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 inline-block my-1">ナイキ_スニーカー.jpg</span> や、特定が難しい場合も<br />
            <span className="font-mono text-indigo-300 font-bold bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 inline-block my-1">靴・バッグ・ジュース</span><br />
            などのカテゴリ名で安全に保存できます。
          </p>
        </div>
      </div>

      {/* Why Free Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-slate-100">
        <h3 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          なぜ「完全無課金」でアプリが作れるのか？
        </h3>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-start gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
              1
            </div>
            <div>
              <p className="font-bold text-white text-sm">Google Gemini APIの強力な無料枠</p>
              <p className="text-slate-400 font-medium mt-0.5">
                Google AI Studioで入手できるGemini APIキーは、個人利用において<strong className="text-indigo-300">1分間に15リクエスト、1日1,500リクエストまで完全無料</strong>で利用可能です。個人が1日に写真を撮る枚数を遥かに上回るため、実質永久無料で運用できます。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
              2
            </div>
            <div>
              <p className="font-bold text-white text-sm">アプリ自体の開発費・維持費も0円</p>
              <p className="text-slate-400 font-medium mt-0.5">
                Androidアプリは Android Studio (公式無料ツール) や React / Web PWA 技術を使って無料で開発できます。写真データは外部サーバーを使わずにスマホ内部（ストレージ）にのみ保存すれば、クラウドサーバー費用も0円です。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* App Architecture Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          アプリの動作イメージ・処理フロー
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <Camera className="w-5 h-5 text-indigo-400 mx-auto" />
            <p className="font-bold text-white">① スマホで写真撮影</p>
            <p className="text-[10px] text-slate-400">領収書・ペット・商品など</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <Sparkles className="w-5 h-5 text-indigo-400 mx-auto" />
            <p className="font-bold text-white">② Gemini AIへ送信</p>
            <p className="text-[10px] text-slate-400">画像＋認識プロンプト</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <Cpu className="w-5 h-5 text-emerald-400 mx-auto" />
            <p className="font-bold text-white">③ ファイル名を生成</p>
            <p className="text-[10px] text-slate-400">店舗名・ペット名・カテゴリ</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <Smartphone className="w-5 h-5 text-indigo-400 mx-auto" />
            <p className="font-bold text-white">④ スマホに保存</p>
            <p className="text-[10px] text-slate-400">命名された名前で保存完了！</p>
          </div>
        </div>

        {/* Version Information */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              v1.6.0
            </span>
            <span>いちいち面倒なカメラアプリ (Build 2026.07.31)</span>
          </div>
          <div className="text-slate-400 text-[10px]">
            最新アップデート: `to-ico`自動生成による完全本物バイナリICO/PNG形式ファビコン＆自動ビルド統合
          </div>
        </div>
      </div>
    </div>
  );
};
