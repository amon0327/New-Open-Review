-- 外部キー制約の修正SQL
-- テストテーブル間の正しい参照関係を設定

-- 問題のある外部キー制約を削除
ALTER TABLE public.test_review_form_submissions 
DROP CONSTRAINT IF EXISTS test_review_form_submissions_review_forms_id_fkey;

ALTER TABLE public.test_review_form_submissions 
DROP CONSTRAINT IF EXISTS test_review_form_submissions_users_fkey;

ALTER TABLE public.test_question_answer_option_choices 
DROP CONSTRAINT IF EXISTS test_question_answer_option_choices_question_option_choices_id_;

ALTER TABLE public.test_question_answer_option_choices 
DROP CONSTRAINT IF EXISTS test_question_answer_option_choices_review_question_answers_id_;

ALTER TABLE public.test_question_answer_option_linear_scale 
DROP CONSTRAINT IF EXISTS test_question_answer_option_linear_scale_review_question_answer;

-- 正しい外部キー制約を追加
ALTER TABLE public.test_review_form_submissions 
ADD CONSTRAINT test_review_form_submissions_review_forms_id_fkey 
FOREIGN KEY (review_forms_id) REFERENCES test_review_forms (id);

ALTER TABLE public.test_review_form_submissions 
ADD CONSTRAINT test_review_form_submissions_users_fkey 
FOREIGN KEY (users) REFERENCES test_users (id);

ALTER TABLE public.test_question_answer_option_choices 
ADD CONSTRAINT test_question_answer_option_choices_question_option_choices_id_fkey 
FOREIGN KEY (question_option_choices_id) REFERENCES test_question_option_choices (id);

ALTER TABLE public.test_question_answer_option_choices 
ADD CONSTRAINT test_question_answer_option_choices_review_question_answers_id_fkey 
FOREIGN KEY (review_question_answers_id) REFERENCES test_review_question_answers (id);

ALTER TABLE public.test_question_answer_option_linear_scale 
ADD CONSTRAINT test_question_answer_option_linear_scale_review_question_answers_id_fkey 
FOREIGN KEY (review_question_answers_id) REFERENCES test_review_question_answers (id);

-- コメント追加
COMMENT ON TABLE public.test_review_form_submissions IS 'テスト環境用のフォーム提出記録';
COMMENT ON TABLE public.test_review_question_answers IS 'テスト環境用の質問回答記録';
COMMENT ON TABLE public.test_question_answer_texts IS 'テスト環境用のテキスト回答';
COMMENT ON TABLE public.test_question_answer_option_choices IS 'テスト環境用の選択肢回答';
COMMENT ON TABLE public.test_question_answer_option_linear_scale IS 'テスト環境用のスケール回答';