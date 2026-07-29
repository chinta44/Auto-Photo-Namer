# 📸 SmartName AI - AI写真自動命名＆整理カメラ

**Gemini Vision AI（Gemini 3.6 Flash）** を活用して、スマートフォンやPCで撮影・アップロードした写真を自動解析し、意味のあるファイル名を生成して保存できるWeb/PWAアプリケーションです。

領収書のOCR読み取り、ペットの個体識別・命名、商品・アイテムのカテゴリ判別を全自動で行うため、写真整理の手間をゼロにします。

---

## ✨ 主な機能

### 🧾 1. 領収書・レシートの自動OCR命名
- 撮影された領収書から「店舗名」「撮影日付」「合計金額」をAIが自動抽出。
- 例: `20260729_セブンイレブン_1280円.jpg`
- 確定申告や家計簿管理の整理が圧倒的にラクになります。

### 🐶 2. ペットの個体識別・名前学習
- 初回撮影時に「名前（ポチ、タマなど）」と毛色・特徴を登録。
- 次回からの撮影ではAIが個体を自動認識して命名。
- 例: `ポチ_20260729.jpg`

### 👟 3. 商品・物品の自動カテゴリ判定
- 撮影されたオブジェクトやブランドを即座に判定。
- 特定が難しい場合も「靴」「バッグ」「ジュース」など汎用カテゴリ名で安全に保存。
- 例: `ナイキ_スニーカー.jpg`

### ⚙️ 4. 柔軟な命名ルールカスタマイズ
- **日付フォーマット**: `8桁数字 (20260729)` / `ハイフン (2026-07-29)` / `なし`
- **単語区切り文字**: `_ (アンダースコア)` / `- (ハイフン)` / `スペース`
- **オプション**: カテゴリ名や金額をファイル名に自動含めるかのオン/オフ切り替え

### 💰 5. 完全無料枠での運用設計
- Google Gemini API の無料枠（1日1,500リクエスト）を活用するため、個人使用であれば**完全無料・サーバー代ゼロ**で永久利用可能です。

---

## 🛠️ 技術スタック

- **フロントエンド**: React 18, Vite, TypeScript, Tailwind CSS
- **アイコン**: Lucide React
- **バックエンド/プロキシ**: Node.js / Express
- **AIエンジン**: Google Gen AI SDK (`@google/genai`) - Gemini 3.6 Flash Vision

---

## 🚀 ローカル開発環境のセットアップ

### 前提条件
- Node.js v18 以上
- npm

### 1. リポジトリのクローン
```bash
git clone https://github.com/YOUR_USERNAME/smartname-ai.git
cd smartname-ai
```

### 2. 依存パッケージのインストール
```bash
npm install
```

### 3. 環境変数の設定
`.env.example` をコピーして `.env` ファイルを作成し、Gemini APIキーを設定します。

```bash
cp .env.example .env
```

`.env` 内の `GEMINI_API_KEY` に、[Google AI Studio](https://aistudio.google.com/) で取得した無料のAPIキーを入力します：

```env
GEMINI_API_KEY="AIzaSy..."
```

### 4. 開発サーバーの起動
```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてアプリケーションを確認できます。

---

## 📦 ビルドとプロダクション実行

```bash
# プロダクションビルド（Vite + Server Bundling）
npm run build

# 本番サーバー起動
npm run start
```

---

## 📂 プロジェクト構造

```text
├── src/
│   ├── components/       # UIコンポーネント（カメラ、モーダル、ギャラリー等）
│   ├── data/             # サンプルデータ・テンプレート設定
│   ├── services/         # Gemini Vision API 呼び出しロジック
│   ├── types.ts          # TypeScript型定義
│   ├── App.tsx           # メインアプリケーションコンポーネント
│   └── main.tsx          # エントリーポイント
├── server.ts             # Express APIプロキシサーバー（APIキー保護）
├── metadata.json         # アプリケーションメタデータ
├── .env.example          # 環境変数サンプル
└── package.json
```

---

## 📄 ライセンス

MIT License
