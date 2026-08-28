-- メッセージ単位のオプション (sender / notificationDisabled / quickReply)
ALTER TABLE line_messages
  ADD COLUMN IF NOT EXISTS notification_disabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sender_name text,
  ADD COLUMN IF NOT EXISTS sender_icon_url text,
  ADD COLUMN IF NOT EXISTS quick_reply_items jsonb;

-- ブロックタイプ拡張: sticker / video / location 追加
ALTER TABLE line_message_blocks
  DROP CONSTRAINT IF EXISTS line_message_blocks_block_type_check;
ALTER TABLE line_message_blocks
  ADD CONSTRAINT line_message_blocks_block_type_check
  CHECK (block_type IN ('text','image','coupon','sticker','video','location'));

ALTER TABLE line_message_blocks
  ADD COLUMN IF NOT EXISTS sticker_package_id integer,
  ADD COLUMN IF NOT EXISTS sticker_id integer,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS location_title text,
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS location_latitude numeric,
  ADD COLUMN IF NOT EXISTS location_longitude numeric;

-- compute_line_audience を拡張: 名前と最終回答日も返す
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
  answer_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_store_ids uuid[];
  v_result_types int[];
  v_selected_qsc text[];
  v_top_preferences text[];
  v_second_preferences text[];
  v_answered_from timestamptz;
  v_answered_to timestamptz;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND current_user <> 'service_role' THEN
    RAISE EXCEPTION 'service_role only';
  END IF;

  v_store_ids := CASE WHEN jsonb_typeof(p_conditions->'store_ids') = 'array' AND jsonb_array_length(p_conditions->'store_ids') > 0
    THEN ARRAY(SELECT jsonb_array_elements_text(p_conditions->'store_ids'))::uuid[] ELSE NULL END;
  v_result_types := CASE WHEN jsonb_typeof(p_conditions->'result_types') = 'array' AND jsonb_array_length(p_conditions->'result_types') > 0
    THEN ARRAY(SELECT (jsonb_array_elements_text(p_conditions->'result_types'))::int) ELSE NULL END;
  v_selected_qsc := CASE WHEN jsonb_typeof(p_conditions->'selected_qsc') = 'array' AND jsonb_array_length(p_conditions->'selected_qsc') > 0
    THEN ARRAY(SELECT jsonb_array_elements_text(p_conditions->'selected_qsc')) ELSE NULL END;
  v_top_preferences := CASE WHEN jsonb_typeof(p_conditions->'top_preferences') = 'array' AND jsonb_array_length(p_conditions->'top_preferences') > 0
    THEN ARRAY(SELECT jsonb_array_elements_text(p_conditions->'top_preferences')) ELSE NULL END;
  v_second_preferences := CASE WHEN jsonb_typeof(p_conditions->'second_preferences') = 'array' AND jsonb_array_length(p_conditions->'second_preferences') > 0
    THEN ARRAY(SELECT jsonb_array_elements_text(p_conditions->'second_preferences')) ELSE NULL END;
  v_answered_from := NULLIF(p_conditions->>'answered_from', '')::timestamptz;
  v_answered_to := NULLIF(p_conditions->>'answered_to', '')::timestamptz;

  RETURN QUERY
  WITH filtered AS (
    SELECT
      paf.user_id,
      paf.created_at AS answered_at
    FROM preset_answer_user_features paf
    WHERE paf.company_id = p_company_id
      AND (v_store_ids IS NULL OR paf.store_id = ANY(v_store_ids))
      AND (v_result_types IS NULL OR paf.result_type = ANY(v_result_types))
      AND (v_selected_qsc IS NULL OR paf.selected_qsc::text = ANY(v_selected_qsc))
      AND (v_top_preferences IS NULL OR paf.top_preference::text = ANY(v_top_preferences))
      AND (v_second_preferences IS NULL OR paf.second_preference::text = ANY(v_second_preferences))
      AND (v_answered_from IS NULL OR paf.created_at >= v_answered_from)
      AND (v_answered_to IS NULL OR paf.created_at <= v_answered_to)
  ),
  agg AS (
    SELECT user_id, MAX(answered_at) AS last_answered_at, COUNT(*) AS answer_count
    FROM filtered GROUP BY user_id
  )
  SELECT
    (u.raw_user_meta_data->>'line_user_id')::text AS line_user_id,
    a.user_id,
    COALESCE(NULLIF(u.raw_user_meta_data->>'name', ''), '名前未取得') AS display_name,
    a.last_answered_at,
    a.answer_count
  FROM agg a
  JOIN auth.users u ON u.id = a.user_id
  WHERE u.raw_user_meta_data->>'line_user_id' IS NOT NULL
  ORDER BY a.last_answered_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.compute_line_audience(uuid, jsonb, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_line_audience(uuid, jsonb, int) TO service_role;
