# 📸 いちいち面倒なカメラアプリ (Auto-Photo-Namer)

**Gemini Vision AI** を活用して、スマートフォンやPCで撮影・アップロードした写真をその場でAI解析し、意味のあるファイル名を自動生成して保存できるWeb/PWA + Androidアプリです。

領収書のOCR読み取り、ペットの個体識別・命名学習、商品・食品・書類のカテゴリ判別を全自動で行うため、写真整理の手間をゼロに近づけます。

🔗 **公開URL**: https://auto-photo-namer.onrender.com

---

## ✨ 主な機能

### 🧾 領収書・レシートの自動OCR命名
撮影した領収書から「店舗名」「日付」「合計金額」「消費税」「購入品目」をAIが自動抽出してファイル名を生成します。
例: `20260729_セブンイレブン_1280円.jpg`

### 🐶 ペットの個体識別・名前学習
名前と特徴（毛色・種類など）を一度登録すると、次回以降の撮影でAIが同じ個体を自動認識して命名します。
- 端末やブラウザをまたいで使う場合は、学習データをJSONファイルでバックアップ/復元でき、**「上書き」と「合成（既存データに追加）」**のどちらかを選べます（同一IDは既存を優先）。
- Googleアカウント連携で、Google Driveへの自動バックアップにも対応。

### 👟📄🍜 商品・書類・食品の自動カテゴリ判定
商品ブランドや料理名、書類の種別を判定し、汎用カテゴリ名でも安全に命名します。

### 📍 タップ位置でAI指定命名
写真の中の特定の被写体をタップして指定すると、その部分に絞ってAIが再解析・再命名します(1枚の写真に複数の被写体が写っている場合に便利です)。

### ⚙️ 柔軟な命名ルールカスタマイズ
- 日付フォーマット（`20260729` / `2026-07-29` / なし）
- 単語区切り文字（`_` / `-` / スペース）
- カテゴリ名・金額をファイル名に含めるかの切り替え

### 🎨 デザインテーマ
オーシャンブルー・フォレストグリーン・サンセットオレンジ・モノクロームの4種類からアプリ全体の配色を切り替え可能。選択内容は端末に保存されます。

### 💰 完全無料枠での運用設計
Gemini APIキーはご自身のものを画面から登録して使う方式です（[Google AI Studio](https://aistudio.google.com/)で無料取得可能）。個人利用の範囲であれば、APIコストもサーバー代も実質かけずに運用できます。

### 📱 Androidアプリ版
Capacitorを使ってAndroidアプリ化しており、APKとして端末にインストールして利用することもできます（詳細は下記「Androidアプリのビルド」参照）。

---

## 🛠️ 技術スタック

- **フロントエンド**: React 19, Vite, TypeScript, Tailwind CSS v4
- **アイコン**: Lucide React
- **バックエンド**: Node.js / Express（`server.ts`、Gemini APIへのプロキシ）
- **AIエンジン**: Google Gen AI SDK (`@google/genai`) — Gemini 3.6 Flash Vision
- **Androidアプリ化**: Capacitor（`@capacitor/android`, `@capacitor/filesystem`, `@capacitor/share`）
- **外部連携**: Google Drive API（学習データの自動バックアップ）

---

## 🚀 ローカル開発環境のセットアップ

### 前提条件
- Node.js v18 以上 / npm
- Gemini APIキー（[Google AI Studio](https://aistudio.google.com/)で無料取得）

### 手順
```bash
git clone https://github.com/chinta44/Auto-Photo-Namer.git
cd Auto-Photo-Namer
npm install
npm run dev
```
ブラウザで `http://localhost:3000` を開き、アプリ右上の鍵アイコンからGemini APIキーを登録してください。

---

## 📦 ビルドとプロダクション実行

```bash
npm run build   # Vite build + サーバーバンドル
npm run start   # 本番サーバー起動
```

---

## 🌐 Render へのデプロイ

1. [Render](https://render.com/) にGitHubアカウントでログイン
2. 「New +」→「Web Service」→ 本リポジトリを選択
3. 設定:
   - **Language**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: Free
4. 「Create Web Service」で数分後に公開URLが発行されます

> Gemini APIキーはユーザーごとにアプリ画面から登録する方式のため、Render側の環境変数設定は必須ではありません。

---

## 📱 Androidアプリのビルド（APK）

本アプリはCapacitorで Android ネイティブアプリ化しています。フロントエンドはAPKに同梱され、AI解析リクエストのみ本番サーバー（Render）と通信します。

```bash
npm install
npm run build          # dist/ を生成
npx cap sync android    # android/ プロジェクトに同期
```

その後、Android Studioで `android` フォルダを開き、
`ビルド` → `Clean Project` → `Generate App Bundles or APKs` → `Generate APKs`
でAPKが生成されます（`android/app/build/outputs/apk/debug/app-debug.apk`）。

⚠️ **コードを更新した場合は、必ず上記のビルド手順を最初からやり直してください。** GitHub上のコードを更新しただけではAndroid側には反映されません。また、PC側の作業フォルダは都度GitHubから「Download ZIP」し直すことを推奨します（古いフォルダのまま作業すると更新が反映されない原因になります）。

---

## 📂 プロジェクト構造

```text
├── src/
│   ├── components/       # UIコンポーネント（カメラ、各種モーダル、ギャラリー等）
│   ├── utils/             # Gemini/Drive連携、画像変換、ファイル保存などのロジック
│   ├── types.ts           # TypeScript型定義
│   ├── App.tsx             # メインアプリケーションコンポーネント
│   ├── index.css           # グローバルスタイル・テーマ定義
│   └── main.tsx             # エントリーポイント
├── android/                # Capacitor Androidネイティブプロジェクト
├── scripts/
│   └── generate-icons.js   # アプリアイコン一式の生成スクリプト
├── server.ts                # Express APIサーバー（Gemini呼び出し）
├── capacitor.config.ts      # Capacitor設定
└── package.json
```

---

## 📄 ライセンス

MIT License
