-- 緊急対応用RLS設定
-- 登録失敗を解決するためのシンプルなポリシー設定

DO $$
BEGIN
  RAISE NOTICE '=== 緊急対応RLS設定を開始 ===';
  RAISE NOTICE '目的: Edge Function での招待処理を確実に動作させる';
  RAISE NOTICE '対象: complete-staff-invitation, validate-staff-invitation';
END $$;

-- ==== store_invitations テーブル（スタッフ招待情報） ====
ALTER TABLE store_invitations ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーをすべて削除
DROP POLICY IF EXISTS "緊急対応_招待処理EdgeFunction_全操作許可" ON store_invitations;
DROP POLICY IF EXISTS "招待処理_EdgeFunction専用_24時間制限" ON store_invitations;
DROP POLICY IF EXISTS "招待閲覧_自社店舗のみ_認証済みユーザー" ON store_invitations;
DROP POLICY IF EXISTS "招待作成_自社店舗のみ_管理者権限" ON store_invitations;
DROP POLICY IF EXISTS "service_role_all_access" ON store_invitations;

-- Edge Function専用：招待の作成・検証・完了処理で全操作許可
CREATE POLICY "緊急対応_招待処理EdgeFunction_全操作許可" 
ON store_invitations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==== stores テーブル（店舗情報） ====
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "緊急対応_店舗情報EdgeFunction_全操作許可" ON stores;
DROP POLICY IF EXISTS "店舗情報_招待処理専用_EdgeFunction" ON stores;
DROP POLICY IF EXISTS "店舗閲覧_自社のみ_ダッシュボード表示" ON stores;
DROP POLICY IF EXISTS "service_role_all_access" ON stores;

-- Edge Function専用：招待処理時の店舗名・住所・会社情報取得で全操作許可
CREATE POLICY "緊急対応_店舗情報EdgeFunction_全操作許可" 
ON stores
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==== companies テーブル（会社情報） ====
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "緊急対応_会社情報EdgeFunction_全操作許可" ON companies;
DROP POLICY IF EXISTS "会社情報_招待表示専用_EdgeFunction" ON companies;
DROP POLICY IF EXISTS "会社閲覧_自社のみ_ダッシュボード表示" ON companies;
DROP POLICY IF EXISTS "service_role_all_access" ON companies;

-- Edge Function専用：招待画面での会社名表示で全操作許可
CREATE POLICY "緊急対応_会社情報EdgeFunction_全操作許可" 
ON companies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==== store_memberships テーブル（店舗スタッフメンバーシップ） ====
ALTER TABLE store_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "緊急対応_スタッフ登録EdgeFunction_全操作許可" ON store_memberships;
DROP POLICY IF EXISTS "スタッフ登録_招待完了時のみ_EdgeFunction" ON store_memberships;
DROP POLICY IF EXISTS "重複チェック_既存メンバー確認_EdgeFunction" ON store_memberships;
DROP POLICY IF EXISTS "メンバー一覧_自社店舗のみ_管理画面表示" ON store_memberships;
DROP POLICY IF EXISTS "service_role_all_access" ON store_memberships;

-- Edge Function専用：スタッフ登録・重複チェック・メンバー管理で全操作許可
CREATE POLICY "緊急対応_スタッフ登録EdgeFunction_全操作許可" 
ON store_memberships
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==== business_users テーブル（ビジネスユーザー情報） ====
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "緊急対応_ユーザー管理EdgeFunction_全操作許可" ON business_users;
DROP POLICY IF EXISTS "ユーザー作成_招待完了時のみ_EdgeFunction" ON business_users;
DROP POLICY IF EXISTS "ユーザー確認_招待処理専用_EdgeFunction" ON business_users;
DROP POLICY IF EXISTS "ユーザー更新_招待完了時のみ_EdgeFunction" ON business_users;
DROP POLICY IF EXISTS "プロフィール閲覧_本人のみ_設定画面" ON business_users;
DROP POLICY IF EXISTS "service_role_all_access" ON business_users;

-- Edge Function専用：ユーザー作成・確認・更新で全操作許可
CREATE POLICY "緊急対応_ユーザー管理EdgeFunction_全操作許可" 
ON business_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==== company_memberships テーブル（会社メンバーシップ） ====
-- このテーブルは既存のポリシーがある可能性があるので確認
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "緊急対応_会社メンバーEdgeFunction_全操作許可" ON company_memberships;

-- Edge Function専用：会社メンバーシップの確認で全操作許可
CREATE POLICY "緊急対応_会社メンバーEdgeFunction_全操作許可" 
ON company_memberships
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==== 権限付与（確実に実行） ====
-- サービスロールに全権限を付与
GRANT ALL ON store_invitations TO service_role;
GRANT ALL ON stores TO service_role;
GRANT ALL ON companies TO service_role;
GRANT ALL ON store_memberships TO service_role;
GRANT ALL ON business_users TO service_role;
GRANT ALL ON company_memberships TO service_role;

-- シーケンス使用権限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 認証済みユーザーにも基本権限を付与（ダッシュボード用）
GRANT SELECT ON store_invitations TO authenticated;
GRANT SELECT ON stores TO authenticated;
GRANT SELECT ON companies TO authenticated;
GRANT SELECT ON store_memberships TO authenticated;
GRANT SELECT ON business_users TO authenticated;
GRANT SELECT ON company_memberships TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '=== 緊急対応RLS設定完了 ===';
  RAISE NOTICE '✅ すべてのテーブルでサービスロール全権限設定';
  RAISE NOTICE '✅ Edge Function での招待処理が動作するはず';
  RAISE NOTICE '⚠️  この設定は緊急対応用です';
  RAISE NOTICE '📝 問題解決後は secure-rls-policies.sql に戻してください';
  RAISE NOTICE '========================';
END $$;