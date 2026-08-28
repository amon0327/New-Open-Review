-- partner_companyテーブルにテーマカラー・ロゴ設定カラムを追加

-- プライマリーカラー（HEXカラーコード）
ALTER TABLE public.partner_company
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#5e17eb';

-- 明るい背景用ロゴURL
ALTER TABLE public.partner_company
ADD COLUMN IF NOT EXISTS logo_light_url TEXT;

-- 暗い背景用ロゴURL
ALTER TABLE public.partner_company
ADD COLUMN IF NOT EXISTS logo_dark_url TEXT;

-- アイコンロゴURL
ALTER TABLE public.partner_company
ADD COLUMN IF NOT EXISTS logo_icon_url TEXT;

-- partner_companyテーブルのUPDATE RLSポリシーを追加
-- パートナーメンバーが自社情報を更新可能にする
CREATE POLICY "partner_company_authenticated_update" ON public.partner_company
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  public.is_partner_member(auth.uid(), id)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  public.is_partner_member(auth.uid(), id)
);
