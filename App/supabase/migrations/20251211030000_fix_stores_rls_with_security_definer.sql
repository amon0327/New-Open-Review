-- ============================================================================
-- storesテーブルのRLSを修正 - SECURITY DEFINER関数を使用
-- ============================================================================

-- まず既存のポリシーを削除
DROP POLICY IF EXISTS "stores_select_policy" ON stores;
DROP POLICY IF EXISTS "stores_insert_policy" ON stores;
DROP POLICY IF EXISTS "stores_update_policy" ON stores;
DROP POLICY IF EXISTS "stores_delete_policy" ON stores;
DROP POLICY IF EXISTS "Enable read access for all users" ON stores;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON stores;
DROP POLICY IF EXISTS "Enable update for users based on company_id" ON stores;
DROP POLICY IF EXISTS "Enable delete for users based on company_id" ON stores;

-- ============================================================================
-- SECURITY DEFINER関数を作成（RLSをバイパスしてチェック）
-- ============================================================================

-- ユーザーが直接企業メンバーかどうかをチェック
CREATE OR REPLACE FUNCTION public.user_is_company_member(check_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM company_memberships cm
    WHERE cm.company_id = check_company_id
    AND cm.business_user_id = auth.uid()
  );
$$;

-- ユーザーがパートナー企業を通じてアクセス可能かどうかをチェック
CREATE OR REPLACE FUNCTION public.user_has_partner_access_to_company(check_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM partner_affiliate_companies pac
    JOIN partner_memberships pm ON pm.partner_company_id = pac.partner_company_id
    WHERE pac.companies_id = check_company_id
    AND pm.business_users_id = auth.uid()
  );
$$;

-- ユーザーが企業にアクセス可能かどうか（直接または間接）をチェック
CREATE OR REPLACE FUNCTION public.user_can_access_company(check_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    public.user_is_company_member(check_company_id)
    OR public.user_has_partner_access_to_company(check_company_id);
$$;

-- ============================================================================
-- RLSポリシーを再作成（SECURITY DEFINER関数を使用）
-- ============================================================================

-- SELECTポリシー（直接メンバーまたはパートナー経由）
CREATE POLICY "stores_select_policy" ON stores
FOR SELECT
USING (public.user_can_access_company(company_id));

-- INSERTポリシー（直接メンバーのみ）
CREATE POLICY "stores_insert_policy" ON stores
FOR INSERT
WITH CHECK (public.user_is_company_member(company_id));

-- UPDATEポリシー（直接メンバーのみ）
CREATE POLICY "stores_update_policy" ON stores
FOR UPDATE
USING (public.user_is_company_member(company_id))
WITH CHECK (public.user_is_company_member(company_id));

-- DELETEポリシー（直接メンバーのみ）
CREATE POLICY "stores_delete_policy" ON stores
FOR DELETE
USING (public.user_is_company_member(company_id));

-- ============================================================================
-- 関数へのGRANT
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.user_is_company_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_partner_access_to_company(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_company(UUID) TO authenticated;
