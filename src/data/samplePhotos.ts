// High-quality SVG DataURLs for quick testing without requiring real camera uploads

const createSvgDataUrl = (svgContent: string) => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
};

export interface SampleItem {
  id: string;
  name: string;
  category: string;
  description: string;
  dataUrl: string;
}

export const SAMPLE_PHOTOS: SampleItem[] = [
  {
    id: 'sample-receipt',
    name: '領収書 (セブン-イレブン)',
    category: 'receipt',
    description: '合計 ¥1,280 の店舗レシート (店名・日付・品目読み取り)',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" fill="none">
        <rect width="400" height="600" fill="#f1f5f9"/>
        <rect x="40" y="30" width="320" height="540" fill="#ffffff" rx="4" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"/>
        <path d="M40 30 L60 20 L80 30 L100 20 L120 30 L140 20 L160 30 L180 20 L200 30 L220 20 L240 30 L260 20 L280 30 L300 20 L320 30 L340 20 L360 30 V570 L340 580 L320 570 L300 580 L280 570 L260 580 L240 570 L220 580 L200 570 L180 580 L160 570 L140 580 L120 570 L100 580 L80 570 L60 580 L40 570 Z" fill="#ffffff"/>
        
        <text x="200" y="80" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="22" fill="#0f172a">セブン-イレブン 渋谷店</text>
        <text x="200" y="105" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748b">東京都渋谷区神南1-2-3 TEL: 03-1234-5678</text>
        <line x1="60" y1="125" x2="340" y2="125" stroke="#cbd5e1" stroke-dasharray="4 4"/>
        
        <text x="60" y="150" font-family="sans-serif" font-size="13" fill="#334155">2026年07月29日 (水) 14:32</text>
        <text x="60" y="170" font-family="sans-serif" font-size="13" fill="#334155">レジ02 責任者: 田中</text>
        <line x1="60" y1="190" x2="340" y2="190" stroke="#cbd5e1"/>

        <text x="60" y="220" font-family="sans-serif" font-size="14" fill="#0f172a">アイスコーヒー L</text>
        <text x="340" y="220" text-anchor="end" font-family="sans-serif" font-size="14" fill="#0f172a">¥210</text>

        <text x="60" y="250" font-family="sans-serif" font-size="14" fill="#0f172a">サンドイッチ（ツナ＆卵）</text>
        <text x="340" y="250" text-anchor="end" font-family="sans-serif" font-size="14" fill="#0f172a">¥340</text>

        <text x="60" y="280" font-family="sans-serif" font-size="14" fill="#0f172a">特製お弁当（チキン南蛮）</text>
        <text x="340" y="280" text-anchor="end" font-family="sans-serif" font-size="14" fill="#0f172a">¥730</text>

        <line x1="60" y1="310" x2="340" y2="310" stroke="#0f172a" stroke-width="2"/>

        <text x="60" y="340" font-family="sans-serif" font-weight="bold" font-size="18" fill="#0f172a">小計 (3点)</text>
        <text x="340" y="340" text-anchor="end" font-family="sans-serif" font-weight="bold" font-size="18" fill="#0f172a">¥1,280</text>

        <text x="60" y="370" font-family="sans-serif" font-size="13" fill="#64748b">(内消費税 10%</text>
        <text x="340" y="370" text-anchor="end" font-family="sans-serif" font-size="13" fill="#64748b">¥116)</text>

        <text x="60" y="410" font-family="sans-serif" font-weight="bold" font-size="20" fill="#2563eb">合計金額</text>
        <text x="340" y="410" text-anchor="end" font-family="sans-serif" font-weight="bold" font-size="24" fill="#2563eb">¥1,280</text>

        <rect x="80" y="460" width="240" height="60" fill="#0f172a" rx="4"/>
        <text x="200" y="495" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#ffffff" letter-spacing="4">|||||| ||| ||||||| |||</text>
        <text x="200" y="540" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#94a3b8">ご利用ありがとうございました</text>
      </svg>
    `),
  },
  {
    id: 'sample-pet-shiba',
    name: 'ペット (柴犬・ポチ)',
    category: 'pet',
    description: '茶色の柴犬。登録ペット「ポチ」と顔立ち・特徴が一致',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500" fill="none">
        <rect width="500" height="500" fill="#fef3c7"/>
        <circle cx="250" cy="250" r="180" fill="#f59e0b"/>
        <!-- Shiba ear L -->
        <polygon points="120,120 170,220 90,200" fill="#d97706"/>
        <polygon points="130,135 160,210 105,195" fill="#fef3c7"/>
        <!-- Shiba ear R -->
        <polygon points="380,120 330,220 410,200" fill="#d97706"/>
        <polygon points="370,135 340,210 395,195" fill="#fef3c7"/>
        <!-- Face White Patch -->
        <ellipse cx="250" cy="280" rx="110" ry="90" fill="#fffbeb"/>
        <ellipse cx="250" cy="310" rx="70" ry="50" fill="#ffffff"/>
        <!-- Eyes -->
        <ellipse cx="180" cy="220" rx="16" ry="22" fill="#1e293b"/>
        <circle cx="175" cy="215" r="6" fill="#ffffff"/>
        <ellipse cx="320" cy="220" rx="16" ry="22" fill="#1e293b"/>
        <circle cx="315" cy="215" r="6" fill="#ffffff"/>
        <!-- Eyebrow white spots -->
        <circle cx="180" cy="180" r="14" fill="#fffbeb"/>
        <circle cx="320" cy="180" r="14" fill="#fffbeb"/>
        <!-- Nose & Muzzle -->
        <ellipse cx="250" cy="280" rx="18" ry="14" fill="#0f172a"/>
        <path d="M250 294 L250 315 M250 315 Q230 325 215 315 M250 315 Q270 325 285 315" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
        <!-- Dog tag collar -->
        <path d="M150 390 Q250 430 350 390" stroke="#dc2626" stroke-width="18" stroke-linecap="round"/>
        <circle cx="250" cy="415" r="18" fill="#fbbf24" stroke="#d97706" stroke-width="3"/>
        <text x="250" y="420" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="12" fill="#78350f">POCHI</text>
      </svg>
    `),
  },
  {
    id: 'sample-product-shoes',
    name: '商品 (Nike スニーカー)',
    category: 'product',
    description: '赤と黒のスポーツシューズ (カテゴリ名・商品名自動識別)',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500" fill="none">
        <rect width="500" height="500" fill="#e2e8f0"/>
        <!-- Shoe box background style -->
        <rect x="50" y="80" width="400" height="340" fill="#ffffff" rx="16" filter="drop-shadow(0 10px 15px rgba(0,0,0,0.08))"/>
        
        <!-- Nike style swoosh shoe -->
        <path d="M90 320 C120 220 220 200 280 230 C330 250 390 220 410 270 C420 300 400 340 370 350 C300 370 120 370 90 320 Z" fill="#dc2626"/>
        <!-- Sole -->
        <path d="M80 340 Q250 375 400 340 L405 365 Q250 390 75 365 Z" fill="#0f172a"/>
        <path d="M75 365 Q250 390 405 365 L405 380 Q250 400 75 380 Z" fill="#ffffff"/>
        <!-- Swoosh logo -->
        <path d="M160 290 Q240 330 340 250 Q240 295 180 280 Z" fill="#ffffff"/>
        <!-- Laces -->
        <line x1="220" y1="230" x2="250" y2="250" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
        <line x1="240" y1="220" x2="270" y2="240" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
        <line x1="260" y1="210" x2="290" y2="230" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
        
        <text x="250" y="130" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="20" fill="#1e293b">NIKE Air Zoom Running Shoes</text>
        <text x="250" y="160" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#64748b">カラー: レッド / ブラック | サイズ: 27.0cm</text>
      </svg>
    `),
  },
  {
    id: 'sample-doc-contract',
    name: '書類 (賃貸借契約書)',
    category: 'document',
    description: '正式な書類・申請書の重要タイトル読み取り',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="550" viewBox="0 0 400 550" fill="none">
        <rect width="400" height="550" fill="#cbd5e1"/>
        <rect x="30" y="30" width="340" height="490" fill="#ffffff" rx="2" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"/>
        
        <text x="200" y="80" text-anchor="middle" font-family="serif" font-weight="bold" font-size="22" fill="#0f172a">不動産賃貸借契約書</text>
        <line x1="80" y1="95" x2="320" y2="95" stroke="#0f172a" stroke-width="2"/>
        
        <text x="50" y="130" font-family="sans-serif" font-size="12" fill="#334155">賃貸人（甲）および賃借人（乙）は、以下の物件について...</text>
        
        <rect x="50" y="150" width="300" height="120" fill="#f8fafc" stroke="#e2e8f0"/>
        <text x="65" y="175" font-family="sans-serif" font-weight="bold" font-size="13" fill="#1e293b">【物件概要】</text>
        <text x="65" y="200" font-family="sans-serif" font-size="12" fill="#475569">物件名：青山レジデンス 302号室</text>
        <text x="65" y="222" font-family="sans-serif" font-size="12" fill="#475569">所在地：東京都港区南青山 5-10</text>
        <text x="65" y="244" font-family="sans-serif" font-size="12" fill="#475569">賃料：月額 125,000 円 (共益費 8,000 円)</text>

        <text x="50" y="300" font-family="sans-serif" font-weight="bold" font-size="13" fill="#1e293b">【契約期間】</text>
        <text x="50" y="320" font-family="sans-serif" font-size="12" fill="#475569">2026年08月01日 から 2028年07月31日まで (2年間)</text>

        <rect x="220" y="380" width="120" height="80" fill="none" stroke="#dc2626" stroke-dasharray="2 2"/>
        <circle cx="280" cy="420" r="22" fill="none" stroke="#dc2626" stroke-width="2"/>
        <text x="280" y="425" text-anchor="middle" font-family="serif" font-size="14" fill="#dc2626">契 印</text>
      </svg>
    `),
  },
];
