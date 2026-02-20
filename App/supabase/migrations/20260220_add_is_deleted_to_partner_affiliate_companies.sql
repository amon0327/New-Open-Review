-- partner_affiliate_companiesテーブルにis_deletedカラムを追加（ソフトデリート用）
ALTER TABLE public.partner_affiliate_companies
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- is_deletedカラムにインデックスを追加（フィルタリング高速化）
CREATE INDEX IF NOT EXISTS idx_partner_affiliate_companies_is_deleted
ON public.partner_affiliate_companies (is_deleted);

-- RLSサブクエリ用のSECURITY DEFINER関数（partner_membershipsのRLSを回避）
CREATE OR REPLACE FUNCTION public.is_partner_member(p_user_id uuid, p_partner_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM partner_memberships
    WHERE business_users_id = p_user_id
      AND partner_company_id = p_partner_company_id
      AND is_active = true
  );
$$;

-- 認証済みユーザーがis_deletedを更新できるポリシーを追加
CREATE POLICY "partner_affiliate_companies_authenticated_update" ON public.partner_affiliate_companies
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  public.is_partner_member(auth.uid(), partner_company_id)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  public.is_partner_member(auth.uid(), partner_company_id)
);
