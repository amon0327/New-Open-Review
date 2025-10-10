# 🔒 セキュリティ対策実装ガイド

## 概要
created_by_business_user_idテーブルへの不正な書き込みを防ぐための多層防御システムを実装しました。

## 🛡️ 実装されたセキュリティ対策

### 1. **Supabase RLS（Row Level Security）ポリシー**
**ファイル**: `database/security_policies.sql`

```sql
-- テーブルレベルでのアクセス制御
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.created_by_business_user_id ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーのみ自分のレコードを作成・参照可能
CREATE POLICY "Users can create their own business associations" 
ON public.created_by_business_user_id
FOR INSERT WITH CHECK (auth.uid() = business_user_id);
```

### 2. **認証情報からの直接ユーザーID取得**
**ファイル**: `src/components/CompanySetup.js`, `src/components/Dashboard.js`

```javascript
// ❌ 危険：クライアントから送信されるuser.idを信頼
business_user_id: user?.id

// ✅ 安全：認証情報から直接取得
const { data: { user: currentUser } } = await supabase.auth.getUser();
business_user_id: currentUser.id
```

### 3. **Edge Function（サーバーサイドバリデーション）**
**ファイル**: `supabase/functions/create-company/index.ts`

```typescript
// 🔒 JWTトークンから認証情報を取得
const { data: { user } } = await supabase.auth.getUser(token)

// 🔒 サーバーサイドでビジネスロジック実行
// - 重複チェック
// - 入力バリデーション
// - トランザクション処理
```

### 4. **データベーストリガー（最終防御線）**
**ファイル**: `database/security_policies.sql`

```sql
-- 🔒 認証されたユーザーIDとの一致チェック
IF NEW.business_user_id != auth.uid() THEN
  RAISE EXCEPTION 'セキュリティエラー: 認証されたユーザーのIDと一致しません';
END IF;

-- 🔒 重複防止
-- 🔒 データ整合性チェック
-- 🔒 監査ログ記録
```

## 📋 実装手順

### Step 1: データベース設定
1. Supabaseの管理画面にログイン
2. `database/security_policies.sql`のSQLを実行
3. RLSポリシーが正常に作成されたことを確認

### Step 2: Edge Function デプロイ
```bash
# Supabase CLIでEdge Functionをデプロイ
supabase functions deploy create-company
```

### Step 3: フロントエンド更新
1. `src/components/CompanySetup.js`の更新を確認
2. `src/components/Dashboard.js`の更新を確認
3. アプリケーションをテスト

### Step 4: セキュリティテスト
1. 不正なuser_idでのAPI呼び出しテスト
2. 重複登録の防止テスト
3. 認証なしでのアクセステスト

## 🚫 防止される攻撃

### 1. **ユーザーID偽装攻撃**
```javascript
// ❌ 攻撃例：他のユーザーのIDを指定
{
  business_user_id: "other-user-id-12345",
  company_id: "company-id-67890"
}
```
**防御**: RLSポリシーとトリガーで`auth.uid()`との一致をチェック

### 2. **会社ID乗っ取り攻撃**
```javascript
// ❌ 攻撃例：既存の会社IDを指定
{
  business_user_id: "my-user-id",
  company_id: "existing-company-id"
}
```
**防御**: Edge Functionで会社作成とユーザー関連付けを同時実行

### 3. **重複登録攻撃**
```javascript
// ❌ 攻撃例：複数の会社に関連付け
[
  { business_user_id: "my-id", company_id: "company-1" },
  { business_user_id: "my-id", company_id: "company-2" }
]
```
**防御**: UNIQUE制約とトリガーで重複を防止

## 🔍 監査・ログ機能

### 監査ログテーブル
```sql
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  old_data JSONB,
  new_data JSONB
);
```

### ログの確認
```sql
-- 不審なアクティビティの確認
SELECT * FROM public.audit_logs 
WHERE table_name = 'created_by_business_user_id'
ORDER BY created_at DESC;
```

## ⚠️ 注意事項

### 必須設定
1. **RLSポリシー**: 必ずSupabaseで設定してください
2. **Edge Function**: デプロイが必要です
3. **環境変数**: SUPABASE_SERVICE_ROLE_KEYが必要

### テスト推奨項目
- [ ] 正常な会社作成フロー
- [ ] 認証なしでのアクセス拒否
- [ ] 重複登録の防止
- [ ] 不正なユーザーIDでの拒否
- [ ] 監査ログの記録

## 🚀 追加のセキュリティ強化（推奨）

### Rate Limiting
```sql
-- Edge Functionでレート制限を実装
-- 1ユーザーあたり1時間に1回のみ会社作成可能
```

### IPアドレス制限
```typescript
// 特定の地域からのアクセスのみ許可
const allowedCountries = ['JP', 'US'];
```

### 2FA (Two-Factor Authentication)
```javascript
// 会社作成時に追加認証を要求
await supabase.auth.mfa.challenge()
```

---

**🔒 このセキュリティ実装により、created_by_business_user_idテーブルへの不正な書き込みは多層防御によって確実に防止されます。**