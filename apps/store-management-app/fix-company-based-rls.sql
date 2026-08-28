-- 会社メンバーシップベースのRLSポリシー修正版
-- 循環参照を回避しながら同じ機能を実現

-- 1. 問題のあるポリシーを削除
-- まず該当するポリシーを特定して削除する必要があります
-- ポリシー名が不明なので、stores テーブルの全ポリシーを確認
SELECT 
  policyname,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'stores';

-- 問題のあるポリシーを削除（ポリシー名を確認後に実行）
-- DROP POLICY IF EXISTS "policy_name_here" ON public.stores;

-- 2. 循環参照を回避した修正版ポリシー

-- 修正案1: サブクエリを使わない方式
CREATE POLICY "company_members_can_view_stores_v2" 
ON public.stores
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  -- 循環参照を避けるため、company_membershipsテーブルから直接チェック
  EXISTS (
    SELECT 1 
    FROM company_memberships cm
    WHERE cm.business_user_id = auth.uid()
    AND cm.company_id = stores.company_id
  )
);

-- 修正案2: より効率的なJOIN方式（推奨）
DROP POLICY IF EXISTS "company_members_can_view_stores_v2" ON public.stores;

CREATE POLICY "company_members_can_view_stores_optimized" 
ON public.stores
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  company_id IN (
    SELECT cm.company_id
    FROM company_memberships cm
    WHERE cm.business_user_id = auth.uid()
  )
);

-- 修正案3: 最も安全な方式（二段階チェック）
DROP POLICY IF EXISTS "company_members_can_view_stores_optimized" ON public.stores;

CREATE POLICY "company_members_can_view_stores_safe" 
ON public.stores
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  -- まず現在のユーザーがbusiness_usersに存在することを確認
  auth.uid() IN (SELECT id FROM business_users)
  AND
  -- 次に会社メンバーシップを確認（storesテーブルを参照しない）
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
);

-- 4. 書き込み制限ポリシー（閲覧専用）
CREATE POLICY "deny_stores_modifications"
ON public.stores
FOR ALL
USING (false)
WITH CHECK (false);

-- ただし、SELECT用のポリシーは適用する
ALTER POLICY "deny_stores_modifications" ON public.stores RENAME TO "deny_stores_insert_update_delete";

DROP POLICY IF EXISTS "deny_stores_insert_update_delete" ON public.stores;

-- 個別に制限をかける方式
CREATE POLICY "deny_stores_insert"
ON public.stores
FOR INSERT
WITH CHECK (false);

CREATE POLICY "deny_stores_update"
ON public.stores
FOR UPDATE
USING (false)
WITH CHECK (false);

CREATE POLICY "deny_stores_delete"
ON public.stores
FOR DELETE
USING (false);

-- 5. デバッグ用：段階的テスト関数
CREATE OR REPLACE FUNCTION debug_user_company_access()
RETURNS TABLE(
  current_user_id uuid,
  user_role text,
  company_memberships_count bigint,
  accessible_company_ids uuid[],
  accessible_stores_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    auth.role() as user_role,
    (SELECT COUNT(*) FROM company_memberships WHERE business_user_id = auth.uid()) as company_memberships_count,
    (SELECT array_agg(company_id) FROM company_memberships WHERE business_user_id = auth.uid()) as accessible_company_ids,
    (SELECT COUNT(*) FROM stores WHERE company_id IN (
      SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
    )) as accessible_stores_count;
END;
$$;

-- 6. 元のポリシーと同等の機能を持つ最終版（推奨）
-- 上記の修正案の中で最も安定したもの
DROP POLICY IF EXISTS "company_members_can_view_stores_safe" ON public.stores;

CREATE POLICY "company_members_can_view_company_stores" 
ON public.stores
FOR SELECT
USING (
  -- 認証済みユーザーのみ
  auth.role() = 'authenticated'
  AND
  -- 会社IDが、現在のユーザーがメンバーである会社のIDと一致する場合のみ
  -- （stores テーブルを参照せずに実現）
  company_id = ANY(
    SELECT cm.company_id
    FROM company_memberships cm
    WHERE cm.business_user_id = auth.uid()
  )
);

-- 7. テスト用クエリ
/*
-- デバッグ関数を実行してアクセス状況を確認
SELECT * FROM debug_user_company_access();

-- 実際にアクセス可能な店舗を取得
SELECT id, name, company_id FROM stores;

-- 現在のユーザーの会社メンバーシップを確認
SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid();
*/