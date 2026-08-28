-- アラート詳細機能に必要なRLS（Row Level Security）設定
-- 店舗と紐付いたユーザーが閲覧可能になるように設定

-- 1. review_forms テーブルのRLS設定
-- フォームは business_users を通じて店舗に紐付いているため、
-- 現在のユーザーのstore_idと関連付けられたフォームのみアクセス可能

-- RLSを有効化
ALTER TABLE review_forms ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーがあれば削除
DROP POLICY IF EXISTS "review_forms_select_policy" ON review_forms;

-- SELECT用のポリシーを作成
CREATE POLICY "review_forms_select_policy" ON review_forms
FOR SELECT USING (
  business_users IN (
    SELECT business_users.id 
    FROM business_users 
    INNER JOIN user_store_memberships ON business_users.id = user_store_memberships.business_users_id
    WHERE user_store_memberships.store_id = (auth.jwt() ->> 'store_id')::uuid
  )
);

-- 2. review_questions テーブルのRLS設定
-- 質問は review_forms を通じて店舗に紐付いているため、
-- 現在のユーザーのstore_idと関連付けられた質問のみアクセス可能

-- RLSを有効化
ALTER TABLE review_questions ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーがあれば削除
DROP POLICY IF EXISTS "review_questions_select_policy" ON review_questions;

-- SELECT用のポリシーを作成
CREATE POLICY "review_questions_select_policy" ON review_questions
FOR SELECT USING (
  review_fome_id IN (
    SELECT review_forms.id 
    FROM review_forms 
    WHERE review_forms.business_users IN (
      SELECT business_users.id 
      FROM business_users 
      INNER JOIN user_store_memberships ON business_users.id = user_store_memberships.business_users_id
      WHERE user_store_memberships.store_id = (auth.jwt() ->> 'store_id')::uuid
    )
  )
);

-- 3. question_answer_option_choices テーブルのRLS設定
-- 選択肢回答は store_id で直接関連付けられているため、
-- 現在のユーザーのstore_idと一致するもののみアクセス可能

-- RLSを有効化
ALTER TABLE question_answer_option_choices ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーがあれば削除
DROP POLICY IF EXISTS "question_answer_option_choices_select_policy" ON question_answer_option_choices;

-- SELECT用のポリシーを作成
CREATE POLICY "question_answer_option_choices_select_policy" ON question_answer_option_choices
FOR SELECT USING (
  store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- 4. question_option_choices テーブルのRLS設定（参照テーブル）
-- 選択肢マスターテーブルについても設定が必要な場合があります

-- RLSを有効化（テーブルが存在する場合）
-- ALTER TABLE question_option_choices ENABLE ROW LEVEL SECURITY;

-- 選択肢マスターは通常全ユーザーがアクセス可能ですが、
-- 必要に応じて制限を設ける場合の例：
-- CREATE POLICY "question_option_choices_select_policy" ON question_option_choices
-- FOR SELECT USING (true); -- 全ユーザーがアクセス可能

-- ===== 補完的なRLS設定 =====

-- 5. review_form_submissions テーブルのRLS確認・強化
-- アラート詳細で使用されるため、適切なRLSが設定されているか確認

-- 既存のポリシーを確認し、必要に応じて更新
DROP POLICY IF EXISTS "review_form_submissions_select_policy" ON review_form_submissions;

CREATE POLICY "review_form_submissions_select_policy" ON review_form_submissions
FOR SELECT USING (
  store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- 6. question_answer_texts テーブルのRLS確認・強化
-- テキスト回答についても同様に確認

DROP POLICY IF EXISTS "question_answer_texts_select_policy" ON question_answer_texts;

CREATE POLICY "question_answer_texts_select_policy" ON question_answer_texts
FOR SELECT USING (
  store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- 7. question_answer_option_linear_scale テーブルのRLS確認・強化
-- NPS回答についても同様に確認

DROP POLICY IF EXISTS "question_answer_option_linear_scale_select_policy" ON question_answer_option_linear_scale;

CREATE POLICY "question_answer_option_linear_scale_select_policy" ON question_answer_option_linear_scale
FOR SELECT USING (
  store_id = (auth.jwt() ->> 'store_id')::uuid
);

-- ===== 確認用クエリ =====

-- RLS設定の確認
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename IN ('review_forms', 'review_questions', 'question_answer_option_choices', 'review_form_submissions', 'question_answer_texts', 'question_answer_option_linear_scale');

-- ポリシーの確認
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('review_forms', 'review_questions', 'question_answer_option_choices', 'review_form_submissions', 'question_answer_texts', 'question_answer_option_linear_scale');

-- ===== 注意事項 =====

-- 1. JWT内のstore_idが正しく設定されていることを確認してください
-- 2. user_store_memberships テーブルが適切に設定されていることを確認してください  
-- 3. business_users と stores の関連付けが適切であることを確認してください
-- 4. 本番環境に適用する前に、開発環境で十分にテストしてください
-- 5. 必要に応じて INSERT, UPDATE, DELETE のポリシーも追加してください