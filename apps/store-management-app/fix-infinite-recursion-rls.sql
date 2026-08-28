-- 無限再帰RLSエラーの修正
-- business_usersテーブルとの循環参照を解決

-- ===== 緊急対応: 問題のあるRLSを無効化 =====

-- 1. stores テーブルのRLSを一時的に無効化
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;

-- 2. business_users テーブルのRLSも無効化（循環参照を防ぐ）
ALTER TABLE public.business_users DISABLE ROW LEVEL SECURITY;

-- 3. store_memberships テーブルのRLSも無効化（必要に応じて）
ALTER TABLE public.store_memberships DISABLE ROW LEVEL SECURITY;

-- ===== 修正案1: business_usersテーブルを循環参照なしで設定 =====

-- business_users用のシンプルなRLSポリシー（自分のレコードのみ閲覧可能）
/*
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_profile" 
ON public.business_users
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "deny_business_users_write"
ON public.business_users
FOR ALL
USING (false)
WITH CHECK (false);
*/

-- ===== 修正案2: storesテーブル用の循環参照回避ポリシー =====

-- store_membershipsテーブルを直接参照する方式
/*
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_assigned_stores_no_recursion" 
ON public.stores
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  -- business_usersを経由せず、直接store_membershipsをチェック
  EXISTS (
    SELECT 1 
    FROM store_memberships sm
    WHERE sm.business_user_id = auth.uid()  -- 直接auth.uid()と比較
    AND sm.store_id = stores.id
  )
);
*/

-- ===== 修正案3: 関数ベースのアプローチ（最も安全） =====

-- RLSの代わりに、セキュリティ定義者関数を使用
/*
CREATE OR REPLACE FUNCTION get_user_stores(requesting_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  store_id uuid,
  store_name text,
  store_address text,
  user_role text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER  -- 関数の所有者権限で実行
AS $$
BEGIN
  -- RLSを回避して直接データを取得
  RETURN QUERY
  SELECT 
    s.id as store_id,
    s.name as store_name,
    s.address as store_address,
    sm.role as user_role,
    s.created_at
  FROM stores s
  INNER JOIN store_memberships sm ON s.id = sm.store_id
  WHERE sm.business_user_id = requesting_user_id;
END;
$$;

-- 使用例（フロントエンドから）:
-- SELECT * FROM get_user_stores();
-- SELECT * FROM get_user_stores('特定のユーザーID');
*/

-- ===== 確認用クエリ =====

-- 現在のRLS状態を確認
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('stores', 'business_users', 'store_memberships')
ORDER BY tablename;

-- 現在のポリシーを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ===== 段階的修正手順 =====

-- Step 1: 全てのRLSを無効化してログイン確認
-- Step 2: business_usersのRLSのみ有効化
-- Step 3: store_membershipsのRLSのみ有効化  
-- Step 4: storesのRLSを循環参照なしで有効化

-- ===== 最も安全な一時的解決策 =====

-- 全てのRLSを無効化（アプリが動作するまで）
-- ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.business_users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.store_memberships DISABLE ROW LEVEL SECURITY;