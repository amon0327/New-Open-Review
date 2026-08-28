-- RPC関数の存在確認とデバッグ

-- 1. 現在存在する関数を確認
SELECT 
  routine_name,
  routine_type,
  routine_schema,
  specific_name,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%submission%'
ORDER BY routine_name;

-- 2. 関数の詳細情報を確認
SELECT 
  p.proname as function_name,
  p.pronargs as num_args,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%submission%';

-- 3. 全ての public スキーマの関数を確認
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 4. 関数作成時のエラーを避けるため、まず削除してから再作成

-- 既存の関数を削除（存在しない場合はエラーを無視）
DROP FUNCTION IF EXISTS public.get_daily_submission_count(date, uuid);
DROP FUNCTION IF EXISTS public.get_submission_count_by_date_range(date, date, uuid);
DROP FUNCTION IF EXISTS public.get_today_submission_count(uuid);

-- 5. シンプルな関数から作成（エラーを避けるため最小限）

-- 基本的な日付別回答数取得関数
CREATE OR REPLACE FUNCTION public.get_daily_submission_count(
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
  -- review_form_submissionsテーブルが存在するかチェック
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'review_form_submissions'
  ) THEN
    RAISE NOTICE 'Table review_form_submissions does not exist';
    RETURN 0;
  END IF;

  -- 権限チェック：認証されたユーザーのみ
  IF auth.uid() IS NULL THEN
    RAISE NOTICE 'User not authenticated';
    RETURN 0;
  END IF;

  -- 回答数を取得
  SELECT COUNT(*)
  FROM review_form_submissions rfs
  WHERE DATE(rfs.created_at) = target_date
  AND (target_store_id IS NULL OR rfs.store_id = target_store_id)
  INTO submission_count;
  
  RETURN COALESCE(submission_count, 0);
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in get_daily_submission_count: %', SQLERRM;
    RETURN 0;
END;
$$;

-- 6. より安全な店舗権限チェック付きバージョン
CREATE OR REPLACE FUNCTION public.get_daily_submission_count_with_permission(
  target_date date DEFAULT CURRENT_DATE,
  target_store_id uuid DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  submission_count bigint;
  user_id uuid;
BEGIN
  -- 認証チェック
  user_id := auth.uid();
  IF user_id IS NULL THEN
    RETURN 0;
  END IF;

  -- 回答数を取得（権限チェック付き）
  SELECT COUNT(*)
  FROM review_form_submissions rfs
  WHERE DATE(rfs.created_at) = target_date
  AND (target_store_id IS NULL OR rfs.store_id = target_store_id)
  AND EXISTS (
    SELECT 1 
    FROM store_memberships sm
    WHERE sm.business_user_id = user_id
    AND sm.store_id = rfs.store_id
  )
  INTO submission_count;
  
  RETURN COALESCE(submission_count, 0);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;

-- 7. テスト用のシンプルな関数
CREATE OR REPLACE FUNCTION public.test_submission_function()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'Function is working: ' || CURRENT_TIMESTAMP;
END;
$$;

-- 8. 関数の作成確認
SELECT 
  'Function created: ' || routine_name as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_daily_submission_count',
  'get_daily_submission_count_with_permission',
  'test_submission_function'
);

-- 9. 権限設定
GRANT EXECUTE ON FUNCTION public.get_daily_submission_count(date, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_submission_count_with_permission(date, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_submission_function() TO authenticated;