-- 新しいテーブル構造に合わせたRLSポリシー更新

-- RLSを有効化
ALTER TABLE public.comment_page_view_log ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "users_can_view_own_comment_page_view_log" ON public.comment_page_view_log;
DROP POLICY IF EXISTS "users_can_insert_own_comment_page_view_log" ON public.comment_page_view_log;
DROP POLICY IF EXISTS "users_can_update_own_comment_page_view_log" ON public.comment_page_view_log;
DROP POLICY IF EXISTS "users_can_delete_own_comment_page_view_log" ON public.comment_page_view_log;

-- 新しいポリシーを作成

-- 1. 閲覧ポリシー：自分のレコードのみ閲覧可能
CREATE POLICY "users_can_view_own_comment_page_view_log" 
ON public.comment_page_view_log
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  business_user_id = auth.uid()
);

-- 2. 挿入ポリシー：自分のレコードのみ挿入可能
CREATE POLICY "users_can_insert_own_comment_page_view_log" 
ON public.comment_page_view_log
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND
  business_user_id = auth.uid()
);

-- 3. 更新ポリシー：自分のレコードのみ更新可能
CREATE POLICY "users_can_update_own_comment_page_view_log" 
ON public.comment_page_view_log
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND
  business_user_id = auth.uid()
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND
  business_user_id = auth.uid()
);

-- 4. 削除ポリシー：自分のレコードのみ削除可能
CREATE POLICY "users_can_delete_own_comment_page_view_log" 
ON public.comment_page_view_log
FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND
  business_user_id = auth.uid()
);

-- インデックス作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_comment_page_view_log_business_user_id 
ON public.comment_page_view_log(business_user_id);

CREATE INDEX IF NOT EXISTS idx_comment_page_view_log_accessed_at 
ON public.comment_page_view_log(accessed_at);

CREATE INDEX IF NOT EXISTS idx_comment_page_view_log_left_at 
ON public.comment_page_view_log(left_at);

-- テスト用クエリ
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'comment_page_view_log'
ORDER BY policyname;