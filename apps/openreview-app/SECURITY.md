# 🛡️ OpenReview セキュリティガイド

## 🏗️ システムアーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │───▶│ Supabase Edge    │───▶│   Claude API    │
│  (Frontend)     │    │   Functions      │    │  (Anthropic)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       
         ▼                       ▼                       
┌─────────────────┐    ┌──────────────────┐              
│ Supabase Auth   │    │   Environment    │              
│   (JWT Token)   │    │   Variables      │              
└─────────────────┘    └──────────────────┘              
```

## 🔐 実装済みセキュリティ機能

### ✅ 認証・認可
- **JWT Token認証**: Supabaseによる安全なトークンベース認証
- **レート制限**:
  - 未認証ユーザー: 1分間に5回
  - 認証済みユーザー: 1分間に20回
- **セッション管理**: 自動トークンリフレッシュ

### ✅ ネットワークセキュリティ
- **CORS制限**: 
  - 開発環境: 全て許可
  - 本番環境: 許可されたドメインのみ
- **Origin/Refererチェック**: 悪意のあるサイトからの要求を拒否
- **HTTPS強制**: 全通信の暗号化

### ✅ データ保護
- **環境変数**: APIキーの安全な管理
- **入力検証**: 
  - メッセージ長制限 (4000文字)
  - 型チェックと値の正規化
- **出力サニタイズ**: XSS防止ヘッダー

### ✅ ログ・監視
- **リクエストログ**: ユーザーID、IP、レスポンス時間
- **エラーログ**: 詳細なエラー情報（開発環境のみ）
- **レート制限ログ**: 制限超過の警告

## ⚙️ 本番環境設定

### 1. 環境変数の設定

#### React App (.env.local)
```bash
REACT_APP_SUPABASE_URL=https://otfreskkeaenahqziriz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_actual_anon_key
REACT_APP_PRODUCTION_DOMAIN=your-domain.com
```

#### Supabase Edge Functions (secrets)
```bash
supabase secrets set ANTHROPIC_API_KEY="your_actual_api_key"
```

### 2. ドメイン設定の更新

**以下のファイルで本番ドメインを設定:**

- `supabase/functions/claude-api/index.ts`
```typescript
const allowedOrigins = [
  'https://your-actual-domain.com',
  'https://your-app.vercel.app'
];
```

### 3. デプロイ前チェックリスト

- [ ] 環境変数が正しく設定されている
- [ ] 本番ドメインがCORS設定に含まれている
- [ ] APIキーがハードコードされていない
- [ ] デバッグ情報が本番で無効化されている

## 🚨 セキュリティリスクと対策

### ⚠️ 現在のリスク

| リスク | レベル | 対策 |
|--------|--------|------|
| APIキー露出 | 🟡 中 | 環境変数の適切な管理 |
| レート制限回避 | 🟡 中 | Redis導入を検討 |
| CORS設定 | 🟡 中 | 本番ドメインの正確な設定 |

### 🔄 追加推奨対策

#### 短期対策 (即時実装可能)
1. **WAF導入**: Cloudflareなどのファイアウォール
2. **ログ監視**: 異常なトラフィックの検出
3. **定期監査**: APIキーとアクセス権限の見直し

#### 長期対策 (将来的な改善)
1. **Redis導入**: 分散レート制限
2. **API署名**: HMAC-based署名認証
3. **監視ダッシュボード**: リアルタイム分析

## 🔧 運用・保守

### 定期メンテナンス
- **月次**: APIキーのローテーション検討
- **週次**: ログの確認とクリーンアップ  
- **日次**: レート制限の監視

### インシデント対応
1. **APIキー漏洩時**: 即座にキーを無効化・再生成
2. **攻撃検知時**: 該当IPをブロック、ログを保全
3. **システム障害時**: フェイルオーバー手順を実行

## 📞 緊急連絡先
- **開発チーム**: your-team@company.com
- **Supabase Support**: https://supabase.com/support
- **Anthropic Support**: https://support.anthropic.com

---

**最終更新**: 2025年8月7日
**セキュリティレビュー**: 本番リリース前に必須実施