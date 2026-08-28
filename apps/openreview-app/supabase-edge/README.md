# OpenReview - Supabase Edge Functions

最高レベルのセキュリティを持つClaude APIプロキシ

## 🔐 セキュリティ機能

- ✅ **JWT認証** (オプショナル・柔軟)
- ✅ **段階的レート制限** (認証済み20req/min, 匿名5req/min)
- ✅ **CORS制御** (オリジン制限)
- ✅ **入力検証・サニタイゼーション**
- ✅ **自動HTTPS**
- ✅ **地理的分散**
- ✅ **セキュリティヘッダー**

## 🚀 セットアップ

### 1. Supabaseプロジェクト作成
```bash
# https://supabase.com で新規プロジェクト作成
```

### 2. 環境変数設定
```bash
cp .env.local.example .env.local
# 必要な値を入力
```

### 3. デプロイ
```bash
supabase login
supabase link --project-ref your-project-id
supabase functions deploy claude-chat
```

## 💡 認証オプション

### 認証なし利用
```javascript
fetch('https://your-project.supabase.co/functions/v1/claude-chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'こんにちは',
    conversationHistory: []
  })
});
// レート制限: 5req/min
```

### 認証あり利用
```javascript
fetch('https://your-project.supabase.co/functions/v1/claude-chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userJwtToken}`,
  },
  body: JSON.stringify({
    message: 'こんにちは',
    conversationHistory: []
  })
});
// レート制限: 20req/min + ユーザー情報
```

## 🛡️ セキュリティ詳細

- **レート制限**: IP/ユーザーベース自動制限
- **入力検証**: XSS/インジェクション対策
- **CORS**: オリジン制限で不正アクセス防止
- **JWT**: 任意のユーザー認証
- **HTTPS**: 強制暗号化通信
- **ヘッダー**: セキュリティヘッダー自動付与