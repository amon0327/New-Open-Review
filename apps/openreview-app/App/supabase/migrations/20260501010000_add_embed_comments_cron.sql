-- ========================================
-- embed-comments cron ジョブ追加
-- ----------------------------------------
-- 構想 #9: 顧客コメントを埋め込みベクトル化し、
-- 月次インサイト生成 (毎月1日 JST 0:05) で
-- 類似コメントクラスタリングに使えるよう、
-- 月内ずっと低頻度で増分埋め込みを走らせる。
-- 毎月1日のインサイト生成直前にも仕上げの一発を入れる。
-- ========================================

-- ========================================
-- 1. embed-comments 呼び出し用ラッパー関数
-- ========================================
CREATE OR REPLACE FUNCTION call_embed_comments(payload jsonb DEFAULT '{}'::jsonb)
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
    url := supabase_url || '/functions/v1/embed-comments',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    ),
    body := payload
  ) INTO request_id;

  RAISE NOTICE 'embed-comments request sent with id: %', request_id;
END;
$$;

-- ========================================
-- 2. 既存ジョブ削除
-- ========================================
SELECT cron.unschedule('embed-comments-hourly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'embed-comments-hourly');

SELECT cron.unschedule('embed-comments-monthly-final')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'embed-comments-monthly-final');

-- ========================================
-- 3. 定常実行: 毎時 5 分に増分埋め込み
-- ========================================
SELECT cron.schedule(
  'embed-comments-hourly',
  '5 * * * *',
  'SELECT call_embed_comments(''{}''::jsonb)'
);

-- ========================================
-- 4. 月初仕上げ: 毎月1日 UTC 15:03 (JST 0:03) に
--    先月分を念入りに埋め込み (insights 0:05 の直前)
-- ========================================
SELECT cron.schedule(
  'embed-comments-monthly-final',
  '3 15 1 * *',
  $$
  SELECT call_embed_comments(jsonb_build_object(
    'year_month', to_char(date_trunc('month', (now() AT TIME ZONE 'Asia/Tokyo')) - interval '1 month', 'YYYY-MM'),
    'max_batches', 100
  ))
  $$
);

-- 確認
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('embed-comments-hourly', 'embed-comments-monthly-final');
