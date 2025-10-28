-- 緊急対応：RLSポリシーを即座に適用
-- 招待URL処理の406エラーを解決

-- ==== business_users テーブルの緊急修正 ====
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

-- 全てのポリシーを削除してクリーンな状態にする
DROP POLICY IF EXISTS "business_users_select_policy" ON business_users;
DROP POLICY IF EXISTS "business_users_insert_policy" ON business_users;
DROP POLICY IF EXISTS "business_users_update_policy" ON business_users;
DROP POLICY IF EXISTS "business_users_delete_policy" ON business_users;
DROP POLICY IF EXISTS "緊急対応_ユーザー管理EdgeFunction_全操作許可" ON business_users;
DROP POLICY IF EXISTS "service_role_full_access" ON business_users;
DROP POLICY IF EXISTS "authenticated_own_record_select" ON business_users;
DROP POLICY IF EXISTS "authenticated_own_record_update" ON business_users;
DROP POLICY IF EXISTS "authenticated_insert_own_record" ON business_users;
DROP POLICY IF EXISTS "サービスロール_全操作許可" ON business_users;
DROP POLICY IF EXISTS "認証済みユーザー_自分のレコード閲覧" ON business_users;
DROP POLICY IF EXISTS "認証済みユーザー_自分のレコード更新" ON business_users;
DROP POLICY IF EXISTS "認証済みユーザー_自分のレコード作成" ON business_users;

-- サービスロール（Edge Function）用：全操作許可
CREATE POLICY "サービスロール_全操作許可" 
ON business_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 認証済みユーザー：自分のレコードのみ閲覧・操作可能
CREATE POLICY "認証済みユーザー_自分のレコード全操作" 
ON business_users
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 権限を確実に付与
GRANT ALL ON business_users TO service_role;
GRANT ALL ON business_users TO authenticated;

-- ==== その他テーブルの緊急対応 ====

-- store_invitations
ALTER TABLE store_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "サービスロール_招待処理全権限" ON store_invitations;
CREATE POLICY "サービスロール_招待処理全権限" 
ON store_invitations FOR ALL TO service_role 
USING (true) WITH CHECK (true);
GRANT ALL ON store_invitations TO service_role;

-- stores  
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "サービスロール_店舗情報全権限" ON stores;
CREATE POLICY "サービスロール_店舗情報全権限" 
ON stores FOR ALL TO service_role 
USING (true) WITH CHECK (true);
GRANT ALL ON stores TO service_role;

-- companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "サービスロール_会社情報全権限" ON companies;
CREATE POLICY "サービスロール_会社情報全権限" 
ON companies FOR ALL TO service_role 
USING (true) WITH CHECK (true);
GRANT ALL ON companies TO service_role;

-- store_memberships
ALTER TABLE store_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "サービスロール_店舗メンバーシップ全権限" ON store_memberships;
CREATE POLICY "サービスロール_店舗メンバーシップ全権限" 
ON store_memberships FOR ALL TO service_role 
USING (true) WITH CHECK (true);
GRANT ALL ON store_memberships TO service_role;

-- company_memberships
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "サービスロール_会社メンバーシップ全権限" ON company_memberships;
CREATE POLICY "サービスロール_会社メンバーシップ全権限" 
ON company_memberships FOR ALL TO service_role 
USING (true) WITH CHECK (true);
GRANT ALL ON company_memberships TO service_role;

-- シーケンス権限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 結果確認
DO $$
BEGIN
  RAISE NOTICE '=== 緊急RLSポリシー適用完了 ===';
  RAISE NOTICE '✅ business_users: 406エラー解決用ポリシー設定';
  RAISE NOTICE '✅ 全招待関連テーブル: サービスロール全権限設定';
  RAISE NOTICE '✅ 権限付与: service_role、authenticated共に全権限';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 招待URL処理が正常動作するはずです';
  RAISE NOTICE '⚠️  この設定は緊急対応用です';
END $$;