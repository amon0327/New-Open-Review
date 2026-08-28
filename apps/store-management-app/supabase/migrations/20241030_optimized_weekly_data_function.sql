-- Optimized database function for weekly data aggregation
-- Replaces 6 separate frontend queries with single optimized query

CREATE OR REPLACE FUNCTION get_optimized_weekly_data(
  p_store_id TEXT,
  p_week_start TIMESTAMPTZ,
  p_week_end TIMESTAMPTZ
)
RETURNS TABLE (
  date_key TEXT,
  nps_score INTEGER,
  submission_count INTEGER,
  comment_count INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- Get display settings and question IDs in one CTE
  question_config AS (
    SELECT DISTINCT 
      COALESCE(qds.review_question_id, rq.id) as question_id,
      rq.question_types_id,
      rq.review_fome_id
    FROM review_questions rq
    LEFT JOIN question_display_settings qds ON qds.review_question_id = rq.id
    WHERE rq.store_id = p_store_id::UUID
  ),
  
  -- NPS data with optimized date handling
  nps_daily AS (
    SELECT 
      DATE(qols.created_at AT TIME ZONE 'Asia/Tokyo') as date_key,
      qols.answer_number as nps_score
    FROM question_answer_option_linear_scale qols
    INNER JOIN review_question_answers rqa ON rqa.id = qols.review_question_answers_id
    INNER JOIN question_config qc ON qc.question_id = rqa.review_questions_id
    WHERE rqa.store_id = p_store_id::UUID
      AND qc.question_types_id = 9  -- NPS questions only
      AND qols.created_at >= p_week_start
      AND qols.created_at < p_week_end
  ),
  
  -- Comments data
  comments_daily AS (
    SELECT 
      DATE(qat.created_at AT TIME ZONE 'Asia/Tokyo') as date_key,
      COUNT(*) as comment_count
    FROM question_answer_texts qat
    INNER JOIN review_question_answers rqa ON rqa.id = qat.review_question_answers_id
    INNER JOIN question_config qc ON qc.question_id = rqa.review_questions_id
    WHERE rqa.store_id = p_store_id::UUID
      AND qc.question_types_id IN (1, 2)  -- Text questions only
      AND qat.created_at >= p_week_start
      AND qat.created_at < p_week_end
      AND qat.answer_text IS NOT NULL
      AND qat.answer_text != ''
    GROUP BY DATE(qat.created_at AT TIME ZONE 'Asia/Tokyo')
  ),
  
  -- Submissions data
  submissions_daily AS (
    SELECT 
      DATE(rfs.created_at AT TIME ZONE 'Asia/Tokyo') as date_key,
      COUNT(*) as submission_count
    FROM review_form_submissions rfs
    INNER JOIN question_config qc ON qc.review_fome_id = rfs.review_forms_id
    WHERE rfs.store_id = p_store_id::UUID
      AND rfs.created_at >= p_week_start
      AND rfs.created_at < p_week_end
    GROUP BY DATE(rfs.created_at AT TIME ZONE 'Asia/Tokyo')
  ),
  
  -- Generate all dates in the week range
  date_series AS (
    SELECT DATE(generate_series(
      p_week_start::DATE,
      (p_week_start::DATE + INTERVAL '6 days')::DATE,
      INTERVAL '1 day'
    )) as date_key
  )
  
  -- Final aggregated result
  SELECT 
    ds.date_key::TEXT,
    nd.nps_score,
    COALESCE(sd.submission_count, 0)::INTEGER,
    COALESCE(cd.comment_count, 0)::INTEGER
  FROM date_series ds
  LEFT JOIN nps_daily nd ON nd.date_key = ds.date_key
  LEFT JOIN submissions_daily sd ON sd.date_key = ds.date_key
  LEFT JOIN comments_daily cd ON cd.date_key = ds.date_key
  ORDER BY ds.date_key;
END;
$$;

-- Add index for performance optimization
CREATE INDEX IF NOT EXISTS idx_question_answer_option_linear_scale_created_store 
ON question_answer_option_linear_scale(created_at, review_question_answers_id);

CREATE INDEX IF NOT EXISTS idx_question_answer_texts_created_store 
ON question_answer_texts(created_at, review_question_answers_id);

CREATE INDEX IF NOT EXISTS idx_review_form_submissions_created_store 
ON review_form_submissions(created_at, store_id, review_forms_id);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_optimized_weekly_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_optimized_weekly_data TO service_role;