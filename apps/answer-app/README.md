# OpenReview Answer App (React版)

OpenReviewの回答用Reactアプリケーションです。OpenReviewAppと同じ技術スタックを使用してモダンなUIで構築されています。

## 技術スタック

- **React 19**: メインフレームワーク
- **Material-UI (MUI)**: UIコンポーネントライブラリ
- **Framer Motion**: アニメーションライブラリ
- **Emotion**: CSS-in-JS
- **Inter Font**: モダンなフォント

## 機能

### ✅ 実装済み（UI のみ）
- **Welcome ページ**: レビュー開始画面
- **Login ページ**: ログイン・新規登録画面（タブ切り替え対応）
- **Question ページ**: 質問回答画面（ページネーション対応）
- **Completion ページ**: 回答完了画面

### 🎨 デザイン特徴
- OpenReviewAppと統一されたデザインシステム
- グラデーション背景とガラスモーフィズム効果
- Framer Motionによるスムーズなアニメーション
- レスポンシブデザイン（モバイルファースト）

## セットアップ手順

### 1. 依存関係のインストール
```bash
cd /Users/omohi.yuuto/Documents/OpenReview/AnswerApp/answer-app
npm install
```

### 2. 開発サーバーの起動
```bash
npm start
# または
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてアプリケーションを確認できます。

### 3. ビルド
```bash
npm run build
```

### 4. プレビュー
```bash
npm run preview
```

## プロジェクト構造

```
src/
├── components/
│   ├── WelcomePage.js       # ウェルカム画面
│   ├── LoginPage.js         # ログイン・登録画面
│   ├── QuestionPage.js      # 質問回答画面
│   └── CompletionPage.js    # 完了画面
├── App.js                   # メインアプリケーション
└── index.js                 # エントリーポイント
```

## ページ遷移フロー

1. **Welcome ページ** → 「レビューを開始する」ボタン → **Login ページ**
2. **Login ページ** → ログイン成功 → **Question ページ**
3. **Question ページ** → 回答送信 → **Completion ページ**
4. **Completion ページ** → 「もう一度回答する」ボタン → **Welcome ページ**

## 今後の実装予定

- Supabase連携（データベース・認証）
- 実際の質問フォーム機能
- 回答データの保存・送信
- URLパラメータからのフォームID取得
- ソーシャルログイン機能
- レスポンシブデザインの最適化

## 開発情報

- Node.js 16以上が必要
- モバイルファーストデザイン
- PWA対応予定
- TypeScript対応予定
