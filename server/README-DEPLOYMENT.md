# Vercelデプロイメントガイド

このガイドでは、OpenReviewAppをVercelにデプロイし、Claude APIを安全に統合する方法を説明します。

## 📋 事前準備

### 1. 必要なアカウント
- [Vercel](https://vercel.com/)アカウント
- [Anthropic](https://console.anthropic.com/)アカウント（Claude APIキー取得用）

### 2. APIキーの取得
1. Anthropic Consoleにログイン
2. APIキーを生成
3. キーを安全な場所に保存（後でVercelの環境変数に設定）

## 🚀 デプロイ手順

### Step 1: Vercelプロジェクト作成
```bash
# Vercel CLIをインストール（初回のみ）
npm i -g vercel

# プロジェクトディレクトリでVercelにログイン
vercel login

# プロジェクトを初期化
vercel
```

### Step 2: 環境変数の設定
Vercelダッシュボードで以下の環境変数を設定：

```
ANTHROPIC_API_KEY=your_actual_api_key_here
NODE_ENV=production
```

**重要**: APIキーをコードに直接記述しないでください。

### Step 3: ドメインの更新
`api/chat.js`ファイル内の以下の部分を実際のVercel URLに変更：

```javascript
// 65行目付近
'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
  ? 'https://your-actual-app-name.vercel.app'  // ← ここを変更
  : '*',
```

`src/services/claudeApi.js`ファイル内も同様に変更：

```javascript
// 6行目付近
this.baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-actual-app-name.vercel.app/api'  // ← ここを変更
  : '/api';
```

### Step 4: 依存関係のインストール
```bash
npm install @anthropic-ai/sdk
```

### Step 5: デプロイ実行
```bash
vercel --prod
```

## 🔒 セキュリティ機能

### 実装済みセキュリティ対策

1. **APIキー秘匿化**
   - サーバーサイドでのみAPIキー使用
   - 環境変数による管理

2. **レート制限**
   - IP単位で1分間に10リクエストまで
   - DDoS攻撃防止

3. **入力検証**
   - メッセージ長制限（4000文字）
   - 空文字・不正データのチェック

4. **CORS設定**
   - 特定ドメインからのアクセスのみ許可
   - プリフライトリクエスト対応

5. **エラーハンドリング**
   - 詳細エラー情報の非表示
   - 適切なHTTPステータス返却

## 📊 モニタリング

### Vercelダッシュボードで確認できる項目
- リクエスト数
- レスポンス時間
- エラー率
- 使用量統計

### ログ確認
```bash
vercel logs your-project-name
```

## 🧪 テスト方法

### ローカルテスト
```bash
# 開発サーバー起動
npm start

# 別ターミナルでAPIテスト
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, Claude!"}'
```

### 本番環境テスト
```bash
# 本番APIテスト
curl -X POST https://your-app-name.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, Claude!"}'
```

## 💰 コスト管理

### Claude APIの使用量管理
- Anthropic Consoleで使用量を定期的に確認
- 月次使用量制限の設定を推奨
- 異常な使用量増加の監視

### Vercelの使用量
- 無料枠: 月100GB帯域、100GBストレージ
- 関数実行時間: 月10秒（Hobby）

## 🔧 トラブルシューティング

### よくある問題

1. **API Key not found エラー**
   - Vercelダッシュボードで環境変数が設定されているか確認
   - 変数名の大文字小文字をチェック

2. **CORS エラー**
   - `vercel.json`のCORS設定を確認
   - フロントエンドのURLが正しく設定されているかチェック

3. **Rate Limit エラー**
   - 1分間に10リクエスト制限に引っかかっている
   - しばらく待ってから再試行

4. **Function timeout**
   - Claude APIのレスポンスが遅い場合
   - `vercel.json`でタイムアウト値を調整

### デバッグ方法
```bash
# Vercelのログを確認
vercel logs

# 関数の詳細ログ
vercel logs --follow
```

## 📝 本番運用チェックリスト

- [ ] APIキーが環境変数に設定済み
- [ ] ドメインURLが正しく設定済み
- [ ] CORS設定が適切
- [ ] レート制限が適切に動作
- [ ] エラーハンドリングが正常
- [ ] ログ監視体制構築
- [ ] 使用量アラート設定
- [ ] バックアップ・復旧手順確立

## 🆘 サポート

問題が発生した場合：
1. このREADMEのトラブルシューティングを確認
2. Vercelダッシュボードのログを確認
3. Anthropic Console で API使用状況を確認

---

**セキュリティ注意**: APIキーやシークレット情報は絶対にGitにコミットしないでください。