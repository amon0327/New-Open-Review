-- business_usersテーブルのRLSポリシーを修正
-- 招待URL処理での406エラーを解決

-- ==== business_users テーブルのRLS修正 ====
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "business_users_select_policy" ON business_users;
DROP POLICY IF EXISTS "business_users_insert_policy" ON business_users;
DROP POLICY IF EXISTS "business_users_update_policy" ON business_users;
DROP POLICY IF EXISTS "business_users_delete_policy" ON business_users;
DROP POLICY IF EXISTS "緊急対応_ユーザー管理EdgeFunction_全操作許可" ON business_users;

-- サービスロール（Edge Function）用ポリシー：全操作許可
CREATE POLICY "service_role_full_access" 
ON business_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 認証済みユーザー：自分のレコードのみ閲覧・更新可能
CREATE POLICY "authenticated_own_record_select" 
ON business_users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "authenticated_own_record_update" 
ON business_users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 認証済みユーザー：新規レコード作成可能（自分のIDのみ）
CREATE POLICY "authenticated_insert_own_record" 
ON business_users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 権限の確認と付与
GRANT ALL ON business_users TO service_role;
GRANT SELECT, INSERT, UPDATE ON business_users TO authenticated;

-- 結果確認
DO $$
BEGIN
  RAISE NOTICE '=== business_users RLS修正完了 ===';
  RAISE NOTICE '✅ サービスロール: 全操作許可（Edge Function用）';
  RAISE NOTICE '✅ 認証済みユーザー: 自分のレコードのみ操作可能';
  RAISE NOTICE '✅ 招待URL処理の406エラーが解決されるはず';
END $$;