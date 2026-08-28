-- 循環参照を完全に回避する安全なRLS実装

-- ===== 現状確認 =====
-- どのテーブルにRLSが設定されているか確認
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('stores', 'business_users', 'store_memberships', 'company_memberships')
ORDER BY tablename;

-- 現在のポリシーを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ===== 解決策1: 一方向の依存関係のみ設定 =====

-- Step 1: store_memberships のRLSを無効化（またはシンプル化）
-- これにより stores → store_memberships の参照が安全になる

-- 現在の store_memberships のポリシーを確認・削除
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'store_memberships'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.store_memberships';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- store_memberships に最もシンプルなポリシーを設定（循環参照なし）
CREATE POLICY "simple_own_store_memberships" 
ON public.store_memberships
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND business_user_id = auth.uid()  -- 自分のメンバーシップのみ
);

-- 書き込み制限
CREATE POLICY "deny_store_memberships_write"
ON public.store_memberships
FOR INSERT, UPDATE, DELETE
USING (false);

-- Step 2: stores のポリシーを安全に設定
-- 今度は store_memberships が循環参照を起こさないので安全

CREATE POLICY "user_accessible_stores" 
ON public.stores
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND id = ANY(
    SELECT store_id 
    FROM store_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- 書き込み制限
CREATE POLICY "deny_stores_write"
ON public.stores
FOR INSERT, UPDATE, DELETE
USING (false);

-- ===== 解決策2: 完全に関数ベースのアプローチ =====

-- RLSを使わずに、セキュリティ関数でアクセス制御

-- 全てのRLSを無効化
/*
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_memberships DISABLE ROW LEVEL SECURITY;
*/

-- 安全な店舗取得関数
CREATE OR REPLACE FUNCTION get_user_accessible_stores(user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  store_id uuid,
  store_name text,
  store_address text,
  company_id uuid,
  user_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- この関数内ではRLSが適用されないため安全
  RETURN QUERY
  SELECT 
    s.id as store_id,
    s.name as store_name,
    s.address as store_address,
    s.company_id,
    sm.role as user_role
  FROM stores s
  INNER JOIN store_memberships sm ON s.id = sm.store_id
  WHERE sm.business_user_id = user_id;
END;
$$;

-- 安全なメンバーシップ取得関数
CREATE OR REPLACE FUNCTION get_user_store_memberships(user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  membership_id uuid,
  store_id uuid,
  role text,
  store_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id as membership_id,
    sm.store_id,
    sm.role,
    s.name as store_name
  FROM store_memberships sm
  INNER JOIN stores s ON sm.store_id = s.id
  WHERE sm.business_user_id = user_id;
END;
$$;

-- ===== 解決策3: 段階的テスト手順 =====

-- 手順1: 全RLS無効化でベースライン確認
/*
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_memberships DISABLE ROW LEVEL SECURITY;

-- この状態でログイン・動作確認
*/

-- 手順2: store_memberships のみRLS有効化
/*
ALTER TABLE public.store_memberships ENABLE ROW LEVEL SECURITY;
-- simple_own_store_memberships ポリシーのみ適用
-- 動作確認
*/

-- 手順3: stores にRLS追加
/*
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
-- user_accessible_stores ポリシー適用
-- 動作確認
*/

-- ===== テスト用クエリ =====

-- 現在の状況をテスト
/*
-- 1. 基本認証確認
SELECT auth.uid(), auth.role();

-- 2. store_memberships アクセステスト
SELECT COUNT(*) FROM store_memberships;

-- 3. stores アクセステスト
SELECT COUNT(*) FROM stores;

-- 4. 関数経由でのアクセステスト
SELECT * FROM get_user_accessible_stores();
SELECT * FROM get_user_store_memberships();
*/

-- ===== 推奨実装（最も安全） =====

-- 最終的に推奨するのは解決策2（関数ベース）
-- RLSの複雑さを避けて、明確で制御しやすいセキュリティを実現

-- フロントエンドでの使用例:
-- const { data: userStores } = await supabase.rpc('get_user_accessible_stores');
-- const { data: userMemberships } = await supabase.rpc('get_user_store_memberships');