-- ========================================
-- 月次レポート生成 cron を5段階に分割
-- ----------------------------------------
-- 旧: monthly-report-pipeline 1本で classify → aggregate → ai_text → insights を
--     直列 await → Edge Function の 150秒アイドルタイムアウトで途中終了
--
-- 新: 5つの cron に分割
--   ① 24:00 update-monthly-analytics   (summary 集計、~5秒)
--   ② 24:02 classify-comment-sentiment  (~1〜3分)
--   ③ 24:07 aggregate-comment-sentiment (~30秒)
--   ④ 24:08 generate-analytics-ai-text  (~2分)
--   ⑤ 24:12 generate-analytics-insights (async 起動)
--
-- 各 cron は独立の 150秒バジェット → 全段完走。
-- ========================================

-- 共通ヘルパー: JST 月初日1日なら指定 Edge Function を叩く
CREATE OR REPLACE FUNCTION fire_edge_function_if_eom(
  function_path TEXT,
  payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  jst_now timestamp;
  supabase_url TEXT;
  service_key TEXT;
  request_id BIGINT;
BEGIN
  jst_now := now() AT TIME ZONE 'Asia/Tokyo';
  IF EXTRACT(DAY FROM jst_now) <> 1 THEN
    RAISE NOTICE '[%] skipped (not month-start). jst=%', function_path, jst_now;
    RETURN;
  END IF;

  SELECT value INTO supabase_url FROM app_settings WHERE key = 'supabase_url';
  SELECT value INTO service_key FROM app_settings WHERE key = 'service_role_key';

  SELECT net.http_post(
    url := supabase_url || '/functions/v1/' || function_path,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    ),
    body := payload
  ) INTO request_id;
  RAISE NOTICE '[%] request sent (id: %)', function_path, request_id;
END;
$$;

-- 旧 pipeline cron を解除
SELECT cron.unschedule('monthly-report-pipeline')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly-report-pipeline');

-- 新5段 cron 登録（毎日 UTC 発射、wrapper 内で JST 月初日1日のみ実行）
SELECT cron.schedule(
  'eom-01-update-analytics',
  '0 15 * * *',
  $$SELECT fire_edge_function_if_eom('update-monthly-analytics')$$
);

SELECT cron.schedule(
  'eom-02-classify-sentiment',
  '2 15 * * *',
  $$SELECT fire_edge_function_if_eom('classify-comment-sentiment')$$
);

SELECT cron.schedule(
  'eom-03-aggregate-sentiment',
  '7 15 * * *',
  $$SELECT fire_edge_function_if_eom('aggregate-comment-sentiment')$$
);

SELECT cron.schedule(
  'eom-04-ai-text',
  '8 15 * * *',
  $$SELECT fire_edge_function_if_eom('generate-analytics-ai-text')$$
);

SELECT cron.schedule(
  'eom-05-insights',
  '12 15 * * *',
  $$SELECT fire_edge_function_if_eom('generate-analytics-insights')$$
);

-- 確認
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname LIKE 'eom-%'
ORDER BY jobname;
