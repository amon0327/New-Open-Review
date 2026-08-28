-- テストデータ作成用SQL
-- アラート詳細機能をテストするための実際のレビュー回答データを作成

-- 1. 仮のbusiness_user作成（既存のものを使用する場合はスキップ）
-- INSERT INTO business_users (id, email, name, created_at) 
-- VALUES ('f3e1b3a2-c80a-4fe6-9278-e35e59425c30', 'test@example.com', 'テストユーザー', NOW());

-- 2. 仮のstore作成（既存のものを使用する場合はスキップ）
-- INSERT INTO stores (id, name, address, company_id, created_at)
-- VALUES ('12345678-1234-1234-1234-123456789012', 'テスト店舗', '東京都渋谷区', '87654321-4321-4321-4321-210987654321', NOW());

-- 3. review_form_submissions を作成（フォーム回答投稿）
INSERT INTO review_form_submissions (id, created_at, review_forms_id, store_id)
VALUES 
  ('sub-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day', '2c92cfca-5dfe-42c3-8bb9-8558ea8a7f01', '12345678-1234-1234-1234-123456789012'),
  ('sub-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days', '2c92cfca-5dfe-42c3-8bb9-8558ea8a7f01', '12345678-1234-1234-1234-123456789012'),
  ('sub-3333-3333-3333-333333333333', NOW() - INTERVAL '3 days', '2c92cfca-5dfe-42c3-8bb9-8558ea8a7f01', '12345678-1234-1234-1234-123456789012');

-- 4. review_question_answers を作成（質問への回答）
-- 既存の質問IDを使用してテスト回答を作成
WITH existing_questions AS (
  SELECT id, question_types_id, question_number 
  FROM review_questions 
  WHERE review_fome_id = '2c92cfca-5dfe-42c3-8bb9-8558ea8a7f01'
  ORDER BY question_number
  LIMIT 10
),
test_submissions AS (
  SELECT unnest(ARRAY[
    'sub-1111-1111-1111-111111111111',
    'sub-2222-2222-2222-222222222222', 
    'sub-3333-3333-3333-333333333333'
  ]) as submission_id
)
INSERT INTO review_question_answers (id, created_at, review_form_submissions_id, review_questions_id, store_id)
SELECT 
  gen_random_uuid(),
  NOW() - (row_number() OVER ()) * INTERVAL '1 hour',
  ts.submission_id,
  eq.id,
  '12345678-1234-1234-1234-123456789012'
FROM existing_questions eq
CROSS JOIN test_submissions ts;

-- 5. question_answer_texts を作成（テキスト回答）
-- 質問タイプ1,2（テキスト質問）の回答
INSERT INTO question_answer_texts (id, created_at, review_questions_answers_id, answer_text)
SELECT 
  gen_random_uuid(),
  rqa.created_at,
  rqa.id,
  CASE 
    WHEN rq.question_types_id = 1 THEN '素晴らしいサービスでした。スタッフの対応が丁寧で感動しました。'
    WHEN rq.question_types_id = 2 THEN '特に改善点はありませんが、強いて言えば待ち時間がもう少し短いと良いです。'
    ELSE 'テスト回答'
  END
FROM review_question_answers rqa
JOIN review_questions rq ON rqa.review_questions_id = rq.id
WHERE rq.question_types_id IN (1, 2);

-- 6. question_answer_option_linear_scale を作成（NPS回答）
-- 質問タイプ9（NPS）の回答
INSERT INTO question_answer_option_linear_scale (id, created_at, review_question_answers_id, answer_number)
SELECT 
  gen_random_uuid(),
  rqa.created_at,
  rqa.id,
  -- ランダムなNPSスコア（6以下の低いスコアも含む）
  CASE rqa.review_form_submissions_id
    WHEN 'sub-1111-1111-1111-111111111111' THEN 4  -- 低いスコア（アラート対象）
    WHEN 'sub-2222-2222-2222-222222222222' THEN 6  -- 低いスコア（アラート対象）
    WHEN 'sub-3333-3333-3333-333333333333' THEN 9  -- 高いスコア
    ELSE 7
  END
FROM review_question_answers rqa
JOIN review_questions rq ON rqa.review_questions_id = rq.id
WHERE rq.question_types_id = 9;

-- 7. question_answer_option_choices を作成（選択肢回答）
-- 質問タイプ3,4,5,6,7,8（選択肢質問）の回答
INSERT INTO question_answer_option_choices (id, created_at, review_question_answers_id, question_option_choices_id, store_id)
SELECT 
  gen_random_uuid(),
  rqa.created_at,
  rqa.id,
  -- 各質問の最初の選択肢を選択
  (SELECT qoc.id 
   FROM question_option_choices qoc 
   WHERE qoc.review_questions_id = rq.id 
   ORDER BY qoc.choice_number 
   LIMIT 1),
  '12345678-1234-1234-1234-123456789012'
FROM review_question_answers rqa
JOIN review_questions rq ON rqa.review_questions_id = rq.id
WHERE rq.question_types_id IN (3, 4, 5, 6, 7, 8)
AND EXISTS (
  SELECT 1 FROM question_option_choices qoc 
  WHERE qoc.review_questions_id = rq.id
);

-- 8. データ確認用クエリ
-- 作成されたデータを確認
SELECT 
  'review_form_submissions' as table_name,
  COUNT(*) as count
FROM review_form_submissions
UNION ALL
SELECT 
  'review_question_answers',
  COUNT(*)
FROM review_question_answers
UNION ALL
SELECT 
  'question_answer_texts',
  COUNT(*)
FROM question_answer_texts
UNION ALL
SELECT 
  'question_answer_option_linear_scale',
  COUNT(*)
FROM question_answer_option_linear_scale
UNION ALL
SELECT 
  'question_answer_option_choices',
  COUNT(*)
FROM question_answer_option_choices;

-- 9. アラート対象データの確認
-- NPS 6以下のデータ確認
SELECT 
  rqa.id as alert_id,
  scale.answer_number as nps_score,
  rqa.created_at
FROM review_question_answers rqa
JOIN question_answer_option_linear_scale scale ON scale.review_question_answers_id = rqa.id
WHERE scale.answer_number <= 6
ORDER BY rqa.created_at DESC;