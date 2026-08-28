-- ========================================
-- pg_cron + pg_net によるスケジュール実行設定
-- 日本時間0時45分 = UTC 15:45
-- ========================================

-- pg_net拡張を有効化（HTTP呼び出し用）
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- pg_cron拡張を有効化
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Edge FunctionのURLとサービスロールキーを保存する設定テーブル
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- サービスロールのみアクセス可能
CREATE POLICY "Service role only" ON app_settings
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- 注意: 以下のSQLはSupabaseダッシュボードのSQL Editorで実行してください
-- 環境変数の値を適切に置き換えてください
-- ========================================

/*
-- 1. app_settingsにURL等を保存
INSERT INTO app_settings (key, value) VALUES
  ('supabase_url', 'https://YOUR_PROJECT_REF.supabase.co'),
  ('service_role_key', 'YOUR_SERVICE_ROLE_KEY')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- 2. cronジョブを登録（毎日UTC 15:45 = 日本時間0:45）
SELECT cron.schedule(
  'update-monthly-analytics',
  '45 15 * * *',
  $$
  SELECT extensions.http_post(
    'https://YOUR_PROJECT_REF.supabase.co/functions/v1/update-monthly-analytics',
    '{}',
    'application/json',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY')
    ]
  );
  $$
);

-- 3. ジョブ一覧を確認
SELECT * FROM cron.job;

-- 4. ジョブ実行履歴を確認
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
*/

-- ========================================
-- 代替方法: pg_netを使用したHTTP呼び出し
-- ========================================

-- Edge Function呼び出し用のラッパー関数
CREATE OR REPLACE FUNCTION call_update_monthly_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- 設定を取得
  SELECT value INTO supabase_url FROM app_settings WHERE key = 'supabase_url';
  SELECT value INTO service_key FROM app_settings WHERE key = 'service_role_key';

  -- Edge Functionを呼び出し
  PERFORM extensions.http_post(
    supabase_url || '/functions/v1/update-monthly-analytics',
    '{}',
    'application/json',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || service_key)
    ]
  );
END;
$$;

-- コメント
COMMENT ON FUNCTION call_update_monthly_analytics() IS '月次分析更新Edge Functionを呼び出すラッパー関数';
