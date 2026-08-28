-- パートナーテーマ取得用のRPC関数
-- 企業IDからパートナーのテーマ情報（カラー・ロゴ）を取得する
-- SECURITY DEFINER でRLSをバイパスし、企業ユーザーからもアクセス可能にする

CREATE OR REPLACE FUNCTION get_partner_theme(p_company_id uuid)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'primary_color', pc.primary_color,
    'logo_light_url', pc.logo_light_url,
    'logo_dark_url', pc.logo_dark_url,
    'logo_icon_url', pc.logo_icon_url
  )
  FROM partner_affiliate_companies pac
  JOIN partner_company pc ON pc.id = pac.partner_company_id
  WHERE pac.companies_id = p_company_id
    AND pac.is_deleted = false
    AND pc.is_active = true
  LIMIT 1;
$$;

-- anon/authenticatedロールに実行権限を付与
GRANT EXECUTE ON FUNCTION get_partner_theme(uuid) TO anon, authenticated;
