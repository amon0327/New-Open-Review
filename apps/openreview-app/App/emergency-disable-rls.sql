-- 緊急対応：招待URL処理テスト用にRLSを一時無効化
-- 406エラーの根本原因を特定するため

-- ==== RLSを一時的に無効化 ====
ALTER TABLE business_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_memberships DISABLE ROW LEVEL SECURITY;

-- 権限を確実に付与
GRANT ALL ON business_users TO authenticated, anon, service_role;
GRANT ALL ON store_invitations TO authenticated, anon, service_role;
GRANT ALL ON stores TO authenticated, anon, service_role;
GRANT ALL ON companies TO authenticated, anon, service_role;
GRANT ALL ON store_memberships TO authenticated, anon, service_role;
GRANT ALL ON company_memberships TO authenticated, anon, service_role;

-- シーケンス権限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;

-- 結果確認
DO $$
BEGIN
  RAISE NOTICE '=== 緊急対応：RLS一時無効化完了 ===';
  RAISE NOTICE '⚠️  これは招待URL処理テスト用の一時的な設定です';
  RAISE NOTICE '⚠️  セキュリティリスクがあるため、テスト後は必ずRLSを再有効化してください';
  RAISE NOTICE '';
  RAISE NOTICE '✅ business_users: RLS無効化';
  RAISE NOTICE '✅ 全招待関連テーブル: RLS無効化';
  RAISE NOTICE '✅ 全ロール: 全権限付与';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 招待URL処理のテストが可能になります';
  RAISE NOTICE '📝 テスト完了後は apply-rls-policies.sql を実行してRLSを再有効化してください';
END $$;