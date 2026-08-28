-- store_memberships テーブル用の循環参照なしRLSポリシー
-- company_id フィールドを活用して stores テーブルを参照せずに実現

-- 1. 既存のポリシーを削除
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

-- 2. 新しい循環参照なしポリシー（company_id を直接使用）
CREATE POLICY "company_store_memberships_access_v2" 
ON public.store_memberships
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  -- stores テーブルを参照せず、直接 company_id でフィルタリング
  company_id IN (
    SELECT cm.company_id
    FROM company_memberships cm
    WHERE cm.business_user_id = auth.uid()
  )
);

-- 3. 書き込み操作を制限（閲覧専用）
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

-- 4. 代替案1: より厳密な権限制御
-- 自分のメンバーシップ + 同じ会社のメンバーシップ
/*
DROP POLICY IF EXISTS "company_store_memberships_access_v2" ON public.store_memberships;

CREATE POLICY "own_and_company_store_memberships" 
ON public.store_memberships
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  (
    -- 自分のメンバーシップは常に閲覧可能
    business_user_id = auth.uid()
    OR
    -- 同じ会社のメンバーシップも閲覧可能
    company_id IN (
      SELECT cm.company_id
      FROM company_memberships cm
      WHERE cm.business_user_id = auth.uid()
    )
  )
);
*/

-- 5. 代替案2: 最もシンプル（自分のメンバーシップのみ）
/*
DROP POLICY IF EXISTS "company_store_memberships_access_v2" ON public.store_memberships;

CREATE POLICY "own_store_memberships_only" 
ON public.store_memberships
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND business_user_id = auth.uid()
);
*/

-- 6. テスト用クエリ
/*
-- 現在のユーザーを確認
SELECT auth.uid() as current_user, auth.role() as role;

-- 現在のユーザーの会社メンバーシップを確認
SELECT company_id 
FROM company_memberships 
WHERE business_user_id = auth.uid();

-- RLS適用後の store_memberships を確認
SELECT 
  business_user_id,
  store_id,
  role,
  company_id
FROM store_memberships;

-- 件数確認
SELECT COUNT(*) as accessible_memberships FROM store_memberships;
*/

-- 7. 会社ベースアクセスのテスト用関数
CREATE OR REPLACE FUNCTION debug_store_memberships_access_v2()
RETURNS TABLE(
  current_user_id uuid,
  user_companies_count bigint,
  accessible_memberships_count bigint,
  user_company_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    (SELECT COUNT(*) FROM company_memberships WHERE business_user_id = auth.uid()) as user_companies_count,
    (SELECT COUNT(*) FROM store_memberships WHERE company_id IN (
      SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
    )) as accessible_memberships_count,
    (SELECT array_agg(company_id) FROM company_memberships WHERE business_user_id = auth.uid()) as user_company_ids;
END;
$$;

-- 8. 動作確認用クエリ実行例
/*
-- デバッグ情報を取得
SELECT * FROM debug_store_memberships_access_v2();

-- 実際のアクセステスト
SELECT 
  id,
  business_user_id,
  store_id,
  role,
  company_id,
  created_at
FROM store_memberships
ORDER BY created_at DESC;
*/

-- 9. ポリシーの確認
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'store_memberships'
ORDER BY policyname;