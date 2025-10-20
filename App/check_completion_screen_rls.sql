-- Check RLS policies for completion_screen_settings table

-- Check if RLS is enabled
SELECT 
  t.table_name,
  c.relrowsecurity as rls_enabled
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_name = 'completion_screen_settings'
  AND t.table_schema = 'public';

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'completion_screen_settings'
ORDER BY policyname;