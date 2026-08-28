-- パートナーダッシュボード 日次ヒートマップ用 RPC
--
-- 指定月の各企業 × 各日(1〜月末日) の回答数 / コメント数を返す
-- 回答が存在する (company_id, day) の組のみ返却し、それ以外は
-- フロントエンド側でゼロ埋めする想定
-- データ経路は get_partner_company_analytics と同じ
-- (preset_question_answer / preset_question_answer_comment ベース)

CREATE OR REPLACE FUNCTION public.get_partner_company_daily_analytics(p_year_month text)
RETURNS TABLE (
  company_id uuid,
  company_name text,
  day_of_month int,
  response_count bigint,
  comment_count bigint
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
    SELECT
      pqa.id AS answer_id,
      ps.company_id,
      EXTRACT(DAY FROM (pqa.created_at AT TIME ZONE 'Asia/Tokyo'))::int AS dom
    FROM preset_question_answer pqa
    JOIN partner_stores ps ON ps.store_id = pqa.store_id
    JOIN params p ON pqa.created_at >= p.month_start_utc
                 AND pqa.created_at <  p.month_end_utc
  ),
  monthly_comments AS (
    SELECT pqac.id AS comment_id, ma.company_id, ma.dom
    FROM preset_question_answer_comment pqac
    JOIN monthly_answers ma ON ma.answer_id = pqac.preset_question_answer_id
    WHERE COALESCE(pqac.is_hidden, false) = false
      AND pqac.comment IS NOT NULL
      AND length(btrim(pqac.comment)) > 0
  ),
  per_day_response AS (
    SELECT company_id, dom, COUNT(*)::bigint AS cnt
    FROM monthly_answers
    GROUP BY company_id, dom
  ),
  per_day_comment AS (
    SELECT company_id, dom, COUNT(*)::bigint AS cnt
    FROM monthly_comments
    GROUP BY company_id, dom
  )
  SELECT
    c.id    AS company_id,
    c.name  AS company_name,
    pdr.dom AS day_of_month,
    pdr.cnt AS response_count,
    COALESCE(pdc.cnt, 0)::bigint AS comment_count
  FROM per_day_response pdr
  JOIN companies c ON c.id = pdr.company_id
  LEFT JOIN per_day_comment pdc
    ON pdc.company_id = pdr.company_id AND pdc.dom = pdr.dom
  ORDER BY c.name, pdr.dom;
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_company_daily_analytics(text) TO authenticated;
