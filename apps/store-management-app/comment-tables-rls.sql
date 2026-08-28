-- コメント関連テーブルのRLSポリシー設定
-- question_display_settings と review_question_answers

-- ===== question_display_settings テーブルのRLS =====

-- 1. RLSを有効化
ALTER TABLE public.question_display_settings ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを削除
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'question_display_settings'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.question_display_settings';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. 閲覧ポリシー：認証されたユーザーは全て閲覧可能（設定情報のため）
CREATE POLICY "authenticated_users_can_view_question_settings" 
ON public.question_display_settings
FOR SELECT
USING (auth.role() = 'authenticated');

-- 4. 書き込み制限（閲覧専用）
CREATE POLICY "deny_question_settings_write"
ON public.question_display_settings
FOR INSERT, UPDATE, DELETE
USING (false);

-- ===== review_question_answers テーブルのRLS =====

-- 1. RLSを有効化
ALTER TABLE public.review_question_answers ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを削除
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'review_question_answers'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.review_question_answers';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. 閲覧ポリシー：ユーザーがアクセス可能な店舗の回答のみ
CREATE POLICY "users_can_view_store_question_answers" 
ON public.review_question_answers
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  -- ユーザーがアクセス可能な店舗の回答のみ
  store_id IN (
    SELECT sm.store_id
    FROM store_memberships sm
    WHERE sm.business_user_id = auth.uid()
  )
);

-- 4. 書き込み制限（閲覧専用）
CREATE POLICY "deny_question_answers_write"
ON public.review_question_answers
FOR INSERT, UPDATE, DELETE
USING (false);

-- ===== コメント数取得用のビューまたは関数 =====

-- review_questions テーブルの質問タイプを確認するためのクエリ
-- （実際のテーブル構造に応じて調整が必要）
/*
-- review_questions テーブルの構造確認用
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'review_questions'
ORDER BY ordinal_position;
*/

-- コメント数取得用のビュー（質問タイプ1,2のもの）
-- 注意：review_questions テーブルに question_type または type_id フィールドがあることを前提
CREATE OR REPLACE VIEW comment_counts_by_date AS
SELECT 
  rqa.store_id,
  DATE(rqa.created_at) as answer_date,
  COUNT(rqa.id) as comment_count
FROM review_question_answers rqa
INNER JOIN question_display_settings qds ON rqa.review_questions_id = qds.review_question_id
INNER JOIN review_questions rq ON qds.review_question_id = rq.id
WHERE rq.question_type IN (1, 2)  -- 質問タイプ1,2のもの（フィールド名要確認）
-- または rq.type_id IN (1, 2) の可能性もあり
GROUP BY rqa.store_id, DATE(rqa.created_at);

-- ビューにもRLSを適用
ALTER VIEW comment_counts_by_date SET (security_barrier = true);

-- ===== テスト用クエリ =====

-- 1. テーブルアクセステスト
/*
-- question_display_settings アクセステスト
SELECT COUNT(*) FROM question_display_settings;

-- review_question_answers アクセステスト
SELECT COUNT(*) FROM review_question_answers;

-- review_questions テーブル構造確認
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'review_questions';
*/

-- 2. コメント数取得テスト
/*
-- 今日のコメント数
SELECT 
  store_id,
  comment_count
FROM comment_counts_by_date
WHERE answer_date = CURRENT_DATE;

-- 過去1週間のコメント数
SELECT 
  answer_date,
  SUM(comment_count) as total_comments
FROM comment_counts_by_date
WHERE answer_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY answer_date
ORDER BY answer_date DESC;
*/

-- 3. 詳細なコメント数クエリ（ビューが使えない場合）
/*
SELECT 
  rqa.store_id,
  DATE(rqa.created_at) as answer_date,
  COUNT(rqa.id) as comment_count
FROM review_question_answers rqa
INNER JOIN question_display_settings qds ON rqa.review_questions_id = qds.review_question_id
INNER JOIN review_questions rq ON qds.review_question_id = rq.id
WHERE DATE(rqa.created_at) = CURRENT_DATE
AND rq.question_type IN (1, 2)  -- 質問タイプフィールド名要確認
AND rqa.store_id IN (
  SELECT sm.store_id
  FROM store_memberships sm
  WHERE sm.business_user_id = auth.uid()
)
GROUP BY rqa.store_id, DATE(rqa.created_at);
*/

-- ===== RLS状態確認 =====

-- 設定されたRLSポリシーを確認
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('question_display_settings', 'review_question_answers')
ORDER BY tablename;

-- ポリシー詳細確認
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('question_display_settings', 'review_question_answers')
ORDER BY tablename, policyname;