import React, { useState } from 'react';
import { 
  HelpCircle, 
  CheckCircle, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  DollarSign, 
  Smartphone, 
  Camera, 
  Cpu, 
  ChevronDown, 
  Search,
  Layers,
  Crosshair,
  MapPin,
  HardDrive,
  FileText,
  Dog,
  Lock,
  Settings
} from 'lucide-react';
import { SAMPLE_PHOTOS } from '../data/samplePhotos';

interface ExplanationCardProps {
  onSelectSample?: (dataUrl: string) => void;
  isAnalyzing?: boolean;
}

interface FAQItem {
  id: string;
  category: 'basic' | 'feature' | 'backup' | 'key' | 'privacy';
  question: string;
  answer: string;
  badge?: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'basic',
    question: 'Gemini Vision AIはどんな写真を自動命名できますか？',
    answer: '領収書・レシート（店舗名・日付・合計金額のOCR）、ペット（事前に登録した犬種/猫種・毛色・名前の個体識別）、商品・服飾品（ブランド・品目名）、料理・風景など、あらゆる写真を高精度に判別して最適な日本語ファイル名を生成します。',
    badge: '自動命名'
  },
  {
    id: 'faq-2',
    category: 'feature',
    question: '複数枚の写真をまとめて一括自動解析・一括命名できますか？',
    answer: 'はい！カメラ画面の「一括解析」モードから、スマホ内の写真を最大数20枚まで同時に選択できます。バックグラウンドでAIが順番に高速解析し、一括でリネーム保存・ダウンロードすることができます。',
    badge: '新機能・一括解析'
  },
  {
    id: 'faq-3',
    category: 'feature',
    question: '写真の中の「特定の対象（フォーカス位置）」だけをAIに命名させることはできますか？',
    answer: '可能です！撮影後やプレビュー画面で写真内の注目したいオブジェクト（例：ペットの顔や手に持っている小物）を直接タップすると、ピンポイントフォーカスマーカーが設定されます。AIが背景ではなくその指定部分を中心に解析・命名します。',
    badge: 'フォーカス指定'
  },
  {
    id: 'faq-4',
    category: 'feature',
    question: '撮影場所（位置情報/GPS）をファイル名に含めることはできますか？',
    answer: 'はい。カメラ画面で位置情報権限をONにすると、撮影場所の都道府県・市区町村（例: 渋谷区, 横浜市）を現在地から取得し、ファイル名や検索メタデータに自動で反映します。',
    badge: '位置情報連動'
  },
  {
    id: 'faq-5',
    category: 'feature',
    question: 'うちのペット（犬・猫など）を正確に識別・命名させるコツは？',
    answer: '「ペット」タブであらかじめペットの名前、犬種/猫種、毛色、耳や尻尾の特徴をプロフィール登録しておきます。撮影時、AIが写真内のペットの特徴と登録情報を照合し、「ポチ_20260801.jpg」のように名前入りで正確に保存します。',
    badge: 'ペット識別'
  },
  {
    id: 'faq-6',
    category: 'feature',
    question: '生成されるファイル名のフォーマットは変更できますか？',
    answer: '「命名ルール」タブから自由に変更できます。日付順序（YYYYMMDD, YY-MM-DDなど）、金額・カテゴリの含め/不含め、区切り文字（_や-）、プレフィックス（接頭辞）、ファイル拡張子（.jpg, .png, .webpなど）を細かくカスタマイズ可能です。',
    badge: 'ルール設定'
  },
  {
    id: 'faq-7',
    category: 'backup',
    question: 'スマホの買い替えやブラウザのキャッシュ消去でデータは消えますか？',
    answer: 'Google Drive自動バックアップ機能をONにしておくか、「データ復元＆バックアップ」からエクスポートしておけば安心です。ご自身のGoogle Driveに写真ギャラリー・ペット情報・命名設定が同期され、新端末でもワンクリックで完全復元できます。',
    badge: 'Google Drive同期'
  },
  {
    id: 'faq-8',
    category: 'key',
    question: '本当に完全無料で使えますか？後から料金が発生しませんか？',
    answer: '完全無課金でご利用いただけます。Google AI Studioが提供する個人向けGemini APIキー（1日1,500回リクエストまで永久無料）を利用するため、開発者サーバー費用やアプリ月額料金は0円です。',
    badge: '完全無料'
  },
  {
    id: 'faq-9',
    category: 'key',
    question: 'Gemini APIキーの取得・設定方法は？',
    answer: 'Googleアカウントがあれば1分で取得可能です。ヘッダーの鍵アイコンをタップし、「無料APIキーを入手」リンクからGoogle AI Studioを開いて作成したキーを貼り付けるだけで、制限なく高速解析が利用可能になります。',
    badge: 'APIキー設定'
  },
  {
    id: 'faq-10',
    category: 'privacy',
    question: '写真やプライベートなデータが外部に送信・保存されますか？',
    answer: '当アプリの外部サーバーには一切写真や個人データは送信・保存されません。すべての画像および設定データはお手元のスマートフォン内（IndexedDB / LocalStorage）および接続したお客様ご自身のGoogle Driveのみに格納されます。',
    badge: 'プライバシー安心'
  }
];

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  onSelectSample,
  isAnalyzing,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({ 'faq-1': true, 'faq-2': true });

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = FAQ_LIST.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.badge && item.badge.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-slate-100">
      {/* Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          最新機能搭載：Google Driveバックアップ & 一括AI解析 & 位置情報連動
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
          写真のAI自動命名・一括整理・バックアップは<br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-300 bg-clip-text text-transparent font-extrabold">
            Gemini Vision API (無料枠) で完全ゼロ円実現！
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-3xl">
          領収書の高精度OCR・ペット個体識別・商品や思い出写真の自動分類・複数画像の一括処理・Google Drive自動バックアップまで、あらゆる機能を月額費用0円でご活用いただけます。
        </p>
      </div>

      {/* Demo Sample Photos Test Section */}
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
                実機カメラ不要でGemini Vision AIの自動解析・命名精度を即座にお試しいただけます
              </p>
            </div>
          </div>
          <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold px-3 py-1 rounded-full shadow-xs">
            ワンタップでAI解析体験
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

      {/* Modern Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Receipt */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 hover:border-emerald-500/50 transition-all shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-lg flex items-center justify-center shadow-sm">
            🧾
          </div>
          <h3 className="font-bold text-base text-white tracking-tight">1. 領収書・レシートOCR</h3>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            店舗名・日付・合計金額を正確に読み取り、家計簿や確定申告に最適なファイル名を自動生成します。<br />
            <span className="font-mono text-emerald-400 text-[11px] font-bold bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 inline-block my-1.5">20260801_セブンイレブン_1280円.jpg</span>
          </p>
        </div>

        {/* Pet */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 hover:border-pink-500/50 transition-all shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-lg flex items-center justify-center shadow-sm">
            🐶
          </div>
          <h3 className="font-bold text-base text-white tracking-tight">2. ペット個体識別命名</h3>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            毛色や犬種・猫種の特徴をプロフ登録しておくだけで、AIが写真を判別して名前入り保存します。<br />
            <span className="font-mono text-pink-300 text-[11px] font-bold bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 inline-block my-1.5">ポチ_20260801.jpg</span>
          </p>
        </div>

        {/* Batch & Focus */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 hover:border-indigo-500/50 transition-all shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-lg flex items-center justify-center shadow-sm">
            ⚡
          </div>
          <h3 className="font-bold text-base text-white tracking-tight">3. 一括解析 & フォーカス指定</h3>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            最大20枚の写真の一括高速命名や、写真内の特定部分をタップ指定してピンポイント解析可能です。<br />
            <span className="font-mono text-indigo-300 text-[11px] font-bold bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 inline-block my-1.5">ナイキ_スニーカー_渋谷区.jpg</span>
          </p>
        </div>
      </div>

      {/* Interactive Comprehensive Q&A Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <HelpCircle className="w-6 h-6 text-indigo-400" />
              よくある質問 & ヘルプガイド（Q＆A）
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              アプリの使い方、新機能、バックアップ、APIキー設定についてのご質問にお答えします。
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Q＆Aを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'すべて', icon: Layers },
            { id: 'basic', label: '基本機能', icon: FileText },
            { id: 'feature', label: '新機能', icon: Sparkles },
            { id: 'backup', label: 'バックアップ', icon: HardDrive },
            { id: 'key', label: 'APIキー・料金', icon: DollarSign },
            { id: 'privacy', label: '安全・プライバシー', icon: Lock },
          ].map((cat) => {
            const IconComp = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              該当する質問が見つかりませんでした。「{searchQuery}」以外のキーワードでお試しください。
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = !!openFaqIds[faq.id];
              return (
                <div
                  key={faq.id}
                  className="bg-slate-950 border border-slate-800/90 rounded-2xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-slate-900/60 transition cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/30 mt-0.5">
                        Q
                      </span>
                      <div>
                        <span className="font-bold text-sm text-slate-100 leading-snug">
                          {faq.question}
                        </span>
                        {faq.badge && (
                          <span className="ml-2.5 inline-block text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md">
                            {faq.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-indigo-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/50 text-xs text-slate-300 font-medium leading-relaxed flex items-start gap-3 bg-slate-900/20">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30 mt-0.5">
                        A
                      </span>
                      <div className="pt-0.5">{faq.answer}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Why Free Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          なぜ「完全無課金」で高機能アプリを維持できるのか？
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-start gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
              1
            </div>
            <div>
              <p className="font-bold text-white text-sm">Google Gemini APIの強力な無料枠</p>
              <p className="text-slate-400 font-medium mt-0.5">
                Google AI Studioで入手できるGemini APIキーは、個人利用において<strong className="text-indigo-300">1分間に15回、1日1,500回リクエストまで完全無料</strong>で利用可能です。個人が日常で撮影する枚数を十分カバーできます。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
              2
            </div>
            <div>
              <p className="font-bold text-white text-sm">サーバー代・管理維持費も0円</p>
              <p className="text-slate-400 font-medium mt-0.5">
                画像データや分析履歴はお手元の端末ブラウザストレージおよびお客様ご自身のGoogle Driveに直接安全保存されるため、外部の有料データサーバーが不要で0円維持が可能です。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* App Architecture Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          アプリの仕組み・全自動処理フロー
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <Camera className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <p className="font-bold text-white">① 撮影 / 複数選択</p>
            <p className="text-[10px] text-slate-400">単発撮影・フォーカスタップ・一括画像選択</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <Sparkles className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <p className="font-bold text-white">② Gemini Vision解析</p>
            <p className="text-[10px] text-slate-400">画像・ペットプロフ・位置情報を判定</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <Cpu className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="font-bold text-white">③ ルールに基づき命名</p>
            <p className="text-[10px] text-slate-400">店舗・ペット名・日付・位置で自動生成</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <HardDrive className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <p className="font-bold text-white">④ スマホ & Drive保存</p>
            <p className="text-[10px] text-slate-400">命名ファイルで保存・Driveへ自動同期</p>
          </div>
        </div>

        {/* Version Information */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              v1.6.2
            </span>
            <span>いちいち面倒なカメラアプリ (Build 2026.08.01)</span>
          </div>
          <div className="text-slate-400 text-[10px]">
            最新アップデート: Q＆Aコンテンツの大幅充実・カテゴリ検索機能追加 & バージョンv1.6.2更新
          </div>
        </div>
      </div>
    </div>
  );
};
