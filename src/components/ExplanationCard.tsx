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
      <div className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-6 md:p-8 space-y-4 relative overflow-hidden text-[#F2F0EC]">
        <div className="absolute top-0 right-0 p-8 opacity-[0.06] pointer-events-none">
          <Sparkles className="w-56 h-56 text-[#7FDBCA]" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7FDBCA]/10 border border-[#7FDBCA]/30 text-[#7FDBCA] text-[11px] font-medium tracking-wide">
          <CheckCircle className="w-3.5 h-3.5" />
          ご質問への回答：完全無課金で作成可能です
        </div>

        <h2 className="text-xl md:text-2xl font-semibold text-[#F2F0EC] leading-snug tracking-tight">
          写真のAI自動名前付け＆自動整理アプリは<br />
          <span className="text-[#7FDBCA] font-mono">Gemini Vision API (無料枠)</span> で完全ゼロ円実現可能です
        </h2>

        <p className="text-sm text-[#C9C7C1] leading-relaxed max-w-2xl">
          「領収書の読み取り」「ペットの顔・特徴認識」「商品の自動カテゴリ命名」のすべてを、Googleの最新AI（Gemini 3.6 Flash）を組み込むことで、月額費用やサーバー代を一切かけることなくスマホアプリとして作ることができます。
        </p>
      </div>

      {/* Demo Sample Photos Test Section */}
      <div className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg flex items-center justify-center text-[#7FDBCA]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F2F0EC] tracking-tight">
                ワンクリック体験サンプル写真（AI自動命名テスト）
              </h3>
              <p className="text-xs text-[#9A9890]">
                カメラを起動せずにGemini Vision AIの自動解析・命名精度を即座にお試しいただけます
              </p>
            </div>
          </div>
          <span className="text-[11px] bg-[#1A1A1A] border border-[#3A3A3A] text-[#9A9890] font-mono px-2.5 py-1 rounded-full">
            実機カメラ不要で即分析
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SAMPLE_PHOTOS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample?.(sample.dataUrl)}
              disabled={isAnalyzing}
              className="group relative text-left bg-[#1A1A1A] hover:bg-[#0F0F0F] rounded-xl border border-[#3A3A3A] hover:border-[#7FDBCA]/40 p-3 transition-all flex flex-col justify-between disabled:opacity-50 cursor-pointer"
            >
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-black mb-2 border border-[#3A3A3A]">
                <img
                  src={sample.dataUrl}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <p className="font-medium text-xs text-[#F2F0EC] group-hover:text-[#7FDBCA] line-clamp-1">
                  {sample.name}
                </p>
                <p className="text-[10px] text-[#9A9890] line-clamp-1">
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
        <div className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-5 space-y-3 hover:border-[#E8B04B]/40 transition-all">
          <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] border border-[#E8B04B]/30 text-lg flex items-center justify-center">
            🧾
          </div>
          <h3 className="font-semibold text-sm text-[#F2F0EC] tracking-tight">1. 領収書の自動OCR</h3>
          <p className="text-xs text-[#9A9890] leading-relaxed">
            店舗名・日付・合計金額を文字起こしして<br />
            <span className="font-mono text-[#E8B04B]">20260729_セブンイレブン_1280円.jpg</span><br />
            のように家計簿・確定申告に最適な名前で自動保存できます。
          </p>
        </div>

        {/* Pet */}
        <div className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-5 space-y-3 hover:border-[#7FDBCA]/40 transition-all">
          <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] border border-[#7FDBCA]/30 text-lg flex items-center justify-center">
            🐶
          </div>
          <h3 className="font-semibold text-sm text-[#F2F0EC] tracking-tight">2. ペットの個体識別命名</h3>
          <p className="text-xs text-[#9A9890] leading-relaxed">
            初回撮影時に「名前入力欄」を出し、毛色や犬種・猫種の特徴を記憶。次回撮影からは<br />
            <span className="font-mono text-[#7FDBCA]">ポチ_20260729.jpg</span><br />
            と自動で判別して命名します。
          </p>
        </div>

        {/* Product */}
        <div className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-5 space-y-3 hover:border-[#7FA6C9]/40 transition-all">
          <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] border border-[#7FA6C9]/30 text-lg flex items-center justify-center">
            👟
          </div>
          <h3 className="font-semibold text-sm text-[#F2F0EC] tracking-tight">3. 商品・物品の自動判定</h3>
          <p className="text-xs text-[#9A9890] leading-relaxed">
            写っているアイテムやブランドを自動特定。<br />
            <span className="font-mono text-[#7FA6C9]">ナイキ_スニーカー.jpg</span> や、特定が難しい場合も<br />
            <span className="font-mono text-[#7FA6C9]">靴 / バッグ / ジュース</span><br />
            などのカテゴリ名で安全に保存できます。
          </p>
        </div>
      </div>

      {/* Why Free Section */}
      <div className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-base text-[#F2F0EC] tracking-tight flex items-center gap-2">
          <DollarSign className="w-4.5 h-4.5 text-[#7FDBCA]" />
          なぜ「完全無課金」でアプリが作れるのか？
        </h3>

        <div className="space-y-3 text-xs text-[#C9C7C1] leading-relaxed">
          <div className="flex items-start gap-3 p-4 bg-[#1A1A1A] rounded-xl border border-[#3A3A3A]">
            <div className="w-5.5 h-5.5 rounded-full bg-[#7FDBCA] text-[#0F1E1C] font-semibold flex items-center justify-center shrink-0 text-[11px]">
              1
            </div>
            <div>
              <p className="font-medium text-[#F2F0EC] text-sm">Google Gemini APIの強力な無料枠</p>
              <p className="text-[#9A9890] mt-0.5">
                Google AI Studioで入手できるGemini APIキーは、個人利用において<span className="text-[#F2F0EC] font-medium">1分間に15リクエスト、1日1,500リクエストまで完全無料</span>で利用可能です。個人が1日に写真を撮る枚数を遥かに上回るため、実質永久無料で運用できます。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[#1A1A1A] rounded-xl border border-[#3A3A3A]">
            <div className="w-5.5 h-5.5 rounded-full bg-[#7FDBCA] text-[#0F1E1C] font-semibold flex items-center justify-center shrink-0 text-[11px]">
              2
            </div>
            <div>
              <p className="font-medium text-[#F2F0EC] text-sm">アプリ自体の開発費・維持費も0円</p>
              <p className="text-[#9A9890] mt-0.5">
                Androidアプリは Android Studio (公式無料ツール) や React / Web PWA 技術を使って無料で開発できます。写真データは外部サーバーを使わずにスマホ内部（ストレージ）にのみ保存すれば、クラウドサーバー費用も0円です。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* App Architecture Diagram */}
      <div className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-base text-[#F2F0EC] tracking-tight flex items-center gap-2">
          <Cpu className="w-4.5 h-4.5 text-[#7FDBCA]" />
          アプリの動作イメージ・処理フロー
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3.5 bg-[#1A1A1A] rounded-xl border border-[#3A3A3A] space-y-1">
            <Camera className="w-4.5 h-4.5 text-[#7FDBCA] mx-auto" />
            <p className="font-medium text-[#F2F0EC]">① スマホで写真撮影</p>
            <p className="text-[10px] text-[#9A9890]">領収書・ペット・商品など</p>
          </div>

          <div className="p-3.5 bg-[#1A1A1A] rounded-xl border border-[#3A3A3A] space-y-1">
            <Sparkles className="w-4.5 h-4.5 text-[#E8B04B] mx-auto" />
            <p className="font-medium text-[#F2F0EC]">② Gemini AIへ送信</p>
            <p className="text-[10px] text-[#9A9890]">画像＋認識プロンプト</p>
          </div>

          <div className="p-3.5 bg-[#1A1A1A] rounded-xl border border-[#3A3A3A] space-y-1">
            <Cpu className="w-4.5 h-4.5 text-[#7FA6C9] mx-auto" />
            <p className="font-medium text-[#F2F0EC]">③ ファイル名を生成</p>
            <p className="text-[10px] text-[#9A9890]">店舗名・ペット名・カテゴリ</p>
          </div>

          <div className="p-3.5 bg-[#1A1A1A] rounded-xl border border-[#3A3A3A] space-y-1">
            <Smartphone className="w-4.5 h-4.5 text-[#7FDBCA] mx-auto" />
            <p className="font-medium text-[#F2F0EC]">④ スマホに保存</p>
            <p className="text-[10px] text-[#9A9890]">命名された名前で保存完了！</p>
          </div>
        </div>
      </div>
    </div>
  );
};
