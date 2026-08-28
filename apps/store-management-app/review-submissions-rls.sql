-- review_form_submissions テーブル用のRLSポリシー
-- ユーザーがアクセス可能な店舗の回答のみ閲覧可能

-- 1. RLSを有効化
ALTER TABLE public.review_form_submissions ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを削除（もしあれば）
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

-- 3. 閲覧ポリシー：ユーザーがアクセス可能な店舗の回答のみ
CREATE POLICY "users_can_view_accessible_store_submissions" 
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

-- 5. 日付別回答数取得関数
CREATE OR REPLACE FUNCTION get_daily_submission_count(
  target_date date DEFAULT CURRENT_DATE,
  target_store_id uuid DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  submission_count bigint;
BEGIN
  -- 指定された日付の回答数を取得
  SELECT COUNT(*)
  FROM review_form_submissions rfs
  WHERE DATE(rfs.created_at) = target_date
  AND (target_store_id IS NULL OR rfs.store_id = target_store_id)
  AND rfs.store_id IN (
    SELECT sm.store_id
    FROM store_memberships sm
    WHERE sm.business_user_id = auth.uid()
  )
  INTO submission_count;
  
  RETURN COALESCE(submission_count, 0);
END;
$$;

-- 6. 店舗別・日付範囲の回答数取得関数
CREATE OR REPLACE FUNCTION get_submission_count_by_date_range(
  start_date date,
  end_date date,
  target_store_id uuid DEFAULT NULL
)
RETURNS TABLE(
  submission_date date,
  submission_count bigint,
  store_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(rfs.created_at) as submission_date,
    COUNT(*) as submission_count,
    rfs.store_id
  FROM review_form_submissions rfs
  WHERE DATE(rfs.created_at) BETWEEN start_date AND end_date
  AND (target_store_id IS NULL OR rfs.store_id = target_store_id)
  AND rfs.store_id IN (
    SELECT sm.store_id
    FROM store_memberships sm
    WHERE sm.business_user_id = auth.uid()
  )
  GROUP BY DATE(rfs.created_at), rfs.store_id
  ORDER BY submission_date DESC;
END;
$$;

-- 7. 現在の店舗の今日の回答数取得（簡易版）
CREATE OR REPLACE FUNCTION get_today_submission_count(target_store_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM review_form_submissions rfs
    WHERE DATE(rfs.created_at) = CURRENT_DATE
    AND rfs.store_id = target_store_id
    AND rfs.store_id IN (
      SELECT sm.store_id
      FROM store_memberships sm
      WHERE sm.business_user_id = auth.uid()
    )
  );
END;
$$;

-- 8. テスト用クエリ
/*
-- 今日の回答数を確認
SELECT get_daily_submission_count();

-- 特定の店舗の今日の回答数
SELECT get_today_submission_count('店舗のUUID');

-- 過去1週間の回答数推移
SELECT * FROM get_submission_count_by_date_range(
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE
);

-- 直接テーブルアクセス（RLS適用）
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count
FROM review_form_submissions
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY DATE(created_at);
*/

-- 9. RLS状態確認
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'review_form_submissions';

-- 10. ポリシー確認
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'review_form_submissions';