-- ============================================================================
-- 抽選統計テーブルを削除し、抽選ログテーブルを作成
-- 集計ではなく、個別の抽選ログを記録する方式に変更
-- ============================================================================

-- 1. 既存の統計テーブルを削除
DROP TABLE IF EXISTS public.company_lottery_monthly_stats CASCADE;

-- 2. 抽選ログテーブルを作成（個別の回答ごとにログを記録）
CREATE TABLE IF NOT EXISTS public.company_lottery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- 企業情報
  company_id UUID NOT NULL,

  -- フォーム・回答情報
  review_form_id UUID NOT NULL,
  submission_id UUID NOT NULL,
  user_id UUID NOT NULL,

  -- 抽選情報
  is_winner BOOLEAN NOT NULL DEFAULT false,

  -- 抽選時の設定値（後から確認できるように記録）
  win_rate_divisor INTEGER NOT NULL,  -- 当選確率 1/N
  max_wins_per_month INTEGER NOT NULL, -- 月間上限

  -- 当選トークン（当選時のみ）
  winner_token UUID NULL,

  CONSTRAINT company_lottery_logs_pkey PRIMARY KEY (id),
  CONSTRAINT company_lottery_logs_company_id_fkey FOREIGN KEY (company_id)
    REFERENCES companies (id) ON DELETE CASCADE,
  CONSTRAINT company_lottery_logs_review_form_id_fkey FOREIGN KEY (review_form_id)
    REFERENCES review_forms (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_company_lottery_logs_company_id
  ON company_lottery_logs(company_id);

CREATE INDEX IF NOT EXISTS idx_company_lottery_logs_created_at
  ON company_lottery_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_company_lottery_logs_company_created
  ON company_lottery_logs(company_id, created_at);

CREATE INDEX IF NOT EXISTS idx_company_lottery_logs_review_form_id
  ON company_lottery_logs(review_form_id);

CREATE INDEX IF NOT EXISTS idx_company_lottery_logs_user_id
  ON company_lottery_logs(user_id);

-- ============================================================================
-- RLS設定
-- ============================================================================
ALTER TABLE company_lottery_logs ENABLE ROW LEVEL SECURITY;

-- SELECTポリシー（企業メンバーまたはパートナー経由でアクセス可能）
CREATE POLICY "company_lottery_logs_select" ON company_lottery_logs
FOR SELECT
USING (public.user_can_access_company(company_id));

-- INSERT/UPDATE/DELETEはサービスロールのみ（Edge Functionから更新）
CREATE POLICY "company_lottery_logs_service_role" ON company_lottery_logs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 集計用のビューを作成（月間統計を後から取得できるように）
-- ============================================================================
CREATE OR REPLACE VIEW public.company_lottery_monthly_summary AS
SELECT
  company_id,
  EXTRACT(YEAR FROM created_at)::INTEGER AS target_year,
  EXTRACT(MONTH FROM created_at)::INTEGER AS target_month,
  COUNT(*) AS total_attempts,
  COUNT(*) FILTER (WHERE is_winner = true) AS total_wins
FROM company_lottery_logs
GROUP BY company_id, EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at);

-- ビューへのアクセス権限
GRANT SELECT ON public.company_lottery_monthly_summary TO authenticated;

-- ============================================================================
-- コメント
-- ============================================================================
COMMENT ON TABLE company_lottery_logs IS '企業ごとの抽選ログ。回答ごとに1レコード作成。';
COMMENT ON COLUMN company_lottery_logs.win_rate_divisor IS '抽選時の当選確率設定（1/N）';
COMMENT ON COLUMN company_lottery_logs.max_wins_per_month IS '抽選時の月間上限設定';
COMMENT ON COLUMN company_lottery_logs.winner_token IS '当選時に生成されたトークン';

COMMENT ON VIEW company_lottery_monthly_summary IS '月間抽選統計を集計するビュー';
