-- ========================================
-- Step 2: Cronジョブ設定
-- テーブル作成後に実行してください
-- ========================================

-- ========================================
-- 1. pg_cron拡張を有効化
-- ========================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- cron.jobテーブルへのアクセス権限を付与
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ========================================
-- 2. 設定値を保存
-- YOUR_SERVICE_ROLE_KEY を実際のサービスロールキーに置き換えてください
-- ========================================
-- 注意: サービスロールキーは該当プロジェクト(dlienhbcqblpeuqgwhci)のものを使用してください
-- Dashboard → Settings → API → service_role で確認できます
INSERT INTO app_settings (key, value) VALUES
  ('supabase_url', 'https://dlienhbcqblpeuqgwhci.supabase.co'),
  ('service_role_key', 'YOUR_SERVICE_ROLE_KEY_HERE')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- ========================================
-- 3. Edge Function呼び出し用のラッパー関数
-- ========================================
CREATE OR REPLACE FUNCTION call_update_monthly_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
  request_id BIGINT;
BEGIN
  -- 設定を取得
  SELECT value INTO supabase_url FROM app_settings WHERE key = 'supabase_url';
  SELECT value INTO service_key FROM app_settings WHERE key = 'service_role_key';

  -- Edge Functionを呼び出し
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/update-monthly-analytics',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  RAISE NOTICE 'HTTP request sent with id: %', request_id;
END;
$$;

-- ========================================
-- 4. Cronジョブを登録
-- 毎日 UTC 16:05 = 日本時間 1:05 に実行
-- ========================================

-- 既存のジョブを削除（存在する場合）
SELECT cron.unschedule('update-monthly-analytics')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update-monthly-analytics');

-- 新しいジョブを登録
SELECT cron.schedule(
  'update-monthly-analytics',  -- ジョブ名
  '5 16 * * *',                -- Cron式: 毎日 UTC 16:05 (日本時間 1:05)
  'SELECT call_update_monthly_analytics()'
);

-- ========================================
-- 5. 確認
-- ========================================
SELECT
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  active
FROM cron.job
WHERE jobname = 'update-monthly-analytics';

-- ジョブ実行履歴を確認（初回は空）
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

SELECT 'Cronジョブ設定完了！毎日日本時間0:45に月次レポートが更新されます。' AS message;
