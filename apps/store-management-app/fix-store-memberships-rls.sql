-- store_memberships テーブルのRLS循環参照修正
-- stores テーブルとのJOINを回避しながら同じ機能を実現

-- 1. 現在のポリシーを確認・削除
SELECT 
  policyname,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'store_memberships';

-- 問題のあるポリシーを削除（実際のポリシー名に置き換えてください）
-- DROP POLICY IF EXISTS "policy_name_here" ON public.store_memberships;

-- 2. 元のロジックを分析
-- 元のポリシー: ユーザーが所属する会社の店舗に関するメンバーシップのみ閲覧可能
-- 問題: stores テーブルをJOINしているため循環参照

-- 3. 修正案1: 二段階アプローチ（推奨）
-- まず company_memberships で会社を特定し、その後 stores の company_id をチェック

CREATE POLICY "users_can_view_company_store_memberships_v1" 
ON public.store_memberships
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  -- 循環参照を避けるため、stores テーブルを直接JOINしない
  -- 代わりに、store_id が所属する会社の店舗かをチェック
  store_id IN (
    -- サブクエリで会社IDを先に取得し、それに基づいて店舗IDを取得
    SELECT s.id
    FROM stores s
    WHERE s.company_id IN (
      -- 現在のユーザーが所属する会社IDを取得
      SELECT cm.company_id
      FROM company_memberships cm
      WHERE cm.business_user_id = auth.uid()
    )
  )
);

-- 4. 修正案2: 更に安全な方式（storesテーブルのRLSに依存しない）
DROP POLICY IF EXISTS "users_can_view_company_store_memberships_v1" ON public.store_memberships;

CREATE POLICY "users_can_view_company_store_memberships_safe" 
ON public.store_memberships
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  -- 現在のユーザーのメンバーシップのみを表示（最も安全）
  business_user_id = auth.uid()
  AND
  -- さらに、その店舗が所属する会社に、ユーザーもメンバーである場合のみ
  EXISTS (
    SELECT 1 
    FROM company_memberships cm, stores s
    WHERE cm.business_user_id = auth.uid()
    AND s.id = store_memberships.store_id
    AND s.company_id = cm.company_id
  )
);

-- 5. 修正案3: 最もシンプルな方式（機能は若干制限される）
DROP POLICY IF EXISTS "users_can_view_company_store_memberships_safe" ON public.store_memberships;

CREATE POLICY "users_can_view_own_store_memberships" 
ON public.store_memberships
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  -- 自分のメンバーシップのみ閲覧可能（最もシンプル）
  business_user_id = auth.uid()
);

-- 6. 修正案4: 関数ベースアプローチ（循環参照を完全回避）
CREATE OR REPLACE FUNCTION get_user_company_store_ids(user_id uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result uuid[];
BEGIN
  -- ユーザーが所属する会社の店舗IDを取得
  SELECT array_agg(s.id)
  FROM stores s
  INNER JOIN company_memberships cm ON s.company_id = cm.company_id
  WHERE cm.business_user_id = user_id
  INTO result;
  
  RETURN COALESCE(result, ARRAY[]::uuid[]);
END;
$$;

-- 関数を使用したポリシー
DROP POLICY IF EXISTS "users_can_view_own_store_memberships" ON public.store_memberships;

CREATE POLICY "users_can_view_company_store_memberships_function" 
ON public.store_memberships
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  store_id = ANY(get_user_company_store_ids())
);

-- 7. 書き込み制限（閲覧専用）
CREATE POLICY "deny_store_memberships_write"
ON public.store_memberships
FOR ALL
USING (false)
WITH CHECK (false);

-- SELECT以外を制限
DROP POLICY IF EXISTS "deny_store_memberships_write" ON public.store_memberships;

CREATE POLICY "deny_store_memberships_insert"
ON public.store_memberships
FOR INSERT
WITH CHECK (false);

CREATE POLICY "deny_store_memberships_update"
ON public.store_memberships
FOR UPDATE
USING (false)
WITH CHECK (false);

CREATE POLICY "deny_store_memberships_delete"
ON public.store_memberships
FOR DELETE
USING (false);

-- 8. 段階的テスト用関数
CREATE OR REPLACE FUNCTION debug_store_memberships_access()
RETURNS TABLE(
  current_user_id uuid,
  company_count bigint,
  company_store_count bigint,
  user_membership_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    (SELECT COUNT(*) FROM company_memberships WHERE business_user_id = auth.uid()) as company_count,
    (SELECT COUNT(*) FROM get_user_company_store_ids()) as company_store_count,
    (SELECT COUNT(*) FROM store_memberships WHERE business_user_id = auth.uid()) as user_membership_count;
END;
$$;

-- 9. 最終推奨ポリシー（最も安定）
-- 上記の修正案の中で最もバランスの取れたもの

DROP POLICY IF EXISTS "users_can_view_company_store_memberships_function" ON public.store_memberships;

CREATE POLICY "company_store_memberships_access" 
ON public.store_memberships
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  (
    -- 自分のメンバーシップは常に閲覧可能
    business_user_id = auth.uid()
    OR
    -- または、同じ会社の店舗のメンバーシップも閲覧可能
    store_id = ANY(get_user_company_store_ids())
  )
);

-- 10. テスト用クエリ
/*
-- デバッグ情報を確認
SELECT * FROM debug_store_memberships_access();

-- ユーザーの会社店舗IDを確認
SELECT get_user_company_store_ids();

-- 実際にアクセス可能なstore_membershipsを取得
SELECT business_user_id, store_id, role FROM store_memberships;

-- 現在のユーザーの状況を確認
SELECT 
  (SELECT COUNT(*) FROM company_memberships WHERE business_user_id = auth.uid()) as my_companies,
  (SELECT COUNT(*) FROM store_memberships WHERE business_user_id = auth.uid()) as my_store_memberships,
  auth.uid() as my_user_id;
*/