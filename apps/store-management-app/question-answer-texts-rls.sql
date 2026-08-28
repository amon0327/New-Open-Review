-- question_answer_texts テーブルのRLSポリシー設定
-- ユーザーに紐付いた店舗のデータのみ閲覧可能

-- ===== question_answer_texts テーブルのRLS =====

-- 1. RLSを有効化
ALTER TABLE public.question_answer_texts ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを削除
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'question_answer_texts'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.question_answer_texts';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. 閲覧ポリシー：ユーザーがアクセス可能な店舗のデータのみ
CREATE POLICY "users_can_view_own_store_answer_texts" 
ON public.question_answer_texts
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  -- ユーザーがアクセス可能な店舗のデータのみ
  store_id IN (
    SELECT sm.store_id
    FROM store_memberships sm
    WHERE sm.business_user_id = auth.uid()
  )
);

-- 4. 書き込み制限（閲覧専用）
CREATE POLICY "deny_answer_texts_write"
ON public.question_answer_texts
FOR INSERT, UPDATE, DELETE
USING (false);

-- ===== RLS状態確認 =====

-- 設定されたRLSポリシーを確認
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'question_answer_texts';

-- ポリシー詳細確認
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'question_answer_texts'
ORDER BY policyname;

-- ===== テスト用クエリ =====

-- 1. アクセステスト
/*
-- question_answer_texts アクセステスト
SELECT COUNT(*) FROM question_answer_texts;

-- サンプルデータ確認
SELECT 
  id,
  created_at,
  review_questions_answers_id,
  LEFT(answer_text, 50) as answer_preview,
  store_id
FROM question_answer_texts
LIMIT 5;
*/

-- 2. 店舗フィルタテスト
/*
-- 現在のユーザーがアクセス可能な店舗を確認
SELECT sm.store_id, s.name as store_name
FROM store_memberships sm
JOIN stores s ON sm.store_id = s.id
WHERE sm.business_user_id = auth.uid();

-- 今日の回答テキストを確認
SELECT 
  qat.id,
  qat.answer_text,
  qat.store_id,
  qat.created_at
FROM question_answer_texts qat
WHERE DATE(qat.created_at) = CURRENT_DATE
ORDER BY qat.created_at DESC
LIMIT 10;
*/

-- 3. review_question_answers との関連確認
/*
-- question_answer_texts と review_question_answers の関連を確認
SELECT 
  qat.id as answer_text_id,
  qat.answer_text,
  rqa.id as question_answer_id,
  rqa.review_questions_id,
  qat.store_id
FROM question_answer_texts qat
JOIN review_question_answers rqa ON qat.review_questions_answers_id = rqa.id
WHERE DATE(qat.created_at) = CURRENT_DATE
LIMIT 5;
*/

-- ===== 注意事項 =====
/*
このRLSポリシーにより：

1. 認証されたユーザーのみアクセス可能
2. ユーザーが store_memberships で紐付いている店舗のデータのみ閲覧可能
3. 書き込み操作は全て禁止（閲覧専用）
4. question_answer_texts は review_question_answers の詳細テキストを格納するテーブル

使用例：
- コメント表示でより詳細なテキストが必要な場合
- review_question_answers.id を review_questions_answers_id で関連付け
- 同じ店舗フィルタリングロジックを適用
*/