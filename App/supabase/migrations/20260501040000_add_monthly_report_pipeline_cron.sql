-- ========================================
-- monthly-report-pipeline cron 設定
-- ----------------------------------------
-- 既存の generate-analytics-ai-text / generate-analytics-insights の cron を
-- 解除し、1 本のオーケストレーター呼び出しに統合する。
--
-- update-monthly-analytics (per-response 集計の最終確定) はそのまま残す。
--
-- 新フロー (毎月 2 日 UTC 20:00 = JST 月初 2 日 5:00):
--   monthly-report-pipeline → 内部で classify → aggregate →
--   generate-analytics-ai-text → generate-analytics-insights を直列実行。
--
-- 月初 1 日ではなく 2 日にするのは、月末ギリギリ投稿の取りこぼしと
-- update-monthly-analytics の完走を待つため。
-- ========================================

-- ========================================
-- 1. monthly-report-pipeline 呼び出し用ラッパー
-- ========================================
CREATE OR REPLACE FUNCTION call_monthly_report_pipeline(payload jsonb DEFAULT '{}'::jsonb)
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
    url := supabase_url || '/functions/v1/monthly-report-pipeline',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    ),
    body := payload
  ) INTO request_id;

  RAISE NOTICE 'monthly-report-pipeline request sent with id: %', request_id;
END;
$$;

-- ========================================
-- 2. 既存ジョブ削除 (新パイプラインに統合)
-- ========================================
SELECT cron.unschedule('generate-analytics-ai-text')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-analytics-ai-text');

SELECT cron.unschedule('generate-analytics-insights')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-analytics-insights');

SELECT cron.unschedule('monthly-report-pipeline')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly-report-pipeline');

-- ========================================
-- 3. 新ジョブ登録
--    UTC 20:00 月 2 日 = JST 月 2 日 5:00
-- ========================================
SELECT cron.schedule(
  'monthly-report-pipeline',
  '0 20 2 * *',
  $$
  SELECT call_monthly_report_pipeline(jsonb_build_object(
    'triggered_by', 'cron'
  ))
  $$
);

-- 確認
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('update-monthly-analytics', 'embed-comments-hourly',
                  'embed-comments-monthly-final', 'monthly-report-pipeline');
