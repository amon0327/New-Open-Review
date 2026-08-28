-- 招待プロセステスト用の一時的設定
-- RLSを無効化してEdge Functionの動作を確認

-- ==== テスト用RLS無効化 ====
ALTER TABLE business_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_memberships DISABLE ROW LEVEL SECURITY;

-- ==== 全権限付与 ====
GRANT ALL ON business_users TO authenticated, anon, service_role;
GRANT ALL ON store_invitations TO authenticated, anon, service_role;
GRANT ALL ON stores TO authenticated, anon, service_role;
GRANT ALL ON companies TO authenticated, anon, service_role;
GRANT ALL ON store_memberships TO authenticated, anon, service_role;
GRANT ALL ON company_memberships TO authenticated, anon, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;

-- ==== テストデータの確認 ====
-- 招待データの確認
SELECT 
  id,
  token,
  store_id,
  role,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_since_created
FROM store_invitations 
ORDER BY created_at DESC 
LIMIT 5;

-- 店舗データの確認
SELECT 
  s.id as store_id,
  s.name as store_name,
  s.company_id,
  c.name as company_name
FROM stores s
LEFT JOIN companies c ON s.company_id = c.id
ORDER BY s.created_at DESC
LIMIT 5;

-- business_usersテーブルの確認
SELECT 
  id,
  email,
  name,
  created_at
FROM business_users
ORDER BY created_at DESC
LIMIT 5;

-- ==== 結果通知 ====
DO $$
BEGIN
  RAISE NOTICE '=== 招待プロセステスト環境構築完了 ===';
  RAISE NOTICE '⚠️  RLSが無効化されています（テスト用）';
  RAISE NOTICE '✅ Edge Functionでの招待処理をテスト可能';
  RAISE NOTICE '📝 テスト完了後は必ずRLSを再有効化してください';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 次の手順:';
  RAISE NOTICE '1. 招待URLでログイン';
  RAISE NOTICE '2. Edge Functionログを確認';
  RAISE NOTICE '3. テスト完了後にRLS再有効化';
END $$;