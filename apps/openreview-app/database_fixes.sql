-- 均等目盛データ表示問題の修正用SQL
-- 外部キー制約の修正

-- 1. test_question_answer_option_linear_scale テーブルの外部キー制約修正
-- 既存の間違った制約を削除
ALTER TABLE public.test_question_answer_option_linear_scale 
DROP CONSTRAINT IF EXISTS test_question_answer_option_linear_scale_review_question_answer;

-- 正しいテストテーブルを参照する制約を追加
ALTER TABLE public.test_question_answer_option_linear_scale 
ADD CONSTRAINT test_question_answer_option_linear_scale_review_question_answer_fkey 
FOREIGN KEY (review_question_answers_id) REFERENCES test_review_question_answers (id);

-- 2. test_question_answer_option_choices テーブルの外部キー制約修正
-- 既存の間違った制約を削除
ALTER TABLE public.test_question_answer_option_choices 
DROP CONSTRAINT IF EXISTS test_question_answer_option_choices_question_option_choices_id_;

ALTER TABLE public.test_question_answer_option_choices 
DROP CONSTRAINT IF EXISTS test_question_answer_option_choices_review_question_answers_id_;

-- 正しいテストテーブルを参照する制約を追加
ALTER TABLE public.test_question_answer_option_choices 
ADD CONSTRAINT test_question_answer_option_choices_question_option_choices_id_fkey 
FOREIGN KEY (question_option_choices_id) REFERENCES test_question_option_choices (id);

ALTER TABLE public.test_question_answer_option_choices 
ADD CONSTRAINT test_question_answer_option_choices_review_question_answers_id_fkey 
FOREIGN KEY (review_question_answers_id) REFERENCES test_review_question_answers (id);

-- 3. test_review_form_submissions テーブルの外部キー制約修正
-- 既存の間違った制約を削除
ALTER TABLE public.test_review_form_submissions 
DROP CONSTRAINT IF EXISTS test_review_form_submissions_review_forms_id_fkey;

ALTER TABLE public.test_review_form_submissions 
DROP CONSTRAINT IF EXISTS test_review_form_submissions_users_fkey;

-- 正しいテストテーブルを参照する制約を追加
ALTER TABLE public.test_review_form_submissions 
ADD CONSTRAINT test_review_form_submissions_review_forms_id_fkey 
FOREIGN KEY (review_forms_id) REFERENCES test_review_forms (id);

ALTER TABLE public.test_review_form_submissions 
ADD CONSTRAINT test_review_form_submissions_users_fkey 
FOREIGN KEY (users) REFERENCES test_users (id);

-- 確認用クエリ（実行後に動作確認）
-- SELECT table_name, constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name LIKE 'test_%' 
-- ORDER BY table_name, constraint_name;

-- 均等目盛用のサンプルデータ挿入（テスト用）
-- 以下は動作確認用のサンプルデータです。実際のデータがある場合は実行不要です。

/*
-- サンプル business user
INSERT INTO test_business_users (id, name, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'テストユーザー', 'test@example.com');

-- サンプル form
INSERT INTO test_review_forms (id, business_users, title) 
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'テストフォーム');

-- サンプル 均等目盛質問（質問タイプ7）
INSERT INTO test_review_questions (id, review_fome_id, question_text, question_types_id, question_number) 
VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '満足度を教えてください', 7, 1);

-- 均等目盛の設定（1-5スケール）
INSERT INTO test_question_option_linear_scale (id, review_questions_id, min_text, max_text) 
VALUES ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', '全く満足していない', 'とても満足している');

-- サンプルユーザー
INSERT INTO test_users (id, name, email) 
VALUES ('00000000-0000-0000-0000-000000000005', 'テスト回答者', 'answer@example.com');

-- サンプル回答提出
INSERT INTO test_review_form_submissions (id, review_forms_id, users) 
VALUES ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005');

-- サンプル質問回答
INSERT INTO test_review_question_answers (id, review_form_submissions_id, review_questions_id) 
VALUES ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003');

-- サンプル均等目盛回答（1-5の数値）
INSERT INTO test_question_answer_option_linear_scale (id, review_question_answers_id, answer_number) 
VALUES ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000007', 4);
*/