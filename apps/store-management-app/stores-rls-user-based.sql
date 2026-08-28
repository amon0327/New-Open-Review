-- stores テーブル用のユーザーIDベースRLSポリシー
-- 自分のIDと紐付いている店舗のみ閲覧可能（閲覧専用）

-- 1. RLSを有効化
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを全て削除
DROP POLICY IF EXISTS "users_can_view_their_stores" ON public.stores;
DROP POLICY IF EXISTS "users_can_only_view_their_stores" ON public.stores;
DROP POLICY IF EXISTS "users_can_only_view_their_stores_simple" ON public.stores;
DROP POLICY IF EXISTS "users_can_view_stores_by_user_id" ON public.stores;
DROP POLICY IF EXISTS "deny_all_inserts" ON public.stores;
DROP POLICY IF EXISTS "deny_all_updates" ON public.stores;
DROP POLICY IF EXISTS "deny_all_deletes" ON public.stores;

-- 3. 閲覧専用ポリシー：ユーザーIDで店舗アクセス権限をチェック
CREATE POLICY "users_can_view_their_assigned_stores" 
ON public.stores
FOR SELECT
USING (
  -- 認証されたユーザーのみ
  auth.role() = 'authenticated'
  AND
  -- 現在のユーザーIDが、この店舗にアクセス権限を持っているかチェック
  EXISTS (
    SELECT 1 
    FROM business_users bu
    INNER JOIN store_memberships sm ON bu.id = sm.business_user_id
    WHERE bu.id = auth.uid()  -- 現在認証されているユーザーのID
    AND sm.store_id = stores.id  -- この店舗への権限があるか
  )
);

-- 4. 書き込み操作を全て拒否（閲覧専用）
CREATE POLICY "deny_all_store_inserts"
ON public.stores
FOR INSERT
WITH CHECK (false);

CREATE POLICY "deny_all_store_updates"
ON public.stores
FOR UPDATE
USING (false)
WITH CHECK (false);

CREATE POLICY "deny_all_store_deletes"
ON public.stores
FOR DELETE
USING (false);

-- 5. テスト用クエリ（実際の使用時にコメントアウト）
/*
-- RLSポリシーのテスト用クエリ

-- 1. 現在のユーザーIDを確認
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- 2. 現在のユーザーの店舗権限を確認
SELECT 
  bu.id as business_user_id,
  bu.email,
  sm.store_id,
  sm.role,
  s.name as store_name
FROM business_users bu
INNER JOIN store_memberships sm ON bu.id = sm.business_user_id
INNER JOIN stores s ON sm.store_id = s.id
WHERE bu.id = auth.uid();

-- 3. アクセス可能な店舗一覧を取得（RLSが適用される）
SELECT id, name, address, created_at FROM public.stores;

-- 4. 特定の店舗への権限チェック（デバッグ用）
SELECT 
  s.id,
  s.name,
  EXISTS (
    SELECT 1 
    FROM business_users bu
    INNER JOIN store_memberships sm ON bu.id = sm.business_user_id
    WHERE bu.id = auth.uid()
    AND sm.store_id = s.id
  ) as has_access
FROM stores s
LIMIT 5;
*/

-- 6. ポリシーの確認
/*
-- 現在適用されているポリシーを確認
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
WHERE tablename = 'stores' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- RLSの有効状態を確認
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'stores';
*/

-- 7. デバッグ用：権限チェック関数（オプション）
/*
-- ユーザーが特定の店舗にアクセス権限を持っているかチェックする関数
CREATE OR REPLACE FUNCTION check_store_access(store_id_param uuid, user_id_param uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM business_users bu
    INNER JOIN store_memberships sm ON bu.id = sm.business_user_id
    WHERE bu.id = user_id_param
    AND sm.store_id = store_id_param
  );
END;
$$;

-- 使用例: SELECT check_store_access('店舗のUUID');
*/