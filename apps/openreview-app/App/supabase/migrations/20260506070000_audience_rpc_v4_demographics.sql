-- 性別/年齢層/来店回数/同伴者/再訪意向時期フィルタを追加 (preset_question_answer JOIN)
DROP FUNCTION IF EXISTS public.compute_line_audience(uuid, jsonb, int);
CREATE OR REPLACE FUNCTION public.compute_line_audience(
  p_company_id uuid,
  p_conditions jsonb DEFAULT '{}'::jsonb,
  p_limit int DEFAULT 10000
)
RETURNS TABLE(
  line_user_id text,
  user_id uuid,
  display_name text,
  last_answered_at timestamptz,
  answer_count bigint,
  last_result_type bigint,
  nps_segment text,
  is_repeater boolean,
  has_revisit_intent boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_store_ids uuid[];
  v_nps_segments text[];
  v_is_repeater boolean;
  v_has_revisit_intent boolean;
  v_genders text[];
  v_age_groups text[];
  v_visit_counts text[];
  v_companions text[];
  v_revisit_periods text[];
  v_answered_from timestamptz;
  v_answered_to timestamptz;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND current_user <> 'service_role' THEN
    RAISE EXCEPTION 'service_role only';
  END IF;

  v_store_ids := CASE WHEN jsonb_typeof(p_conditions->'store_ids') = 'array' AND jsonb_array_length(p_conditions->'store_ids') > 0
    THEN ARRAY(SELECT jsonb_array_elements_text(p_conditions->'store_ids'))::uuid[] ELSE NULL END;
  v_nps_segments := CASE WHEN jsonb_typeof(p_conditions->'nps_segments') = 'array' AND jsonb_array_length(p_conditions->'nps_segments') > 0
    THEN ARRAY(SELECT jsonb_array_elements_text(p_conditions->'nps_segments')) ELSE NULL END;

  v_is_repeater := CASE
    WHEN p_conditions ? 'is_repeater' AND p_conditions->>'is_repeater' = 'true' THEN true
    WHEN p_conditions ? 'is_repeater' AND p_conditions->>'is_repeater' = 'false' THEN false
    ELSE NULL
  END;
  v_has_revisit_intent := CASE
    WHEN p_conditions ? 'has_revisit_intent' AND p_conditions->>'has_revisit_intent' = 'true' THEN true
    WHEN p_conditions ? 'has_revisit_intent' AND p_conditions->>'has_revisit_intent' = 'false' THEN false
    ELSE NULL
  END;

  v_genders := CASE WHEN jsonb_typeof(p_conditions->'genders') = 'array' AND jsonb_array_length(p_conditions->'genders') > 0
    THEN ARRAY(SELECT jsonb_array_elements_text(p_conditions->'genders')) ELSE NULL END;
  v_age_groups := CASE WHEN jsonb_typeof(p_conditions->'age_groups') = 'array' AND jsonb_array_length(p_conditions->'age_groups') > 0
    THEN ARRAY(SELECT jsonb_array_elements_text(p_conditions->'age_groups')) ELSE NULL END;
  v_visit_counts := CASE WHEN jsonb_typeof(p_conditions->'visit_counts') = 'array' AND jsonb_array_length(p_conditions->'visit_counts') > 0
    THEN ARRAY(SELECT jsonb_array_elements_text(p_conditions->'visit_counts')) ELSE NULL END;
  v_companions := CASE WHEN jsonb_typeof(p_conditions->'companions') = 'array' AND jsonb_array_length(p_conditions->'companions') > 0
    THEN ARRAY(SELECT jsonb_array_elements_text(p_conditions->'companions')) ELSE NULL END;
  v_revisit_periods := CASE WHEN jsonb_typeof(p_conditions->'revisit_periods') = 'array' AND jsonb_array_length(p_conditions->'revisit_periods') > 0
    THEN ARRAY(SELECT jsonb_array_elements_text(p_conditions->'revisit_periods')) ELSE NULL END;

  v_answered_from := NULLIF(p_conditions->>'answered_from', '')::timestamptz;
  v_answered_to := NULLIF(p_conditions->>'answered_to', '')::timestamptz;

  RETURN QUERY
  WITH filtered AS (
    SELECT
      paf.user_id AS uid,
      paf.created_at AS answered_at,
      paf.result_type AS rt
    FROM preset_answer_user_features paf
    LEFT JOIN preset_question_answer pqa ON pqa.review_form_submission_id = paf.review_form_submission_id
    WHERE paf.company_id = p_company_id
      AND (v_store_ids IS NULL OR paf.store_id = ANY(v_store_ids))
      AND (v_answered_from IS NULL OR paf.created_at >= v_answered_from)
      AND (v_answered_to IS NULL OR paf.created_at <= v_answered_to)
      AND (v_nps_segments IS NULL OR
        (CASE
          WHEN paf.result_type <= 4 THEN 'promoter'
          WHEN paf.result_type <= 8 THEN 'passive'
          ELSE 'detractor'
        END) = ANY(v_nps_segments))
      AND (v_is_repeater IS NULL OR (paf.result_type % 2 = 1) = v_is_repeater)
      AND (v_has_revisit_intent IS NULL OR (paf.result_type IN (1,2,5,6,9,10)) = v_has_revisit_intent)
      AND (v_genders IS NULL OR pqa.p1_q4::text = ANY(v_genders))
      AND (v_age_groups IS NULL OR pqa.p1_q5::text = ANY(v_age_groups))
      AND (v_visit_counts IS NULL OR pqa.p1_q3::text = ANY(v_visit_counts))
      AND (v_companions IS NULL OR pqa.p1_q6::text = ANY(v_companions))
      AND (v_revisit_periods IS NULL OR pqa.p1_q2::text = ANY(v_revisit_periods))
  ),
  ranked AS (
    SELECT uid, answered_at, rt,
      ROW_NUMBER() OVER (PARTITION BY uid ORDER BY answered_at DESC) AS rn,
      COUNT(*) OVER (PARTITION BY uid) AS cnt,
      MAX(answered_at) OVER (PARTITION BY uid) AS last_at
    FROM filtered
  ),
  agg AS (
    SELECT uid, last_at, cnt, rt AS last_rt
    FROM ranked WHERE rn = 1
  )
  SELECT
    (u.raw_user_meta_data->>'line_user_id')::text,
    a.uid,
    COALESCE(NULLIF(u.raw_user_meta_data->>'name', ''), '名前未取得'),
    a.last_at,
    a.cnt,
    a.last_rt,
    (CASE WHEN a.last_rt <= 4 THEN 'promoter' WHEN a.last_rt <= 8 THEN 'passive' ELSE 'detractor' END)::text,
    (a.last_rt % 2 = 1),
    (a.last_rt IN (1,2,5,6,9,10))
  FROM agg a
  JOIN auth.users u ON u.id = a.uid
  WHERE u.raw_user_meta_data->>'line_user_id' IS NOT NULL
  ORDER BY a.last_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.compute_line_audience(uuid, jsonb, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_line_audience(uuid, jsonb, int) TO service_role;
