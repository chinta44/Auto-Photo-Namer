# SmartName AI (smart-name-ai)

写真を撮ると Gemini Vision AI が内容（領収書 / ペット / 商品 / 書類）を判別し、
わかりやすいファイル名を自動生成して整理してくれるカメラアプリです。

このバージョンは **サーバー(Express)を使わず、ブラウザから直接 Gemini API を呼び出す**
構成になっています。GitHub Pages のような静的ホスティングだけで完結します。

## ローカルで動かす

```bash
npm install
npm run dev
```

## GitHub Pagesへのデプロイ手順

1. このフォルダの中身をリポジトリ `smart-name-ai` としてGitHubにpushする
2. GitHubのリポジトリ → **Settings → Pages** → Source を **GitHub Actions** に設定する
3. `main` ブランチにpushすると `.github/workflows/deploy.yml` が自動でビルド＆デプロイする
4. `https://<あなたのユーザー名>.github.io/smart-name-ai/` で公開される

> **重要**: `vite.config.ts` の `base: '/smart-name-ai/'` はリポジトリ名と必ず一致させてください。
> ここがズレると資産(JS/CSS)が404になり、画面が真っ白のまま起動しません。
> リポジトリ名を変える場合は、この `base` の値も同じ名前に変更してください。

## Gemini APIキーの設定

このアプリにはサーバーがないため、**自分のGemini APIキーをブラウザに保存**して使います。

1. アプリを開くと初回に「Gemini APIキー設定」モーダルが表示されます
2. [Google AI Studio](https://aistudio.google.com/app/apikey) で無料のAPIキーを発行
3. 発行したキーを貼り付けて保存（`localStorage` にのみ保存され、外部サーバーには送信されません）

無料枠は個人利用なら通常十分な範囲（1分あたり15リクエスト程度、1日あたり1,500リクエスト程度）でカバーできます。

### 注意点(セキュリティ)

APIキーはブラウザの `localStorage` に保存され、Gemini APIへのリクエストもブラウザから直接送信されます。
このURLを他人と共有すると、共有された相手が自分のブラウザに自分のキーを入れて使う形になるため、
**あなた自身のキーが他人に見られることはありません**が、逆にキーを他人と共有しないよう注意してください。

## 構成

```
src/
  App.tsx                 画面全体の状態管理・タブ切り替え
  lib/geminiClient.ts      ブラウザから直接Gemini APIを呼ぶ処理(新規)
  components/
    ApiKeyModal.tsx        APIキー設定モーダル(新規)
    Header.tsx             ナビゲーション + APIキーボタン
    CameraView.tsx         カメラ撮影・シャッター音・ファイルアップロード
    AnalysisModal.tsx       AI解析結果・ファイル名編集・保存
    PetManagerModal.tsx     ペットプロフィール管理
    PhotoGallery.tsx        保存済み写真ギャラリー・検索・CSV出力
    NamingRulesModal.tsx    命名ルールのカスタマイズ
    ExplanationCard.tsx     使い方・仕組みの説明ページ
  data/samplePhotos.ts     ワンクリック体験用サンプル(プレースホルダー)
  types.ts                 型定義
```
