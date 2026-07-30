import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "25mb" }));

// Initialize Gemini client lazily/safely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.post("/api/analyze-photo", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", petProfiles = [], namingConfig } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback mock if key is missing or invalid in demo mode
      return res.json({
        category: "product",
        categoryLabel: "商品・物品",
        detectedTitle: "サンプルアイテム",
        suggestedFilename: `20260729_商品_サンプルアイテム.jpg`,
        confidence: 0.85,
        details: {
          productCategory: "雑貨",
          productBrand: "不明",
          summary: "AI APIキーが未設定のため、デモモードで解析結果を生成しました。",
        },
        alternativeNames: [
          `サンプルアイテム_20260729.jpg`,
          `商品_サンプル.jpg`,
        ],
        explanation: "APIキーを設定すると実際の画像認識と自動命名が行われます。",
      });
    }

    // Clean up base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const petsContext = petProfiles.length > 0
      ? `登録済みのペット一覧:\n` + petProfiles.map((p: any) => `- ID: ${p.id}, 名前: ${p.name}, 種類: ${p.species}, 特徴: ${p.breedOrDescription}`).join("\n")
      : "登録されたペットはありません。";

    const namingRulesText = namingConfig
      ? `命名ルールの希望: 日付フォーマット=${namingConfig.dateFormat}, 区切り文字="${namingConfig.separator}", カテゴリ含む=${namingConfig.includeCategory}, 金額含む=${namingConfig.includeAmount}`
      : "一般的な見やすい日本語・英数字で自動作成してください。";

    const prompt = `あなたはAndroidおよびスマートフォン向けの高精度写真自動命名AIアシスタントです。
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

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "一括分類: 'receipt' | 'pet' | 'product' | 'document' | 'other'",
            },
            categoryLabel: {
              type: Type.STRING,
              description: "日本語のカテゴリ表示名 (例: 領収書, ペット, 商品・物品, 書類・メモ, 風景・その他)",
            },
            detectedTitle: {
              type: Type.STRING,
              description: "認識された主な対象名 (例: セブン-イレブン, ポチ, ナイキ スニーカー)",
            },
            suggestedFilename: {
              type: Type.STRING,
              description: "最も推奨される自動生成ファイル名 (.jpg または .png付き)",
            },
            confidence: {
              type: Type.NUMBER,
              description: "認識の確信度 0.0 ~ 1.0",
            },
            details: {
              type: Type.OBJECT,
              properties: {
                receiptStore: { type: Type.STRING },
                receiptDate: { type: Type.STRING },
                receiptAmount: { type: Type.STRING },
                receiptTax: { type: Type.STRING },
                receiptItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                petName: { type: Type.STRING },
                petBreed: { type: Type.STRING },
                isKnownPet: { type: Type.BOOLEAN },
                matchedPetId: { type: Type.STRING },
                productCategory: { type: Type.STRING },
                productBrand: { type: Type.STRING },
                documentType: { type: Type.STRING },
                documentSummary: { type: Type.STRING },
                summary: { type: Type.STRING },
              },
            },
            alternativeNames: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "その他の命名候補案 (2つ以上)",
            },
            explanation: {
              type: Type.STRING,
              description: "AIがどのように画像を判断して命名したかの分かりやすい説明文",
            },
          },
          required: [
            "category",
            "categoryLabel",
            "detectedTitle",
            "suggestedFilename",
            "confidence",
            "details",
            "alternativeNames",
            "explanation",
          ],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Empty AI response");
    }

    const result = JSON.parse(jsonText);
    res.json(result);
  } catch (err: any) {
    console.error("Error analyzing photo:", err);
    res.status(500).json({
      error: "Photo analysis failed",
      message: err.message || "Unknown error",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
