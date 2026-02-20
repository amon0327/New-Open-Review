-- partner_affiliate_companiesテーブルにis_deletedカラムを追加（ソフトデリート用）
ALTER TABLE public.partner_affiliate_companies
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- is_deletedカラムにインデックスを追加（フィルタリング高速化）
CREATE INDEX IF NOT EXISTS idx_partner_affiliate_companies_is_deleted
ON public.partner_affiliate_companies (is_deleted);

-- 認証済みユーザーがis_deletedを更新できるポリシーを追加
CREATE POLICY "partner_affiliate_companies_authenticated_update" ON public.partner_affiliate_companies
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  partner_company_id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid()
      AND is_active = true
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  partner_company_id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid()
      AND is_active = true
  )
);
