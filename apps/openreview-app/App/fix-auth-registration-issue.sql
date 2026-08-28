-- 招待登録の認証問題を修正するSQL
-- 問題: 初回ログインユーザーで招待完了時に認証エラーが発生

DO $$
BEGIN
  RAISE NOTICE '=== 招待登録認証問題の修正開始 ===';
  RAISE NOTICE '対象: 初回ログインユーザーの招待完了処理';
END $$;

-- ==== 1. business_users テーブルのRLS緩和 ====
-- 問題: 初回ログインユーザーでbusiness_users作成時に権限エラーの可能性

ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- 既存の制限的なポリシーを削除
DROP POLICY IF EXISTS "ユーザー作成_招待完了時のみ_EdgeFunction" ON business_users;
DROP POLICY IF EXISTS "ユーザー確認_招待処理専用_EdgeFunction" ON business_users;
DROP POLICY IF EXISTS "ユーザー更新_招待完了時のみ_EdgeFunction" ON business_users;

-- サービスロール向け：完全な権限を付与（認証問題解決のため）
CREATE POLICY "business_users_service_role_all_access" 
ON business_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==== 2. 認証系テーブルへのアクセス確保 ====
-- auth.usersテーブルへのアクセス権限を確認・付与

-- サービスロールにauth.usersへの読み取り権限を確保
-- これにより Edge Function でのユーザー情報取得を安定化
GRANT SELECT ON auth.users TO service_role;

-- ==== 3. デバッグ用ログ関数作成 ====
-- Edge Function での認証エラーを詳しく調査するための関数

CREATE OR REPLACE FUNCTION debug_user_auth_status(user_id UUID)
RETURNS TABLE (
  user_exists BOOLEAN,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  business_user_exists BOOLEAN,
  total_sessions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM auth.users WHERE id = user_id),
    (SELECT au.last_sign_in_at FROM auth.users au WHERE au.id = user_id),
    (SELECT au.email_confirmed_at FROM auth.users au WHERE au.id = user_id),
    (SELECT au.confirmed_at FROM auth.users au WHERE au.id = user_id),
    EXISTS(SELECT 1 FROM business_users WHERE id = user_id),
    (SELECT COUNT(*)::INTEGER FROM auth.sessions WHERE user_id = debug_user_auth_status.user_id);
END;
$$;

-- ==== 4. 招待完了処理の診断関数 ====
-- 特定の招待トークンで発生している問題を診断

CREATE OR REPLACE FUNCTION diagnose_invitation_issue(invitation_token TEXT)
RETURNS TABLE (
  invitation_found BOOLEAN,
  invitation_status TEXT,
  invitation_created_hours_ago NUMERIC,
  store_exists BOOLEAN,
  company_exists BOOLEAN,
  invitation_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inv_record store_invitations%ROWTYPE;
BEGIN
  -- 招待情報を取得
  SELECT * INTO inv_record 
  FROM store_invitations 
  WHERE token = invitation_token;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, false, false, false;
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    true,
    inv_record.status,
    EXTRACT(EPOCH FROM (now() - inv_record.created_at)) / 3600,
    EXISTS(SELECT 1 FROM stores WHERE id = inv_record.store_id),
    EXISTS(SELECT 1 FROM stores s JOIN companies c ON s.company_id = c.id WHERE s.id = inv_record.store_id),
    (inv_record.status = 'invited' AND inv_record.created_at > (now() - interval '24 hours'));
END;
$$;

-- ==== 5. 権限の再確認と付与 ====
-- 確実にサービスロールが必要な権限を持つように設定

-- 全テーブルへのサービスロール権限を再付与
GRANT ALL ON store_invitations TO service_role;
GRANT ALL ON stores TO service_role;
GRANT ALL ON companies TO service_role;
GRANT ALL ON store_memberships TO service_role;
GRANT ALL ON business_users TO service_role;
GRANT ALL ON company_memberships TO service_role;

-- シーケンス権限も確保
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO service_role;

-- ==== 6. 一時的なデバッグ用ポリシー ====
-- 問題が解決するまでの間、より緩い設定を適用

-- store_invitations: サービスロール全権限
DROP POLICY IF EXISTS "store_invitations_debug_policy" ON store_invitations;
CREATE POLICY "store_invitations_debug_policy" 
ON store_invitations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- stores: サービスロール全権限
DROP POLICY IF EXISTS "stores_debug_policy" ON stores;
CREATE POLICY "stores_debug_policy" 
ON stores
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- companies: サービスロール全権限
DROP POLICY IF EXISTS "companies_debug_policy" ON companies;
CREATE POLICY "companies_debug_policy" 
ON companies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- store_memberships: サービスロール全権限
DROP POLICY IF EXISTS "store_memberships_debug_policy" ON store_memberships;
CREATE POLICY "store_memberships_debug_policy" 
ON store_memberships
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE '=== 修正完了 ===';
  RAISE NOTICE '✅ business_users テーブルのRLS緩和';
  RAISE NOTICE '✅ auth.users へのアクセス権限付与';
  RAISE NOTICE '✅ デバッグ用関数作成';
  RAISE NOTICE '✅ 全テーブルのサービスロール権限強化';
  RAISE NOTICE '';
  RAISE NOTICE '=== 次のステップ ===';
  RAISE NOTICE '1. 実際の招待URLで再テスト';
  RAISE NOTICE '2. 問題が続く場合は以下で診断:';
  RAISE NOTICE '   SELECT * FROM diagnose_invitation_issue(''実際のトークン'');';
  RAISE NOTICE '3. ユーザー認証状態確認:';
  RAISE NOTICE '   SELECT * FROM debug_user_auth_status(''ユーザーID'');';
  RAISE NOTICE '========================';
END $$;