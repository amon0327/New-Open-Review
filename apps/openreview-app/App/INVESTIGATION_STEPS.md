# フォーム作成問題調査手順

## 問題の概要
新規作成ボタンを押してもcompany_review_formsテーブルに書き込まれない問題を調査します。

## 調査手順

### 1. フロントエンドでの詳細調査

#### A. ブラウザ開発者ツールでの確認
1. ブラウザで新規作成ボタンをクリック
2. 開発者ツール（F12）を開く
3. **Network**タブで以下を確認：
   - Edge Function（create-review-form）への HTTP リクエストが送信されているか
   - リクエストのステータスコード（200, 400, 500など）
   - レスポンスの内容
   - 認証ヘッダー（Authorization: Bearer token）が含まれているか

#### B. コンソールでのデバッグ実行
```javascript
// 以下のコードをブラウザのコンソールで実行
// 注意: supabaseオブジェクトがグローバルに存在することを確認
```

上記のdebug-form-creation.jsの内容をコンソールで実行してください。

### 2. Edge Functionログの確認

#### Supabaseダッシュボードでの確認手順
1. https://supabase.com/dashboard にアクセス
2. プロジェクトを選択
3. 左メニューの「Edge Functions」をクリック
4. 「create-review-form」関数を選択
5. **Logs**タブまたは**Invocations**タブで以下を確認：
   - 関数が呼び出されているか
   - エラーメッセージが出力されていないか
   - console.error()の出力内容

#### CLI経由でのログ確認（代替方法）
```bash
# Supabase CLIでログを確認
supabase functions logs create-review-form --limit 50
```

### 3. データベース直接確認

#### 現在のテーブル状況確認
```sql
-- 1. テーブルの存在確認
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('companies', 'company_memberships', 'company_review_forms');

-- 2. 現在のユーザーのcompany_memberships確認
SELECT * FROM company_memberships WHERE business_user_id = auth.uid();

-- 3. company_review_formsの全レコード確認
SELECT * FROM company_review_forms ORDER BY created_at DESC LIMIT 10;

-- 4. RLSポリシーの確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'company_review_forms';
```

### 4. 可能性のある原因と対策

#### 原因1: company_membershipsレコードが存在しない
**症状**: Edge Function内で「会社に所属していません」エラー
**確認方法**: デバッグスクリプトのステップ2
**対策**: CompanySetup画面でcompany_membershipsレコードを作成

#### 原因2: Edge Functionの認証エラー
**症状**: 「認証に失敗しました」エラー
**確認方法**: ブラウザのNetworkタブでAuthorizationヘッダー確認
**対策**: ログアウト→再ログインでトークンを更新

#### 原因3: テーブルが存在しない
**症状**: テーブル関連のSQLエラー
**確認方法**: SQLクエリでテーブル存在確認
**対策**: database-fix.sqlを実行してテーブルを作成

#### 原因4: RLSポリシーの問題
**症状**: 権限エラー
**確認方法**: サービスロールでの直接アクセステスト
**対策**: RLSポリシーを見直し

#### 原因5: Edge Function内部エラー
**症状**: 500エラーまたは予期しないエラー
**確認方法**: Edge Functionログ確認
**対策**: Edge Functionコードのデバッグ

### 5. 修正後の確認

修正実施後は以下を確認：
1. 新規作成ボタンクリック
2. company_review_formsテーブルに新しいレコードが作成されるか
3. フォーム編集画面に正常に遷移するか
4. 作成されたフォームがフォーム一覧に表示されるか

## 重要なポイント

- **サービスロール**でのアクセスはRLS制限を回避できる
- **通常ユーザー**でのアクセスはRLSポリシーに従う
- Edge Functionは**サービスロールキー**を使用してアクセス
- ユーザー認証は**JWTトークン**で行う

問題が解決しない場合は、上記の調査結果とエラーメッセージを詳細に報告してください。