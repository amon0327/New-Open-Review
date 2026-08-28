-- ========================================
-- パートナーが所属先企業を UPDATE できるよう権限追加
-- ----------------------------------------
-- 業務提携契約書 第2条・第11条 に基づく仕様:
-- 「乙(パートナー)が顧客との契約締結・解約・契約内容決定を行う」に整合させる。
--
-- 対象: companies テーブル
-- 目的: パートナーが affiliate 先の企業の is_active / deactivation_scheduled_at を
--       画面から変更できるようにする（UI 側は当該2カラムのみ更新）。
-- ========================================

DROP POLICY IF EXISTS "companies_partner_update" ON companies;

CREATE POLICY "companies_partner_update" ON companies
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE is_deleted = false
      AND partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
          AND is_active = true
      )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE is_deleted = false
      AND partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
          AND is_active = true
      )
  )
);

COMMENT ON POLICY "companies_partner_update" ON companies IS
  'Allows partner company members to update affiliated companies (via partner_affiliate_companies). Aligns with the business partnership contract where the partner handles customer contract lifecycle.';
