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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="bg-indigo-600 border-4 border-indigo-700 rounded-3xl p-6 md:p-8 space-y-4 relative overflow-hidden shadow-xl text-white">
        <div className="absolute top-0 right-0 p-8 opacity-15 pointer-events-none">
          <Sparkles className="w-64 h-64 text-yellow-400" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-400 text-indigo-950 text-xs font-black shadow-sm uppercase tracking-wider">
          <CheckCircle className="w-4 h-4 text-indigo-950" />
          ご質問への回答：完全無課金で作成可能です！
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase tracking-tight">
          写真のAI自動名前付け＆自動整理アプリは<br />
          <span className="bg-yellow-300 text-indigo-950 px-2 py-0.5 rounded-lg inline-block my-1 font-black shadow-sm">
            Gemini Vision API (無料枠) で完全ゼロ円実現可能
          </span>
          です！
        </h2>

        <p className="text-sm text-indigo-100 font-medium leading-relaxed max-w-2xl">
          ご相談いただいた「領収書の読み取り」「ペットの顔・特徴認識」「商品の自動カテゴリ命名」のすべてを、Googleの最新AI（Gemini 3.6 Flash）を組み込むことで、月額費用やサーバー代を一切かけることなくスマホアプリとして作ることができます。
        </p>
      </div>

      {/* Demo Sample Photos Test Section (Moved here from Camera View) */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center font-bold text-indigo-950 shadow-sm">
              <Zap className="w-5 h-5 text-indigo-950" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                ワンクリック体験サンプル写真（AI自動命名テスト）
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                カメラを起動せずにGemini Vision AIの自動解析・命名精度を即座にお試しいただけます
              </p>
            </div>
          </div>
          <span className="text-xs bg-yellow-200 text-indigo-950 font-black uppercase px-3 py-1 rounded-full shadow-xs">
            実機カメラ不要で即分析
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SAMPLE_PHOTOS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample?.(sample.dataUrl)}
              disabled={isAnalyzing}
              className="group relative text-left bg-slate-50 hover:bg-indigo-50/80 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 p-3 transition-all flex flex-col justify-between shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 mb-2 border border-slate-300 shadow-inner">
                <img
                  src={sample.dataUrl}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <p className="font-black text-xs text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                  {sample.name}
                </p>
                <p className="text-[10px] text-slate-500 font-bold line-clamp-1">
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
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-3 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black text-lg flex items-center justify-center shadow-md">
            🧾
          </div>
          <h3 className="font-black text-base text-slate-900 uppercase tracking-tight">1. 領収書の自動OCR</h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            店舗名・日付・合計金額を文字起こしして<br />
            <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">「20260729_セブンイレブン_1280円.jpg」</span><br />
            のように家計簿・確定申告に最適な名前で自動保存できます。
          </p>
        </div>

        {/* Pet */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-3 hover:border-pink-500 transition-all shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-pink-400 text-white font-black text-lg flex items-center justify-center shadow-md">
            🐶
          </div>
          <h3 className="font-black text-base text-slate-900 uppercase tracking-tight">2. ペットの個体識別命名</h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            初回撮影時に「名前入力欄」を出し、毛色や犬種・猫種の特徴を記憶。次回撮影からは<br />
            <span className="font-mono text-pink-700 font-bold bg-pink-50 px-1.5 py-0.5 rounded">「ポチ_20260729.jpg」</span><br />
            と自動で判別して命名します。
          </p>
        </div>

        {/* Product */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-3 hover:border-indigo-500 transition-all shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
            👟
          </div>
          <h3 className="font-black text-base text-slate-900 uppercase tracking-tight">3. 商品・物品の自動判定</h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            写っているアイテムやブランドを自動特定。<br />
            <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">「ナイキ_スニーカー.jpg」</span> や、特定が難しい場合も<br />
            <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">「靴」「バッグ」「ジュース」</span><br />
            などのカテゴリ名で安全に保存できます。
          </p>
        </div>
      </div>

      {/* Why Free Section */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          なぜ「完全無課金」でアプリが作れるのか？
        </h3>

        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
              1
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">Google Gemini APIの強力な無料枠</p>
              <p className="text-slate-600 font-medium mt-0.5">
                Google AI Studioで入手できるGemini APIキーは、個人利用において<strong className="text-indigo-900">1分間に15リクエスト、1日1,500リクエストまで完全無料</strong>で利用可能です。個人が1日に写真を撮る枚数を遥かに上回るため、実質永久無料で運用できます。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
              2
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">アプリ自体の開発費・維持費も0円</p>
              <p className="text-slate-600 font-medium mt-0.5">
                Androidアプリは Android Studio (公式無料ツール) や React / Web PWA 技術を使って無料で開発できます。写真データは外部サーバーを使わずにスマホ内部（ストレージ）にのみ保存すれば、クラウドサーバー費用も0円です。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* App Architecture Diagram */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" />
          アプリの動作イメージ・処理フロー
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-1">
            <Camera className="w-5 h-5 text-indigo-600 mx-auto" />
            <p className="font-black text-slate-900">① スマホで写真撮影</p>
            <p className="text-[10px] text-slate-500 font-semibold">領収書・ペット・商品など</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-1">
            <Sparkles className="w-5 h-5 text-yellow-500 mx-auto" />
            <p className="font-black text-slate-900">② Gemini AIへ送信</p>
            <p className="text-[10px] text-slate-500 font-semibold">画像＋認識プロンプト</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-1">
            <Cpu className="w-5 h-5 text-emerald-600 mx-auto" />
            <p className="font-black text-slate-900">③ ファイル名を生成</p>
            <p className="text-[10px] text-slate-500 font-semibold">店舗名・ペット名・カテゴリ</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-1">
            <Smartphone className="w-5 h-5 text-indigo-600 mx-auto" />
            <p className="font-black text-slate-900">④ スマホに保存</p>
            <p className="text-[10px] text-slate-500 font-semibold">命名された名前で保存完了！</p>
          </div>
        </div>
      </div>
    </div>
  );
};
