-- Optimized function for unread counts (comments and alerts)
-- Replaces multiple complex frontend queries with single optimized query

CREATE OR REPLACE FUNCTION get_unread_counts_optimized(
  p_store_id TEXT,
  p_user_id TEXT
)
RETURNS TABLE (
  comment_count INTEGER,
  alert_count INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- Get comment-related submissions with unread status
  comment_submissions AS (
    SELECT DISTINCT rfs.id as submission_id
    FROM review_form_submissions rfs
    INNER JOIN review_question_answers rqa ON rqa.review_form_submissions_id = rfs.id
    INNER JOIN question_answer_texts qat ON qat.review_question_answers_id = rqa.id
    WHERE rfs.store_id = p_store_id::UUID
      AND qat.answer_text IS NOT NULL 
      AND qat.answer_text != ''
      AND NOT EXISTS (
        SELECT 1 FROM comment_page_view_log cpvl 
        WHERE cpvl.review_form_submissions_id = rfs.id 
        AND cpvl.user_id = p_user_id::UUID
      )
  ),
  
  -- Get alert submissions (NPS <= 6) with attributes
  alert_submissions AS (
    SELECT DISTINCT rfs.id as submission_id
    FROM review_form_submissions rfs
    INNER JOIN review_question_answers rqa ON rqa.review_form_submissions_id = rfs.id
    INNER JOIN question_answer_option_linear_scale qols ON qols.review_question_answers_id = rqa.id
    INNER JOIN review_questions rq ON rq.id = rqa.review_questions_id
    WHERE rfs.store_id = p_store_id::UUID
      AND rq.question_types_id = 9  -- NPS questions
      AND qols.answer_number <= 6   -- Low NPS scores
      AND EXISTS (
        -- Must have attribute data
        SELECT 1 FROM review_question_answers rqa2
        INNER JOIN question_answer_option_choices qaoc ON qaoc.review_question_answers_id = rqa2.id
        INNER JOIN question_display_settings qds ON qds.review_question_id = rqa2.review_questions_id
        WHERE rqa2.review_form_submissions_id = rfs.id
        AND qds.display_type = 'attribute'
      )
      AND NOT EXISTS (
        SELECT 1 FROM alert_view_logs avl 
        WHERE avl.review_form_submissions_id = rfs.id 
        AND avl.user_id = p_user_id::UUID
      )
  )
  
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM comment_submissions) as comment_count,
    (SELECT COUNT(*)::INTEGER FROM alert_submissions) as alert_count;
END;
$$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_comment_page_view_log_submission_user 
ON comment_page_view_log(review_form_submissions_id, user_id);

CREATE INDEX IF NOT EXISTS idx_alert_view_logs_submission_user 
ON alert_view_logs(review_form_submissions_id, user_id);

CREATE INDEX IF NOT EXISTS idx_question_answer_option_linear_scale_score 
ON question_answer_option_linear_scale(review_question_answers_id, answer_number);

CREATE INDEX IF NOT EXISTS idx_question_display_settings_type 
ON question_display_settings(review_question_id, display_type);

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_unread_counts_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_counts_optimized TO service_role;