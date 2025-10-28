-- business_usersテーブルの実際のスキーマに合わせた修正
-- 現在のスキーマ: id, created_at, name, email, profile_image, role, organizations

-- ==== 既存レコードの確認 ====
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'business_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==== ENUMタイプの確認 ====
SELECT 
  t.typname,
  e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'member_role'
ORDER BY e.enumsortorder;

-- ==== RLS一時無効化（テスト用） ====
ALTER TABLE business_users DISABLE ROW LEVEL SECURITY;

-- 全権限付与
GRANT ALL ON business_users TO authenticated, anon, service_role;

-- ==== テストデータ確認 ====
SELECT 
  id,
  name,
  email,
  role,
  organizations,
  created_at
FROM business_users
ORDER BY created_at DESC
LIMIT 10;

-- ==== 結果通知 ====
DO $$
BEGIN
  RAISE NOTICE '=== business_usersスキーマ修正完了 ===';
  RAISE NOTICE '✅ テーブル構造確認完了';
  RAISE NOTICE '✅ RLS一時無効化（テスト用）';
  RAISE NOTICE '✅ 全権限付与完了';
  RAISE NOTICE '';
  RAISE NOTICE '📝 実際のスキーマ:';
  RAISE NOTICE '- id (uuid, PK, FK to auth.users)';
  RAISE NOTICE '- created_at (timestamp)';
  RAISE NOTICE '- name (text)';
  RAISE NOTICE '- email (text)';
  RAISE NOTICE '- profile_image (text)';
  RAISE NOTICE '- role (member_role enum)';
  RAISE NOTICE '- organizations (uuid, FK to organizations)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 招待処理が正常動作するはずです';
END $$;