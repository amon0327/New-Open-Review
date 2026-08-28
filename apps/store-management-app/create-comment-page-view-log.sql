-- comment_page_view_log テーブル作成とRLSポリシー設定
-- コメント未読数機能に必要なテーブル

-- ===== comment_page_view_log テーブル作成 =====

-- 既存テーブルがある場合の確認
SELECT 
  table_name,
  table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'comment_page_view_log';

-- テーブル作成（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS public.comment_page_view_log (
  id SERIAL PRIMARY KEY,
  business_user_id UUID NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- 外部キー制約
  CONSTRAINT fk_comment_page_view_log_business_user
    FOREIGN KEY (business_user_id) 
    REFERENCES public.business_users(id) 
    ON DELETE CASCADE,
    
  -- ユニーク制約（1ユーザーにつき1レコード）
  CONSTRAINT unique_business_user_comment_view 
    UNIQUE (business_user_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_comment_page_view_log_business_user_id 
ON public.comment_page_view_log(business_user_id);

CREATE INDEX IF NOT EXISTS idx_comment_page_view_log_last_login_at 
ON public.comment_page_view_log(last_login_at);

-- updated_at自動更新のトリガー関数（存在しない場合のみ）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at自動更新トリガー
DROP TRIGGER IF EXISTS update_comment_page_view_log_updated_at ON public.comment_page_view_log;
CREATE TRIGGER update_comment_page_view_log_updated_at
    BEFORE UPDATE ON public.comment_page_view_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===== RLSポリシー設定 =====

-- 1. RLSを有効化
ALTER TABLE public.comment_page_view_log ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを削除
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'comment_page_view_log'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.comment_page_view_log';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. 閲覧ポリシー：自分のレコードのみ閲覧可能
CREATE POLICY "users_can_view_own_comment_page_view_log" 
ON public.comment_page_view_log
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  business_user_id = auth.uid()
);

-- 4. 挿入ポリシー：自分のレコードのみ挿入可能
CREATE POLICY "users_can_insert_own_comment_page_view_log" 
ON public.comment_page_view_log
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND
  business_user_id = auth.uid()
);

-- 5. 更新ポリシー：自分のレコードのみ更新可能
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

-- 6. 削除ポリシー：自分のレコードのみ削除可能
CREATE POLICY "users_can_delete_own_comment_page_view_log" 
ON public.comment_page_view_log
FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND
  business_user_id = auth.uid()
);

-- ===== テスト用クエリ =====

-- テーブル作成確認
SELECT 
  table_name,
  table_schema,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'comment_page_view_log';

-- カラム構造確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'comment_page_view_log'
ORDER BY ordinal_position;

-- RLS状態確認
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'comment_page_view_log';

-- ポリシー確認
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

-- ===== 使用例とテストクエリ =====

/*
-- テストデータ挿入例（認証されたユーザーのみ）
INSERT INTO public.comment_page_view_log (business_user_id, last_login_at)
VALUES (auth.uid(), NOW())
ON CONFLICT (business_user_id) 
DO UPDATE SET 
  last_login_at = EXCLUDED.last_login_at,
  updated_at = NOW();

-- 自分のレコード取得例
SELECT 
  id,
  business_user_id,
  last_login_at,
  created_at,
  updated_at
FROM public.comment_page_view_log
WHERE business_user_id = auth.uid();

-- 最終ログイン時刻のみ取得例（useUnreadCommentCount.jsで使用）
SELECT last_login_at
FROM public.comment_page_view_log
WHERE business_user_id = auth.uid()
LIMIT 1;
*/

-- ===== 注意事項 =====
/*
このテーブルは以下の目的で使用されます：

1. ユーザーのコメントページ最終アクセス時刻を記録
2. 未読コメント数の計算基準時刻として使用
3. ユーザーごとに1レコードのみ維持（UPSERT方式）

RLSポリシー：
- business_user_id = auth.uid() で自分のデータのみアクセス可能
- 認証されたユーザーのみ操作可能
- すべてのCRUD操作に対応

useUnreadCommentCount.jsでの使用：
- last_login_atを取得して未読コメントの判定基準とする
- recordCommentPageView()でアクセス時刻を更新
- getLastViewTime()で最終アクセス時刻を取得
*/