-- ========================================
-- AI系Edge Functionのcronジョブ追加
-- 毎月1日 日本時間 2:00 / 2:30 に実行
-- (update-monthly-analyticsが毎日1:05に走るため、その後に実行)
-- ========================================

-- ========================================
-- 1. generate-analytics-ai-text 呼び出し用ラッパー関数
-- ========================================
CREATE OR REPLACE FUNCTION call_generate_analytics_ai_text()
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
  SELECT value INTO supabase_url FROM app_settings WHERE key = 'supabase_url';
  SELECT value INTO service_key FROM app_settings WHERE key = 'service_role_key';

  SELECT net.http_post(
    url := supabase_url || '/functions/v1/generate-analytics-ai-text',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  RAISE NOTICE 'generate-analytics-ai-text request sent with id: %', request_id;
END;
$$;

-- ========================================
-- 2. generate-analytics-insights 呼び出し用ラッパー関数
-- ========================================
CREATE OR REPLACE FUNCTION call_generate_analytics_insights()
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
  SELECT value INTO supabase_url FROM app_settings WHERE key = 'supabase_url';
  SELECT value INTO service_key FROM app_settings WHERE key = 'service_role_key';

  SELECT net.http_post(
    url := supabase_url || '/functions/v1/generate-analytics-insights',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  RAISE NOTICE 'generate-analytics-insights request sent with id: %', request_id;
END;
$$;

-- ========================================
-- 3. Cronジョブ登録
-- 毎月1日 UTC 17:00 = 日本時間 2:00 にAIテキスト生成
-- 毎月1日 UTC 17:30 = 日本時間 2:30 にインサイト生成
-- ========================================

-- 既存ジョブ削除（存在する場合）
SELECT cron.unschedule('generate-analytics-ai-text')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-analytics-ai-text');

SELECT cron.unschedule('generate-analytics-insights')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-analytics-insights');

-- AIテキスト生成: 毎月1日 UTC 17:00 (JST 2:00)
SELECT cron.schedule(
  'generate-analytics-ai-text',
  '0 17 1 * *',
  'SELECT call_generate_analytics_ai_text()'
);

-- インサイト生成: 毎月1日 UTC 17:30 (JST 2:30)
SELECT cron.schedule(
  'generate-analytics-insights',
  '30 17 1 * *',
  'SELECT call_generate_analytics_insights()'
);

-- ========================================
-- 確認
-- ========================================
SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname IN ('update-monthly-analytics', 'generate-analytics-ai-text', 'generate-analytics-insights');
