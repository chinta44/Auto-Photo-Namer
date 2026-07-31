// ワンクリック体験サンプル用のプレースホルダー画像。
// 実際のGemini認識精度を試したい場合は、dataUrl を実写真の base64 に差し替えてください。
function placeholderSvg(bg: string, fg: string, emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="50%" y="50%" font-size="72" text-anchor="middle" dominant-baseline="central" fill="${fg}">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export interface SamplePhoto {
  id: string;
  name: string;
  description: string;
  dataUrl: string;
}

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: 'sample-receipt',
    name: '領収書サンプル',
    description: 'コンビニのレシート例',
    dataUrl: placeholderSvg('#1e1a12', '#E8B04B', '🧾'),
  },
  {
    id: 'sample-pet',
    name: 'ペットサンプル',
    description: '柴犬の写真例',
    dataUrl: placeholderSvg('#0f1e1c', '#7FDBCA', '🐶'),
  },
  {
    id: 'sample-product',
    name: '商品サンプル',
    description: 'スニーカーの写真例',
    dataUrl: placeholderSvg('#131c22', '#7FA6C9', '👟'),
  },
  {
    id: 'sample-document',
    name: '書類サンプル',
    description: '契約書・メモの例',
    dataUrl: placeholderSvg('#1a1622', '#B58BD1', '📄'),
  },
];
