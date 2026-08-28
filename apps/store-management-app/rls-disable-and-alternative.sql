-- JWT Hook無効化後の対応：RLSポリシーの無効化と代替案

-- ===== 緊急対応: RLSを無効化 =====

-- 1. stores テーブルのRLSを無効化
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;

-- 2. 他のテーブルのRLSも確認・無効化（必要に応じて）
-- ALTER TABLE public.business_users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.store_memberships DISABLE ROW LEVEL SECURITY;

-- ===== 代替案1: ユーザーIDベースのRLSポリシー =====
-- JWT Hookを使わずに、直接ユーザーIDで権限管理

/*
-- stores テーブル用のユーザーIDベースRLSポリシー
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "users_can_only_view_their_stores" ON public.stores;

-- 新しいユーザーIDベースのポリシー
CREATE POLICY "users_can_view_stores_by_user_id" 
ON public.stores
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  EXISTS (
    SELECT 1 
    FROM business_users bu
    JOIN store_memberships sm ON bu.id = sm.business_user_id
    WHERE bu.id = auth.uid()  -- 直接auth.uid()を使用
    AND sm.store_id = stores.id
  )
);
*/

-- ===== 代替案2: 関数ベースの権限チェック =====
-- RLSの代わりにアプリケーション側で権限チェック

/*
-- ユーザーがアクセス可能な店舗を取得する関数
CREATE OR REPLACE FUNCTION get_user_accessible_stores(user_id uuid)
RETURNS TABLE(
  store_id uuid,
  store_name text,
  store_address text,
  user_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as store_id,
    s.name as store_name,
    s.address as store_address,
    sm.role as user_role
  FROM stores s
  JOIN store_memberships sm ON s.id = sm.store_id
  JOIN business_users bu ON sm.business_user_id = bu.id
  WHERE bu.id = user_id;
END;
$$;

-- 使用例（フロントエンドから呼び出し）
-- SELECT * FROM get_user_accessible_stores('ユーザーID');
*/

-- ===== 確認用クエリ =====

-- RLSの状態を確認
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('stores', 'business_users', 'store_memberships');

-- 現在のポリシーを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public';

-- ===== ログ確認用 =====
-- Supabaseのログを確認するためのクエリ（必要に応じて使用）
/*
-- 現在のユーザーを確認
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- business_usersテーブルの内容確認
SELECT id, email, name FROM business_users LIMIT 5;

-- store_membershipsテーブルの内容確認  
SELECT business_user_id, store_id, role FROM store_memberships LIMIT 5;

-- storesテーブルの内容確認
SELECT id, name, address FROM stores LIMIT 5;
*/