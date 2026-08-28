-- デバッグ用：question_display_settings のデータ確認

-- 1. question_display_settings テーブルの全データ
SELECT 
  qds.id,
  qds.display_name,
  qds.review_question_id,
  qds.created_at,
  rq.question_text,
  rq.question_types_id,
  rq.question_number
FROM question_display_settings qds
LEFT JOIN review_questions rq ON qds.review_question_id = rq.id
ORDER BY qds.created_at DESC;

-- 2. question_display_rule_settings テーブルの存在確認と全データ
-- （テーブルが存在する場合）
SELECT 
  qdrs.id,
  qdrs.question_display_settings_id,
  qdrs.question_option_choices_id,
  qdrs.nps_segments,
  qdrs.created_at,
  qds.display_name,
  qoc.choice_name,
  qoc.choice_number
FROM question_display_rule_settings qdrs
LEFT JOIN question_display_settings qds ON qdrs.question_display_settings_id = qds.id
LEFT JOIN question_option_choices qoc ON qdrs.question_option_choices_id = qoc.id
ORDER BY qds.display_name, qoc.choice_number;

-- 3. review_questions テーブルの質問タイプ別データ確認
SELECT 
  question_types_id,
  COUNT(*) as question_count,
  STRING_AGG(question_text, '; ' ORDER BY question_number) as questions
FROM review_questions
GROUP BY question_types_id
ORDER BY question_types_id;

-- 4. 質問の選択肢データ確認
SELECT 
  rq.id as question_id,
  rq.question_text,
  rq.question_types_id,
  qoc.id as choice_id,
  qoc.choice_name,
  qoc.choice_number,
  COUNT(qaoc.id) as answer_count
FROM review_questions rq
LEFT JOIN question_option_choices qoc ON rq.id = qoc.review_questions_id
LEFT JOIN question_answer_option_choices qaoc ON qoc.id = qaoc.question_option_choices_id
GROUP BY rq.id, rq.question_text, rq.question_types_id, qoc.id, qoc.choice_name, qoc.choice_number
HAVING COUNT(qoc.id) > 0
ORDER BY rq.question_types_id, rq.id, qoc.choice_number;

-- 5. 最近の回答データ確認（選択肢型）
SELECT 
  DATE(qaoc.created_at) as answer_date,
  rq.question_text,
  qoc.choice_name,
  qoc.choice_number,
  COUNT(*) as daily_count
FROM question_answer_option_choices qaoc
INNER JOIN review_question_answers qa ON qaoc.review_question_answers_id = qa.id
INNER JOIN review_questions rq ON qa.review_questions_id = rq.id
INNER JOIN question_option_choices qoc ON qaoc.question_option_choices_id = qoc.id
WHERE qaoc.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(qaoc.created_at), rq.question_text, qoc.choice_name, qoc.choice_number
ORDER BY answer_date DESC, rq.question_text, qoc.choice_number;

-- 6. 最近の回答データ確認（NPS型）
SELECT 
  DATE(qls.created_at) as answer_date,
  rq.question_text,
  qls.answer_number,
  COUNT(*) as daily_count
FROM question_answer_option_linear_scale qls
INNER JOIN review_question_answers qa ON qls.review_question_answers_id = qa.id
INNER JOIN review_questions rq ON qa.review_questions_id = rq.id
WHERE qls.created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND rq.question_types_id = 9
GROUP BY DATE(qls.created_at), rq.question_text, qls.answer_number
ORDER BY answer_date DESC, rq.question_text, qls.answer_number;

-- 7. question_display_settings と実際の回答データの関連確認
SELECT 
  qds.display_name,
  rq.question_text,
  rq.question_types_id,
  CASE 
    WHEN rq.question_types_id = 9 THEN 'NPS (Linear Scale)'
    WHEN rq.question_types_id IN (1, 2) THEN 'Text'
    ELSE 'Choice-based'
  END as question_type_desc,
  COALESCE(choice_answers.count, 0) as choice_answer_count,
  COALESCE(nps_answers.count, 0) as nps_answer_count,
  COALESCE(text_answers.count, 0) as text_answer_count
FROM question_display_settings qds
INNER JOIN review_questions rq ON qds.review_question_id = rq.id
LEFT JOIN (
  SELECT 
    qa.review_questions_id,
    COUNT(*) as count
  FROM question_answer_option_choices qaoc
  INNER JOIN review_question_answers qa ON qaoc.review_question_answers_id = qa.id
  WHERE qaoc.created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY qa.review_questions_id
) choice_answers ON rq.id = choice_answers.review_questions_id
LEFT JOIN (
  SELECT 
    qa.review_questions_id,
    COUNT(*) as count
  FROM question_answer_option_linear_scale qls
  INNER JOIN review_question_answers qa ON qls.review_question_answers_id = qa.id
  WHERE qls.created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY qa.review_questions_id
) nps_answers ON rq.id = nps_answers.review_questions_id
LEFT JOIN (
  SELECT 
    qa.review_questions_id,
    COUNT(*) as count
  FROM question_answer_texts qat
  INNER JOIN review_question_answers qa ON qat.review_questions_answers_id = qa.id
  WHERE qat.created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY qa.review_questions_id
) text_answers ON rq.id = text_answers.review_questions_id
ORDER BY qds.display_name;