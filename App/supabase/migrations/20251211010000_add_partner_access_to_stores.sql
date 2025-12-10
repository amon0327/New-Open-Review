-- ============================================================================
-- storesテーブルにパートナー企業からのアクセスを許可
-- ============================================================================

-- 既存のSELECTポリシーを削除して再作成
DROP POLICY IF EXISTS "stores_select_policy" ON stores;

CREATE POLICY "stores_select_policy" ON stores
FOR SELECT
USING (
  -- 直接の会社メンバー
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
  OR
  -- パートナー企業メンバー（提携先企業の店舗を閲覧可能）
  company_id IN (
    SELECT pac.companies_id
    FROM partner_affiliate_companies pac
    JOIN partner_memberships pm ON pm.partner_company_id = pac.partner_company_id
    WHERE pm.business_users_id = auth.uid()
  )
);
