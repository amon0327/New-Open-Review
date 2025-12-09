-- Fix Review Forms RLS policies to use company_id directly
-- Also add partner membership access support

-- ============================================================================
-- Drop existing policies
-- ============================================================================
DROP POLICY IF EXISTS "review_forms_select_policy" ON review_forms;
DROP POLICY IF EXISTS "review_forms_insert_policy" ON review_forms;
DROP POLICY IF EXISTS "review_forms_update_policy" ON review_forms;
DROP POLICY IF EXISTS "review_forms_delete_policy" ON review_forms;

-- ============================================================================
-- SELECT Policy: 以下のいずれかに該当するフォームを表示可能
-- 1. 自分が作成したフォーム (business_users = auth.uid())
-- 2. 自分が所属する会社のフォーム (company_id経由)
-- 3. パートナーメンバーシップ経由でアクセス可能な会社のフォーム
-- ============================================================================
CREATE POLICY "review_forms_select_policy" ON review_forms
FOR SELECT
USING (
  -- 自分が作成したフォーム
  business_users = auth.uid()
  OR
  -- 自分が所属する会社のフォーム (company_memberships経由)
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
  OR
  -- パートナーメンバーシップ経由でアクセス可能な会社のフォーム
  company_id IN (
    SELECT pac.companies_id
    FROM partner_affiliate_companies pac
    JOIN partner_memberships pm ON pac.partner_company_id = pm.partner_company_id
    WHERE pm.business_users_id = auth.uid()
  )
);

-- ============================================================================
-- INSERT Policy: サービスロールまたは認証されたユーザーのみフォーム作成可能
-- ============================================================================
CREATE POLICY "review_forms_insert_policy" ON review_forms
FOR INSERT
WITH CHECK (
  -- サービスロールは制限なし
  auth.role() = 'service_role'
  OR
  -- 通常ユーザーは自分のIDでのみ作成可能
  business_users = auth.uid()
);

-- ============================================================================
-- UPDATE Policy: 以下のいずれかに該当するフォームを更新可能
-- 1. 自分が作成したフォーム
-- 2. 自分が所属する会社のフォーム
-- 3. パートナーメンバーシップ経由でアクセス可能な会社のフォーム
-- ============================================================================
CREATE POLICY "review_forms_update_policy" ON review_forms
FOR UPDATE
USING (
  -- 自分が作成したフォーム
  business_users = auth.uid()
  OR
  -- 自分が所属する会社のフォーム
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
  OR
  -- パートナーメンバーシップ経由
  company_id IN (
    SELECT pac.companies_id
    FROM partner_affiliate_companies pac
    JOIN partner_memberships pm ON pac.partner_company_id = pm.partner_company_id
    WHERE pm.business_users_id = auth.uid()
  )
)
WITH CHECK (
  -- 自分が作成したフォーム
  business_users = auth.uid()
  OR
  -- 自分が所属する会社のフォーム
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
  OR
  -- パートナーメンバーシップ経由
  company_id IN (
    SELECT pac.companies_id
    FROM partner_affiliate_companies pac
    JOIN partner_memberships pm ON pac.partner_company_id = pm.partner_company_id
    WHERE pm.business_users_id = auth.uid()
  )
);

-- ============================================================================
-- DELETE Policy: 以下のいずれかに該当するフォームを削除可能
-- 1. 自分が作成したフォーム
-- 2. 自分が所属する会社のフォーム
-- 3. パートナーメンバーシップ経由でアクセス可能な会社のフォーム
-- ============================================================================
CREATE POLICY "review_forms_delete_policy" ON review_forms
FOR DELETE
USING (
  -- 自分が作成したフォーム
  business_users = auth.uid()
  OR
  -- 自分が所属する会社のフォーム
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
  OR
  -- パートナーメンバーシップ経由
  company_id IN (
    SELECT pac.companies_id
    FROM partner_affiliate_companies pac
    JOIN partner_memberships pm ON pac.partner_company_id = pm.partner_company_id
    WHERE pm.business_users_id = auth.uid()
  )
);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON POLICY "review_forms_select_policy" ON review_forms IS
  'Allows users to view forms they created, forms from their company (via company_memberships), or forms from companies accessible via partner membership';

COMMENT ON POLICY "review_forms_update_policy" ON review_forms IS
  'Allows users to update forms they created, forms from their company (via company_memberships), or forms from companies accessible via partner membership';

COMMENT ON POLICY "review_forms_delete_policy" ON review_forms IS
  'Allows users to delete forms they created, forms from their company (via company_memberships), or forms from companies accessible via partner membership';
