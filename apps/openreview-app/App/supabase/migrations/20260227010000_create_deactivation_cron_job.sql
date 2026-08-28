-- 15分ごとにスケジュール済み非アクティブ化を処理するcronジョブ
-- ※ Supabase Dashboard の SQL Editor で実行してください（pg_cron拡張が必要）

SELECT cron.schedule(
  'process-scheduled-deactivations',
  '0 15 * * *',  -- 毎日 JST 0:00 (UTC 15:00)
  $$
    UPDATE companies
    SET is_active = false,
        deactivation_scheduled_at = NULL
    WHERE deactivation_scheduled_at IS NOT NULL
      AND deactivation_scheduled_at <= NOW()
      AND is_active = true;
  $$
);
