# OpenReview API Server

セキュアなClaude APIプロキシサーバー

## 特徴

- ✅ APIキー認証
- ✅ レート制限 (30 req/min)
- ✅ CORS対応
- ✅ 入力検証とサニタイゼーション
- ✅ エラーハンドリング

## 環境変数

```bash
ANTHROPIC_API_KEY=your-anthropic-api-key
FRONTEND_API_KEY=your-frontend-api-key
```

## デプロイ

```bash
npm run deploy
```

## 使用方法

```javascript
fetch('https://your-api-domain.vercel.app/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-frontend-api-key'
  },
  body: JSON.stringify({
    message: 'こんにちは',
    conversationHistory: []
  })
});
```

## セキュリティ

- APIキーによる認証
- IPベースレート制限
- 入力長制限 (4000文字)
- XSS/CSRF保護ヘッダー