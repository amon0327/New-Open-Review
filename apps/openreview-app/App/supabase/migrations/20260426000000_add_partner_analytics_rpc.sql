-- パートナーダッシュボード 分析機能用 RPC
--
-- パートナーが配下企業の月次の回答数とコメント数を集計できるようにする
-- preset_question_answer / preset_question_answer_comment は
-- パートナー向けの RLS が整っていないため、SECURITY DEFINER 関数で集計し
-- 関数内でパートナー権限を確認することで安全にバイパスする
--
-- データ経路:
--   companies ← stores.company_id
--   stores    ← preset_question_answer.store_id
--   preset_question_answer ← preset_question_answer_comment.preset_question_answer_id
--
-- 月集計は preset_question_answer.created_at (回答日時) を JST で判定する

-- ----------------------------------------------------------------------------
-- 1) データの存在する月のリストを返す関数
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_partner_analytics_months()
RETURNS TABLE (year_month text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH partner_company_ids AS (
    SELECT DISTINCT pac.companies_id AS company_id
    FROM partner_affiliate_companies pac
    JOIN partner_memberships pm ON pac.partner_company_id = pm.partner_company_id
    WHERE pm.business_users_id = auth.uid()
      AND COALESCE(pac.is_deleted, false) = false
  ),
  partner_store_ids AS (
    SELECT s.id AS store_id
    FROM stores s
    WHERE s.company_id IN (SELECT company_id FROM partner_company_ids)
  )
  SELECT DISTINCT to_char(pqa.created_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM') AS year_month
  FROM preset_question_answer pqa
  WHERE pqa.store_id IN (SELECT store_id FROM partner_store_ids)
  ORDER BY year_month DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_analytics_months() TO authenticated;

-- ----------------------------------------------------------------------------
-- 2) 指定月の各企業の回答数 / コメント数を返す関数
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_partner_company_analytics(p_year_month text)
RETURNS TABLE (
  company_id uuid,
  company_name text,
  response_count bigint,
  comment_count bigint,
  is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      ((p_year_month || '-01')::date)::timestamp AT TIME ZONE 'Asia/Tokyo' AS month_start_utc,
      (((p_year_month || '-01')::date) + INTERVAL '1 month')::timestamp AT TIME ZONE 'Asia/Tokyo' AS month_end_utc
  ),
  partner_company_ids AS (
    SELECT DISTINCT pac.companies_id AS company_id
    FROM partner_affiliate_companies pac
    JOIN partner_memberships pm ON pac.partner_company_id = pm.partner_company_id
    WHERE pm.business_users_id = auth.uid()
      AND COALESCE(pac.is_deleted, false) = false
  ),
  partner_stores AS (
    SELECT s.id AS store_id, s.company_id
    FROM stores s
    WHERE s.company_id IN (SELECT company_id FROM partner_company_ids)
  ),
  monthly_answers AS (
    SELECT pqa.id AS answer_id, ps.company_id
    FROM preset_question_answer pqa
    JOIN partner_stores ps ON ps.store_id = pqa.store_id
    JOIN params p ON pqa.created_at >= p.month_start_utc
                 AND pqa.created_at <  p.month_end_utc
  ),
  monthly_comments AS (
    SELECT pqac.id AS comment_id, ma.company_id
    FROM preset_question_answer_comment pqac
    JOIN monthly_answers ma ON ma.answer_id = pqac.preset_question_answer_id
    WHERE COALESCE(pqac.is_hidden, false) = false
      AND pqac.comment IS NOT NULL
      AND length(btrim(pqac.comment)) > 0
  ),
  per_company_response AS (
    SELECT company_id, COUNT(*)::bigint AS cnt
    FROM monthly_answers
    GROUP BY company_id
  ),
  per_company_comment AS (
    SELECT company_id, COUNT(*)::bigint AS cnt
    FROM monthly_comments
    GROUP BY company_id
  )
  SELECT
    c.id            AS company_id,
    c.name          AS company_name,
    COALESCE(pcr.cnt, 0)::bigint AS response_count,
    COALESCE(pcc.cnt, 0)::bigint AS comment_count,
    COALESCE(c.is_active, true)  AS is_active
  FROM partner_company_ids pci
  JOIN companies c ON c.id = pci.company_id
  LEFT JOIN per_company_response pcr ON pcr.company_id = c.id
  LEFT JOIN per_company_comment  pcc ON pcc.company_id = c.id
  ORDER BY response_count DESC, c.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_company_analytics(text) TO authenticated;
