import { AnalysisResult, PetProfile, NamingRuleConfig } from '../types';

const MODEL = 'gemini-3.6-flash';

export class GeminiClientError extends Error {}

interface AnalyzeArgs {
  imageDataUrl: string;
  apiKey: string;
  petProfiles: PetProfile[];
  namingConfig: NamingRuleConfig;
}

function buildPrompt(petProfiles: PetProfile[], namingConfig: NamingRuleConfig): string {
  const petsContext =
    petProfiles.length > 0
      ? `登録済みのペット一覧:\n` +
        petProfiles
          .map((p) => `- ID: ${p.id}, 名前: ${p.name}, 種類: ${p.species}, 特徴: ${p.breedOrDescription}`)
          .join('\n')
      : '登録されたペットはありません。';

  const namingRulesText = namingConfig
    ? `命名ルールの希望: 日付フォーマット=${namingConfig.dateFormat}, 区切り文字="${namingConfig.separator}", カテゴリ含む=${namingConfig.includeCategory}, 金額含む=${namingConfig.includeAmount}`
    : '一般的な見やすい日本語・英数字で自動作成してください。';

  return `あなたはAndroidおよびスマートフォン向けの高精度写真自動命名AIアシスタントです。
提供された画像を解析して、最適なファイル名と詳細情報を出力してください。

【分類ルール】
1. 'receipt' (領収書・レシート): 店名、日付、金額、購入品目を認識します。
   例: "20260729_セブンイレブン_領収書_1280円.jpg", "ヤマダ電機_領収書.png"
2. 'pet' (ペット・動物): 犬・猫・鳥などのペット。登録済みペットの特徴と比較してください。
   ${petsContext}
   もし登録済みペットに一致すればその名前(例: "ポチ")を採用し、未登録なら種類や毛色から候補名を付けて「未登録ペット」としてフラグを立ててください。
   例: "ポチ_20260729.jpg", "シバ犬_茶色_20260729.jpg"
3. 'product' (商品・物品・持ち物): 日用品、家電、服、靴、食品、飲み物、本など。
   具体的な商品名やブランド、無ければ「靴」「バッグ」「緑茶」などの一般的な名前を付けます。
   例: "ナイキ_スニーカー_赤.jpg", "コカコーラ_500ml.jpg", "ビジネスバッグ.jpg"
4. 'document' (書類・メモ・名刺): 契約書、メモ、チラシ、書籍のページ、看板など。
   見出しやタイトル、書類種別から名前を付けます。
   例: "賃貸契約書_20260729.jpg", "会議メモ_企画案.jpg"
5. 'other' (その他・風景): 上記に当てはまらない風景、料理、建物など。
   例: "東京タワー_夜景.jpg", "ラーメン_ランチ.jpg"

【ファイル名の命名要件】
- OSファイル名として安全な文字のみを使用（記号は _ や - のみ）。
- ファイル拡張子は .jpg または .png
- ${namingRulesText}
- 主な命名案（suggestedFilename）に加えて、別案（alternativeNames）を2つ以上作成してください。

JSONフォーマットで回答してください。`;
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    category: {
      type: 'STRING',
      description: "一括分類: 'receipt' | 'pet' | 'product' | 'document' | 'other'",
    },
    categoryLabel: {
      type: 'STRING',
      description: '日本語のカテゴリ表示名 (例: 領収書, ペット, 商品・物品, 書類・メモ, 風景・その他)',
    },
    detectedTitle: {
      type: 'STRING',
      description: '認識された主な対象名 (例: セブン-イレブン, ポチ, ナイキ スニーカー)',
    },
    suggestedFilename: {
      type: 'STRING',
      description: '最も推奨される自動生成ファイル名 (.jpg または .png付き)',
    },
    confidence: {
      type: 'NUMBER',
      description: '認識の確信度 0.0 ~ 1.0',
    },
    details: {
      type: 'OBJECT',
      properties: {
        receiptStore: { type: 'STRING' },
        receiptDate: { type: 'STRING' },
        receiptAmount: { type: 'STRING' },
        receiptTax: { type: 'STRING' },
        receiptItems: { type: 'ARRAY', items: { type: 'STRING' } },
        petName: { type: 'STRING' },
        petBreed: { type: 'STRING' },
        isKnownPet: { type: 'BOOLEAN' },
        matchedPetId: { type: 'STRING' },
        productCategory: { type: 'STRING' },
        productBrand: { type: 'STRING' },
        documentType: { type: 'STRING' },
        documentSummary: { type: 'STRING' },
        summary: { type: 'STRING' },
      },
    },
    alternativeNames: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'その他の命名候補案 (2つ以上)',
    },
    explanation: {
      type: 'STRING',
      description: 'AIがどのように画像を判断して命名したかの分かりやすい説明文',
    },
  },
  required: [
    'category',
    'categoryLabel',
    'detectedTitle',
    'suggestedFilename',
    'confidence',
    'details',
    'alternativeNames',
    'explanation',
  ],
};

/**
 * ブラウザから直接 Gemini API (Generative Language API) を呼び出す。
 * サーバー(Express)は使わない。API キーはユーザー自身のもので、
 * localStorage にのみ保存され、ネットワークリクエストは
 * generativelanguage.googleapis.com へ直接飛ぶ。
 */
export async function analyzePhotoInBrowser({
  imageDataUrl,
  apiKey,
  petProfiles,
  namingConfig,
}: AnalyzeArgs): Promise<AnalysisResult> {
  if (!apiKey) {
    throw new GeminiClientError('Gemini APIキーが設定されていません。設定画面からキーを登録してください。');
  }

  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
  if (!match) {
    throw new GeminiClientError('画像データの形式が不正です。');
  }
  const mimeType = match[1];
  const base64Data = match[2];

  const prompt = buildPrompt(petProfiles, namingConfig);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });
  } catch (networkErr) {
    throw new GeminiClientError('ネットワークエラーが発生しました。通信環境を確認してください。');
  }

  if (!res.ok) {
    if (res.status === 400 || res.status === 403) {
      throw new GeminiClientError('APIキーが無効か、権限がありません。設定画面でキーを確認してください。');
    }
    if (res.status === 429) {
      throw new GeminiClientError('リクエストが多すぎます（無料枠の上限）。しばらく待ってから再度お試しください。');
    }
    throw new GeminiClientError(`Gemini APIがエラーを返しました (status: ${res.status})`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new GeminiClientError('AIから有効な応答が得られませんでした。');
  }

  try {
    return JSON.parse(text) as AnalysisResult;
  } catch (parseErr) {
    throw new GeminiClientError('AIの応答を解析できませんでした。');
  }
}
