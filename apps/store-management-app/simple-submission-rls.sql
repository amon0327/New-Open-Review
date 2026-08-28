-- review_form_submissions テーブル用のシンプルなRLSポリシー
-- RPC関数なし、直接クエリのみ

-- 1. RLSを有効化
ALTER TABLE public.review_form_submissions ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを削除
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'review_form_submissions'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.review_form_submissions';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. シンプルな閲覧ポリシー
CREATE POLICY "users_can_view_store_submissions" 
ON public.review_form_submissions
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
CREATE POLICY "deny_submissions_write"
ON public.review_form_submissions
FOR INSERT, UPDATE, DELETE
USING (false);

-- 5. ポリシーの確認
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'review_form_submissions';

-- 6. RLS状態確認
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'review_form_submissions';

-- 7. テスト用クエリ
/*
-- 基本アクセステスト
SELECT COUNT(*) FROM review_form_submissions;

-- 今日の回答数
SELECT COUNT(*) 
FROM review_form_submissions 
WHERE DATE(created_at) = CURRENT_DATE;

-- 日付範囲での回答数
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count
FROM review_form_submissions
WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
*/