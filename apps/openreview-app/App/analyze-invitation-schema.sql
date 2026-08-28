-- 招待テーブルのスキーマを詳細確認
-- 実際のテーブル構造とEdge Functionの不整合を解決

-- ==== store_invitations テーブルの詳細確認 ====
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'store_invitations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==== store_memberships テーブルの詳細確認 ====
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'store_memberships' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==== 外部キー制約の確認 ====
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('store_invitations', 'store_memberships')
  AND tc.table_schema = 'public';

-- ==== ENUMタイプの確認 ====
SELECT 
  t.typname,
  e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('role', 'invitation_status')
ORDER BY t.typname, e.enumsortorder;