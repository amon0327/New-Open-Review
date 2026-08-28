-- question_answer_option_linear_scaleテーブルのRLSポリシーを作成
-- 店舗と紐付いているユーザーのみがアクセスできるようにする

-- RLSを有効化
ALTER TABLE question_answer_option_linear_scale ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーがあれば削除
DROP POLICY IF EXISTS "Users can only access their store's linear scale answers" ON question_answer_option_linear_scale;

-- 店舗メンバーシップに基づくアクセス制御ポリシーを作成
CREATE POLICY "Users can only access their store's linear scale answers" ON question_answer_option_linear_scale
FOR ALL USING (
  EXISTS (
    SELECT 1 
    FROM store_memberships sm
    INNER JOIN business_users bu ON bu.id = sm.business_user_id
    WHERE bu.id = auth.uid()
    AND sm.store_id = question_answer_option_linear_scale.store_id
  )
);

-- 参考用：テーブル構造の確認
/*
create table public.question_answer_option_linear_scale (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  review_question_answers_id uuid null,
  answer_number bigint null,
  store_id uuid null,
  constraint question_answer_option_linear_scale_pkey primary key (id),
  constraint question_answer_option_linear_s_review_question_answers_id_fkey foreign KEY (review_question_answers_id) references review_question_answers (id),
  constraint question_answer_option_linear_scale_store_id_fkey foreign KEY (store_id) references stores (id)
) TABLESPACE pg_default;
*/