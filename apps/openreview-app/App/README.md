# OpenReview Web Application

OpenReviewのモダンなWebアプリケーションです。Reactを使用してPC画面向けに開発されています。

## 機能

### ✅ 実装済み
- **ログイン・登録画面**: モダンなUIデザインでタブ切り替え対応
- **ダッシュボード**: サイドバーナビゲーション付きのメイン画面
  - Home: ホームページコンテナ
  - Create: フォーム作成ページコンテナ  
  - Analytics: 分析ページコンテナ
  - Settings: 設定ページコンテナ
- **Create画面**: フォーム作成専用の単独画面
- **ページ遷移**: スムーズなアニメーション付き

### 🎨 デザイン特徴
- Material-UI (MUI) による洗練されたコンポーネント
- Framer Motionによるアニメーション効果
- グラデーション背景とガラスモーフィズム効果
- レスポンシブデザイン（PC画面最適化）

## セットアップ手順

### 1. 依存関係のインストール
```bash
cd /Users/omohi.yuuto/Documents/OpenReview/OpenReviewApp
npm install
```

### 2. 開発サーバーの起動
```bash
npm start
```

ブラウザで `http://localhost:3000` にアクセスしてアプリケーションを確認できます。

## プロジェクト構造

```
src/
├── components/
│   ├── LoginPage.js      # ログイン・登録画面
│   ├── Dashboard.js      # ダッシュボード画面
│   └── CreatePage.js     # フォーム作成画面
├── App.js                # メインアプリケーション
├── index.js              # エントリーポイント
└── index.css             # グローバルスタイル
```

## 使用技術

- **React 18**: メインフレームワーク
- **Material-UI (MUI)**: UIコンポーネントライブラリ
- **Framer Motion**: アニメーションライブラリ
- **Emotion**: CSS-in-JS
- **Inter Font**: モダンなフォント

## 画面遷移

1. **ログイン画面** → ログイン/登録 → **ダッシュボード**
2. **ダッシュボード** → Createボタンクリック → **Create画面**  
3. **Create画面** → 戻るボタンクリック → **ダッシュボード**

## 今後の実装予定

- フォーム作成機能の詳細実装
- データベース連携（Supabase）
- 認証機能の実装
- レビューフォームのプレビュー機能
- 分析・レポート機能

## 開発情報

- Node.js 16以上が必要
- PC画面用に最適化（1200px以上推奨）
- モダンブラウザ対応