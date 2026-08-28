# Claude Code - OpenReview Answer App

このファイルはClaude Codeが参照する開発情報を記録しています。

## プロジェクト概要

**OpenReview Answer App (React版)**
- レビューフォームに回答するためのReactアプリケーション
- OpenReviewAppと同じ技術スタックで構築
- モバイルファーストのレスポンシブデザイン

## 技術スタック

- **React 19**: メインフレームワーク
- **Material-UI (MUI)**: UIコンポーネントライブラリ
- **Framer Motion**: アニメーションライブラリ
- **Emotion**: CSS-in-JS
- **Inter Font**: メインフォント

## プロジェクト構造

```
src/
├── components/
│   ├── WelcomePage.js       # ウェルカム画面
│   ├── LoginPage.js         # ログイン・新規登録画面
│   ├── QuestionPage.js      # 質問回答画面
│   └── CompletionPage.js    # 完了画面
├── App.js                   # メインアプリケーション（状態管理）
└── index.js                 # エントリーポイント
```

## ページフロー

1. **WelcomePage** → レビュー開始ボタン → **LoginPage**
2. **LoginPage** → ログイン成功 → **QuestionPage**
3. **QuestionPage** → 回答送信 → **CompletionPage**
4. **CompletionPage** → 再開始 → **WelcomePage**

## デザインシステム

### カラーパレット
- Primary: `#5e17eb` (OpenReview紫)
- Secondary: `#667eea`
- Background: `#f8fafc`
- Text Primary: `#1a202c`
- Text Secondary: `#64748b`

### コンポーネントスタイリング
- Border Radius: 12px (buttons), 16px (cards)
- ガラスモーフィズム効果: `backdrop-filter: blur(20px)`
- グラデーション背景使用
- Framer Motionアニメーション

## 開発コマンド

```bash
# 開発サーバー起動
npm start
npm run dev

# ビルド
npm run build

# Git管理
npm run commit "コミットメッセージ"
npm run git-status
npm run git-log

# その他
npm test
npm run preview
```

## 実装状況

### ✅ 完了
- 基本的なページ構造とルーティング
- レスポンシブデザイン
- アニメーション効果
- テーマ設定
- Git自動管理機能
- **Supabase統合（認証・データベース）**
- **8種類の質問フォーム機能**
- **回答データの保存・送信**
- **URLパラメータからのフォームID取得**
- **ページ間ナビゲーションとステート管理**
- **カスタムブランディング（ロゴ、テーマ、背景画像）**
- **LocalStorageによる回答の永続化**

### 🚧 実装予定
- ソーシャルログイン
- プログレッシブWebApp (PWA)
- エラーハンドリングの改善
- バリデーション機能強化

## データベース連携

OpenReviewAppと同じSupabaseデータベースを使用：
- `review_forms`: レビューフォーム ✅
- `review_form_pages`: フォームページ ✅
- `review_questions`: 質問データ ✅
- `review_form_submissions`: 回答セッション ✅
- `review_question_answers`: 回答データ ✅
- `question_answer_texts`: テキスト回答 ✅
- `question_answer_option_choices`: 選択肢回答 ✅
- `question_answer_option_linear_scale`: スケール回答 ✅
- `question_option_choices`: 質問選択肢 ✅
- `question_option_linear_scale`: スケール設定 ✅
- `users`: ユーザー情報 ✅
- `business_users`: 企業ユーザー ✅
- `login_screen_settings`: ログイン画面設定 ✅
- `question_screen_settings`: 質問画面設定 ✅
- `completion_screen_settings`: 完了画面設定 ✅
- `review_form_settings`: フォーム設定 ✅

## 開発ルール

### ファイル命名
- React Components: PascalCase (`WelcomePage.js`)
- 関数: camelCase
- 定数: UPPER_SNAKE_CASE

### Git管理
- 自動コミット機能を使用
- コミットメッセージに日時とClaude署名を自動追加
- ブランチ戦略: main ブランチで直接開発

### コードスタイル
- ESLint設定に従う
- Material-UIコンポーネントを優先使用
- インラインスタイルよりもsx propを使用
- アニメーションにはFramer Motionを使用

## トラブルシューティング

### よくある問題
1. **警告: 未使用の変数**
   - 開発段階では一時的に無視
   - 機能実装時に解決

2. **アニメーション問題**
   - `AnimatePresence`の`mode="wait"`を確認
   - `initial`、`animate`、`exit`の設定確認

3. **レスポンシブ問題**
   - MUIの`useMediaQuery`または`sx`のブレークポイント使用

## 関連リポジトリ

- **OpenReviewApp**: `/Users/omohi.yuuto/Documents/OpenReview/OpenReviewApp`
  - フォーム作成用アプリ（React + MUI）
  - 同じデザインシステムを使用

## 機能実装詳細

### 📋 質問タイプサポート
1. **ショートテキスト (Type 1)**: 一行テキスト入力 ✅
2. **ロングテキスト (Type 2)**: 複数行テキスト入力 ✅
3. **単一選択 (Type 3)**: ラジオボタン風の選択 ✅
4. **複数選択 (Type 4)**: チェックボックス風の選択 ✅
5. **単一選択マトリクス (Type 5)**: 2列グリッド表示 ✅
6. **複数選択マトリクス (Type 6)**: 2列グリッド表示 ✅
7. **リニアスケール (Type 7)**: 1-5段階評価 ✅
8. **プルダウン (Type 8)**: セレクトボックス ✅

### 🔄 回答保存メカニズム
- **Flutterアプリと同じデータ構造**で保存
- **質問タイプごとの適切なテーブル**に分割保存
- **LocalStorageでページ間永続化**
- **認証ユーザーのみ**回答可能

### 🎨 カスタマイズ機能
- **ロゴ画像**: 企業ごとのブランディング
- **テーマカラー**: 企業カラーに合わせたUI
- **背景画像**: ログイン・完了画面の背景
- **テキストカスタマイズ**: タイトル・説明文の変更

## 次回の開発優先度

1. **中**: エラーハンドリングの改善
2. **中**: バリデーション機能強化
3. **低**: ソーシャルログイン
4. **低**: PWA対応

## セットアップ手順

1. **環境変数設定**:
   ```bash
   cp .env.example .env
   # Supabase情報を.envに設定
   ```

2. **依存関係インストール**:
   ```bash
   npm install
   ```

3. **開発サーバー起動**:
   ```bash
   npm start
   ```

4. **アクセス**: 
   ```
   http://localhost:3000/?reviewFormId=YOUR_FORM_ID
   ```

---

最終更新: 2025年7月28日 - **完全機能実装完了**
作成者: Claude Code