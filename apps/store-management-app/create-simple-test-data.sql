-- シンプルなテストデータ作成（回答データが必要）
-- 既存の質問に対する実際の回答データを作成

-- 1. 既存の質問IDを取得して確認
SELECT 'Questions available:' as info;
SELECT id, question_text, question_types_id, question_number 
FROM review_questions 
WHERE review_fome_id = '2c92cfca-5dfe-42c3-8bb9-8558ea8a7f01'
ORDER BY question_number
LIMIT 10;

-- 2. 既存の選択肢を確認
SELECT 'Choice options available:' as info;
SELECT qoc.id, qoc.choice_name, qoc.choice_number, qoc.review_questions_id, rq.question_text
FROM question_option_choices qoc
JOIN review_questions rq ON qoc.review_questions_id = rq.id
WHERE rq.review_fome_id = '2c92cfca-5dfe-42c3-8bb9-8558ea8a7f01'
ORDER BY rq.question_number, qoc.choice_number
LIMIT 20;

-- 3. 仮のstore_idを使用してテストデータ作成
-- review_form_submissions を作成
INSERT INTO review_form_submissions (id, created_at, review_forms_id, store_id)
VALUES 
  ('test-sub-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day', '2c92cfca-5dfe-42c3-8bb9-8558ea8a7f01', 'test-store-1234-1234-1234-123456789012'),
  ('test-sub-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days', '2c92cfca-5dfe-42c3-8bb9-8558ea8a7f01', 'test-store-1234-1234-1234-123456789012')
ON CONFLICT (id) DO NOTHING;

-- 4. review_question_answers を作成（最初の5つの質問に対して）
INSERT INTO review_question_answers (id, created_at, review_form_submissions_id, review_questions_id, store_id)
SELECT 
  'answer-' || row_number() OVER() || '-' || substr(rq.id::text, 1, 8),
  NOW() - INTERVAL '1 day',
  'test-sub-1111-1111-1111-111111111111',
  rq.id,
  'test-store-1234-1234-1234-123456789012'
FROM (
  SELECT id, question_types_id, question_number 
  FROM review_questions 
  WHERE review_fome_id = '2c92cfca-5dfe-42c3-8bb9-8558ea8a7f01'
  ORDER BY question_number
  LIMIT 5
) rq
ON CONFLICT (id) DO NOTHING;

-- 5. 実際のデータを使って選択肢回答を作成
INSERT INTO question_answer_option_choices (id, created_at, review_question_answers_id, question_option_choices_id, store_id)
SELECT 
  'choice-answer-' || row_number() OVER(),
  NOW() - INTERVAL '1 day',
  rqa.id,
  qoc.id,
  'test-store-1234-1234-1234-123456789012'
FROM review_question_answers rqa
JOIN review_questions rq ON rqa.review_questions_id = rq.id
JOIN question_option_choices qoc ON qoc.review_questions_id = rq.id
WHERE rqa.review_form_submissions_id = 'test-sub-1111-1111-1111-111111111111'
AND rq.question_types_id IN (3, 4, 5, 6, 7, 8)  -- 選択肢系の質問タイプ
AND qoc.choice_number = 1  -- 最初の選択肢を選択
ON CONFLICT (id) DO NOTHING;

-- 6. NPSアラート対象データを作成
INSERT INTO question_answer_option_linear_scale (id, created_at, review_question_answers_id, answer_number)
SELECT 
  'nps-answer-' || row_number() OVER(),
  NOW() - INTERVAL '1 day',
  rqa.id,
  4  -- NPSスコア4（アラート対象）
FROM review_question_answers rqa
JOIN review_questions rq ON rqa.review_questions_id = rq.id
WHERE rqa.review_form_submissions_id = 'test-sub-1111-1111-1111-111111111111'
AND rq.question_types_id = 9  -- NPSタイプ
ON CONFLICT (id) DO NOTHING;

-- 7. テキスト回答を作成
INSERT INTO question_answer_texts (id, created_at, review_questions_answers_id, answer_text)
SELECT 
  'text-answer-' || row_number() OVER(),
  NOW() - INTERVAL '1 day',
  rqa.id,
  '素晴らしいサービスでした。改善点としては待ち時間をもう少し短くしていただけると良いです。'
FROM review_question_answers rqa
JOIN review_questions rq ON rqa.review_questions_id = rq.id
WHERE rqa.review_form_submissions_id = 'test-sub-1111-1111-1111-111111111111'
AND rq.question_types_id IN (1, 2)  -- テキストタイプ
ON CONFLICT (id) DO NOTHING;

-- 8. データ確認
SELECT 'Test data created successfully!' as result;
SELECT 
  COUNT(*) as review_question_answers_count
FROM review_question_answers 
WHERE review_form_submissions_id = 'test-sub-1111-1111-1111-111111111111';

SELECT 
  COUNT(*) as choice_answers_count
FROM question_answer_option_choices 
WHERE store_id = 'test-store-1234-1234-1234-123456789012';

-- 9. 作成されたNPSアラート対象データの確認
SELECT 
  rqa.id,
  scale.answer_number,
  rq.question_text
FROM review_question_answers rqa
JOIN question_answer_option_linear_scale scale ON scale.review_question_answers_id = rqa.id
JOIN review_questions rq ON rqa.review_questions_id = rq.id
WHERE scale.answer_number <= 6;