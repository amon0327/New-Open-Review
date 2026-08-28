-- ============================================================================
-- 企業ごとの抽選設定テーブルを作成
-- レビューフォームごとではなく、企業共通の抽選設定を管理
-- ============================================================================

-- 企業抽選設定テーブル
CREATE TABLE IF NOT EXISTS public.company_lottery_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  company_id UUID NOT NULL,
  -- 当選確率（1/N の N値、例: 1000なら1/1000の確率）
  win_rate_divisor INTEGER NOT NULL DEFAULT 1000,
  -- 月間当選上限
  max_wins_per_month INTEGER NOT NULL DEFAULT 1,
  -- 抽選機能の有効/無効
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT company_lottery_settings_pkey PRIMARY KEY (id),
  CONSTRAINT company_lottery_settings_company_id_fkey FOREIGN KEY (company_id)
    REFERENCES companies (id) ON DELETE CASCADE,
  CONSTRAINT company_lottery_settings_company_id_unique UNIQUE (company_id),
  CONSTRAINT company_lottery_settings_win_rate_divisor_positive CHECK (win_rate_divisor > 0),
  CONSTRAINT company_lottery_settings_max_wins_positive CHECK (max_wins_per_month >= 0)
) TABLESPACE pg_default;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_company_lottery_settings_company_id
  ON company_lottery_settings(company_id);

-- updated_atトリガー
CREATE OR REPLACE FUNCTION update_company_lottery_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_lottery_settings_updated_at
BEFORE UPDATE ON company_lottery_settings
FOR EACH ROW
EXECUTE FUNCTION update_company_lottery_settings_updated_at();

-- ============================================================================
-- RLS設定
-- ============================================================================
ALTER TABLE company_lottery_settings ENABLE ROW LEVEL SECURITY;

-- SELECTポリシー（企業メンバーまたはパートナー経由でアクセス可能）
CREATE POLICY "company_lottery_settings_select" ON company_lottery_settings
FOR SELECT
USING (public.user_can_access_company(company_id));

-- INSERTポリシー（直接の企業メンバーのみ）
CREATE POLICY "company_lottery_settings_insert" ON company_lottery_settings
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR
  public.user_is_company_member(company_id)
);

-- UPDATEポリシー（直接の企業メンバーのみ）
CREATE POLICY "company_lottery_settings_update" ON company_lottery_settings
FOR UPDATE
USING (public.user_is_company_member(company_id))
WITH CHECK (public.user_is_company_member(company_id));

-- DELETEポリシー（直接の企業メンバーのみ）
CREATE POLICY "company_lottery_settings_delete" ON company_lottery_settings
FOR DELETE
USING (public.user_is_company_member(company_id));

-- ============================================================================
-- 月間当選カウントを記録するテーブル
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.company_lottery_monthly_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  company_id UUID NOT NULL,
  target_year INTEGER NOT NULL,
  target_month INTEGER NOT NULL,
  -- 当月の試行回数（回答数）
  total_attempts INTEGER NOT NULL DEFAULT 0,
  -- 当月の当選回数
  total_wins INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT company_lottery_monthly_stats_pkey PRIMARY KEY (id),
  CONSTRAINT company_lottery_monthly_stats_company_id_fkey FOREIGN KEY (company_id)
    REFERENCES companies (id) ON DELETE CASCADE,
  CONSTRAINT company_lottery_monthly_stats_unique UNIQUE (company_id, target_year, target_month),
  CONSTRAINT company_lottery_monthly_stats_month_check CHECK (target_month >= 1 AND target_month <= 12)
) TABLESPACE pg_default;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_company_lottery_monthly_stats_company_year_month
  ON company_lottery_monthly_stats(company_id, target_year, target_month);

-- updated_atトリガー
CREATE TRIGGER update_company_lottery_monthly_stats_updated_at
BEFORE UPDATE ON company_lottery_monthly_stats
FOR EACH ROW
EXECUTE FUNCTION update_company_lottery_settings_updated_at();

-- ============================================================================
-- company_lottery_monthly_statsのRLS設定
-- ============================================================================
ALTER TABLE company_lottery_monthly_stats ENABLE ROW LEVEL SECURITY;

-- SELECTポリシー
CREATE POLICY "company_lottery_monthly_stats_select" ON company_lottery_monthly_stats
FOR SELECT
USING (public.user_can_access_company(company_id));

-- INSERT/UPDATE/DELETEはサービスロールのみ（Edge Functionから更新）
CREATE POLICY "company_lottery_monthly_stats_service_role" ON company_lottery_monthly_stats
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- コメント
-- ============================================================================
COMMENT ON TABLE company_lottery_settings IS '企業ごとの抽選設定。全てのレビューフォームで共通の設定を使用。';
COMMENT ON COLUMN company_lottery_settings.win_rate_divisor IS '当選確率の分母。1/Nの確率で当選。';
COMMENT ON COLUMN company_lottery_settings.max_wins_per_month IS '月間の当選上限数。0は上限なし。';
COMMENT ON COLUMN company_lottery_settings.is_enabled IS '抽選機能の有効/無効フラグ。';

COMMENT ON TABLE company_lottery_monthly_stats IS '企業ごとの月間抽選統計。Edge Functionが更新。';
