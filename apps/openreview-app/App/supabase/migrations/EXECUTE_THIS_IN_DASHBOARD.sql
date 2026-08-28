-- ========================================
-- Supabaseダッシュボードで実行するSQL
-- SQL Editor で実行してください
-- ========================================

-- ========================================
-- 1. app_settingsテーブル作成
-- ========================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only" ON app_settings;
CREATE POLICY "Service role only" ON app_settings
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- 2. monthly_analytics_summaryテーブル作成
-- ========================================
CREATE TABLE IF NOT EXISTS monthly_analytics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 概要
  total_responses INTEGER DEFAULT 0,
  nps_score INTEGER,
  nps_promoters_percent INTEGER DEFAULT 0,
  nps_passives_percent INTEGER DEFAULT 0,
  nps_detractors_percent INTEGER DEFAULT 0,
  nps_promoters_count INTEGER DEFAULT 0,
  nps_passives_count INTEGER DEFAULT 0,
  nps_detractors_count INTEGER DEFAULT 0,

  repeat_rate DECIMAL(5,2) DEFAULT 0,
  repeater_count INTEGER DEFAULT 0,
  new_customer_count INTEGER DEFAULT 0,

  repeater_revisit_rate DECIMAL(5,2) DEFAULT 0,
  repeater_revisit_yes_count INTEGER DEFAULT 0,
  repeater_revisit_no_count INTEGER DEFAULT 0,

  new_revisit_rate DECIMAL(5,2) DEFAULT 0,
  new_revisit_yes_count INTEGER DEFAULT 0,
  new_revisit_no_count INTEGER DEFAULT 0,

  -- 12セグメント
  seg_promoter_revisit_repeater_count INTEGER DEFAULT 0,
  seg_promoter_revisit_repeater_percent DECIMAL(5,2) DEFAULT 0,
  seg_promoter_revisit_new_count INTEGER DEFAULT 0,
  seg_promoter_revisit_new_percent DECIMAL(5,2) DEFAULT 0,
  seg_promoter_norevisit_repeater_count INTEGER DEFAULT 0,
  seg_promoter_norevisit_repeater_percent DECIMAL(5,2) DEFAULT 0,
  seg_promoter_norevisit_new_count INTEGER DEFAULT 0,
  seg_promoter_norevisit_new_percent DECIMAL(5,2) DEFAULT 0,
  seg_passive_revisit_repeater_count INTEGER DEFAULT 0,
  seg_passive_revisit_repeater_percent DECIMAL(5,2) DEFAULT 0,
  seg_passive_revisit_new_count INTEGER DEFAULT 0,
  seg_passive_revisit_new_percent DECIMAL(5,2) DEFAULT 0,
  seg_passive_norevisit_repeater_count INTEGER DEFAULT 0,
  seg_passive_norevisit_repeater_percent DECIMAL(5,2) DEFAULT 0,
  seg_passive_norevisit_new_count INTEGER DEFAULT 0,
  seg_passive_norevisit_new_percent DECIMAL(5,2) DEFAULT 0,
  seg_detractor_revisit_repeater_count INTEGER DEFAULT 0,
  seg_detractor_revisit_repeater_percent DECIMAL(5,2) DEFAULT 0,
  seg_detractor_revisit_new_count INTEGER DEFAULT 0,
  seg_detractor_revisit_new_percent DECIMAL(5,2) DEFAULT 0,
  seg_detractor_norevisit_repeater_count INTEGER DEFAULT 0,
  seg_detractor_norevisit_repeater_percent DECIMAL(5,2) DEFAULT 0,
  seg_detractor_norevisit_new_count INTEGER DEFAULT 0,
  seg_detractor_norevisit_new_percent DECIMAL(5,2) DEFAULT 0,

  positive_impact_count INTEGER DEFAULT 0,
  positive_impact_percent DECIMAL(5,2) DEFAULT 0,
  negative_impact_count INTEGER DEFAULT 0,
  negative_impact_percent DECIMAL(5,2) DEFAULT 0,

  -- QSC総合
  qsc_quality_score DECIMAL(3,2) DEFAULT 0,
  qsc_quality_count INTEGER DEFAULT 0,
  qsc_service_score DECIMAL(3,2) DEFAULT 0,
  qsc_service_count INTEGER DEFAULT 0,
  qsc_cleanliness_score DECIMAL(3,2) DEFAULT 0,
  qsc_cleanliness_count INTEGER DEFAULT 0,

  -- Quality項目別
  q1_positive_percent INTEGER DEFAULT 0,
  q1_negative_percent INTEGER DEFAULT 0,
  q1_neutral_percent INTEGER DEFAULT 0,
  q1_total_count INTEGER DEFAULT 0,
  q2_positive_percent INTEGER DEFAULT 0,
  q2_negative_percent INTEGER DEFAULT 0,
  q2_neutral_percent INTEGER DEFAULT 0,
  q2_total_count INTEGER DEFAULT 0,
  q3_positive_percent INTEGER DEFAULT 0,
  q3_negative_percent INTEGER DEFAULT 0,
  q3_neutral_percent INTEGER DEFAULT 0,
  q3_total_count INTEGER DEFAULT 0,
  q4_positive_percent INTEGER DEFAULT 0,
  q4_negative_percent INTEGER DEFAULT 0,
  q4_neutral_percent INTEGER DEFAULT 0,
  q4_total_count INTEGER DEFAULT 0,
  q5_positive_percent INTEGER DEFAULT 0,
  q5_negative_percent INTEGER DEFAULT 0,
  q5_neutral_percent INTEGER DEFAULT 0,
  q5_total_count INTEGER DEFAULT 0,
  q6_positive_percent INTEGER DEFAULT 0,
  q6_negative_percent INTEGER DEFAULT 0,
  q6_neutral_percent INTEGER DEFAULT 0,
  q6_total_count INTEGER DEFAULT 0,
  q7_positive_percent INTEGER DEFAULT 0,
  q7_negative_percent INTEGER DEFAULT 0,
  q7_neutral_percent INTEGER DEFAULT 0,
  q7_total_count INTEGER DEFAULT 0,
  q8_positive_percent INTEGER DEFAULT 0,
  q8_negative_percent INTEGER DEFAULT 0,
  q8_neutral_percent INTEGER DEFAULT 0,
  q8_total_count INTEGER DEFAULT 0,
  q9_positive_percent INTEGER DEFAULT 0,
  q9_negative_percent INTEGER DEFAULT 0,
  q9_neutral_percent INTEGER DEFAULT 0,
  q9_total_count INTEGER DEFAULT 0,
  q10_positive_percent INTEGER DEFAULT 0,
  q10_negative_percent INTEGER DEFAULT 0,
  q10_neutral_percent INTEGER DEFAULT 0,
  q10_total_count INTEGER DEFAULT 0,

  -- Service項目別
  s1_positive_percent INTEGER DEFAULT 0,
  s1_negative_percent INTEGER DEFAULT 0,
  s1_neutral_percent INTEGER DEFAULT 0,
  s1_total_count INTEGER DEFAULT 0,
  s2_positive_percent INTEGER DEFAULT 0,
  s2_negative_percent INTEGER DEFAULT 0,
  s2_neutral_percent INTEGER DEFAULT 0,
  s2_total_count INTEGER DEFAULT 0,
  s3_positive_percent INTEGER DEFAULT 0,
  s3_negative_percent INTEGER DEFAULT 0,
  s3_neutral_percent INTEGER DEFAULT 0,
  s3_total_count INTEGER DEFAULT 0,
  s4_positive_percent INTEGER DEFAULT 0,
  s4_negative_percent INTEGER DEFAULT 0,
  s4_neutral_percent INTEGER DEFAULT 0,
  s4_total_count INTEGER DEFAULT 0,
  s5_positive_percent INTEGER DEFAULT 0,
  s5_negative_percent INTEGER DEFAULT 0,
  s5_neutral_percent INTEGER DEFAULT 0,
  s5_total_count INTEGER DEFAULT 0,
  s6_positive_percent INTEGER DEFAULT 0,
  s6_negative_percent INTEGER DEFAULT 0,
  s6_neutral_percent INTEGER DEFAULT 0,
  s6_total_count INTEGER DEFAULT 0,
  s7_positive_percent INTEGER DEFAULT 0,
  s7_negative_percent INTEGER DEFAULT 0,
  s7_neutral_percent INTEGER DEFAULT 0,
  s7_total_count INTEGER DEFAULT 0,
  s8_positive_percent INTEGER DEFAULT 0,
  s8_negative_percent INTEGER DEFAULT 0,
  s8_neutral_percent INTEGER DEFAULT 0,
  s8_total_count INTEGER DEFAULT 0,
  s9_positive_percent INTEGER DEFAULT 0,
  s9_negative_percent INTEGER DEFAULT 0,
  s9_neutral_percent INTEGER DEFAULT 0,
  s9_total_count INTEGER DEFAULT 0,
  s10_positive_percent INTEGER DEFAULT 0,
  s10_negative_percent INTEGER DEFAULT 0,
  s10_neutral_percent INTEGER DEFAULT 0,
  s10_total_count INTEGER DEFAULT 0,

  -- Cleanliness項目別
  c1_positive_percent INTEGER DEFAULT 0,
  c1_negative_percent INTEGER DEFAULT 0,
  c1_neutral_percent INTEGER DEFAULT 0,
  c1_total_count INTEGER DEFAULT 0,
  c2_positive_percent INTEGER DEFAULT 0,
  c2_negative_percent INTEGER DEFAULT 0,
  c2_neutral_percent INTEGER DEFAULT 0,
  c2_total_count INTEGER DEFAULT 0,
  c3_positive_percent INTEGER DEFAULT 0,
  c3_negative_percent INTEGER DEFAULT 0,
  c3_neutral_percent INTEGER DEFAULT 0,
  c3_total_count INTEGER DEFAULT 0,
  c4_positive_percent INTEGER DEFAULT 0,
  c4_negative_percent INTEGER DEFAULT 0,
  c4_neutral_percent INTEGER DEFAULT 0,
  c4_total_count INTEGER DEFAULT 0,
  c5_positive_percent INTEGER DEFAULT 0,
  c5_negative_percent INTEGER DEFAULT 0,
  c5_neutral_percent INTEGER DEFAULT 0,
  c5_total_count INTEGER DEFAULT 0,
  c6_positive_percent INTEGER DEFAULT 0,
  c6_negative_percent INTEGER DEFAULT 0,
  c6_neutral_percent INTEGER DEFAULT 0,
  c6_total_count INTEGER DEFAULT 0,
  c7_positive_percent INTEGER DEFAULT 0,
  c7_negative_percent INTEGER DEFAULT 0,
  c7_neutral_percent INTEGER DEFAULT 0,
  c7_total_count INTEGER DEFAULT 0,
  c8_positive_percent INTEGER DEFAULT 0,
  c8_negative_percent INTEGER DEFAULT 0,
  c8_neutral_percent INTEGER DEFAULT 0,
  c8_total_count INTEGER DEFAULT 0,
  c9_positive_percent INTEGER DEFAULT 0,
  c9_negative_percent INTEGER DEFAULT 0,
  c9_neutral_percent INTEGER DEFAULT 0,
  c9_total_count INTEGER DEFAULT 0,
  c10_positive_percent INTEGER DEFAULT 0,
  c10_negative_percent INTEGER DEFAULT 0,
  c10_neutral_percent INTEGER DEFAULT 0,
  c10_total_count INTEGER DEFAULT 0,

  -- QSCカテゴリ別集計
  quality_positive_count INTEGER DEFAULT 0,
  quality_negative_count INTEGER DEFAULT 0,
  quality_neutral_count INTEGER DEFAULT 0,
  service_positive_count INTEGER DEFAULT 0,
  service_negative_count INTEGER DEFAULT 0,
  service_neutral_count INTEGER DEFAULT 0,
  cleanliness_positive_count INTEGER DEFAULT 0,
  cleanliness_negative_count INTEGER DEFAULT 0,
  cleanliness_neutral_count INTEGER DEFAULT 0,

  -- 性別分布
  gender_male_count INTEGER DEFAULT 0,
  gender_male_percent INTEGER DEFAULT 0,
  gender_female_count INTEGER DEFAULT 0,
  gender_female_percent INTEGER DEFAULT 0,
  gender_other_count INTEGER DEFAULT 0,
  gender_other_percent INTEGER DEFAULT 0,

  -- 年齢分布
  age_20s_count INTEGER DEFAULT 0,
  age_20s_percent INTEGER DEFAULT 0,
  age_30s_count INTEGER DEFAULT 0,
  age_30s_percent INTEGER DEFAULT 0,
  age_40s_count INTEGER DEFAULT 0,
  age_40s_percent INTEGER DEFAULT 0,
  age_50s_count INTEGER DEFAULT 0,
  age_50s_percent INTEGER DEFAULT 0,
  age_60plus_count INTEGER DEFAULT 0,
  age_60plus_percent INTEGER DEFAULT 0,

  -- 同行者分布
  companion_alone_count INTEGER DEFAULT 0,
  companion_alone_percent INTEGER DEFAULT 0,
  companion_couple_count INTEGER DEFAULT 0,
  companion_couple_percent INTEGER DEFAULT 0,
  companion_friends_count INTEGER DEFAULT 0,
  companion_friends_percent INTEGER DEFAULT 0,
  companion_family_count INTEGER DEFAULT 0,
  companion_family_percent INTEGER DEFAULT 0,
  companion_business_count INTEGER DEFAULT 0,
  companion_business_percent INTEGER DEFAULT 0,
  companion_other_count INTEGER DEFAULT 0,
  companion_other_percent INTEGER DEFAULT 0,

  -- 顧客重視ポイント（全体）
  pref_total_quality INTEGER DEFAULT 0,
  pref_total_service INTEGER DEFAULT 0,
  pref_total_atmosphere INTEGER DEFAULT 0,
  pref_total_hygiene INTEGER DEFAULT 0,
  pref_total_price INTEGER DEFAULT 0,

  -- 顧客重視ポイント（リピーター）
  pref_repeater_quality INTEGER DEFAULT 0,
  pref_repeater_service INTEGER DEFAULT 0,
  pref_repeater_atmosphere INTEGER DEFAULT 0,
  pref_repeater_hygiene INTEGER DEFAULT 0,
  pref_repeater_price INTEGER DEFAULT 0,

  -- 顧客重視ポイント（新規）
  pref_new_quality INTEGER DEFAULT 0,
  pref_new_service INTEGER DEFAULT 0,
  pref_new_atmosphere INTEGER DEFAULT 0,
  pref_new_hygiene INTEGER DEFAULT 0,
  pref_new_price INTEGER DEFAULT 0,

  -- 制約（store_idがNULLでもユニーク制約を効かせるため）
  CONSTRAINT unique_company_store_yearmonth UNIQUE NULLS NOT DISTINCT (company_id, store_id, year_month)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_monthly_analytics_company ON monthly_analytics_summary(company_id);
CREATE INDEX IF NOT EXISTS idx_monthly_analytics_store ON monthly_analytics_summary(store_id);
CREATE INDEX IF NOT EXISTS idx_monthly_analytics_yearmonth ON monthly_analytics_summary(year_month);
CREATE INDEX IF NOT EXISTS idx_monthly_analytics_company_yearmonth ON monthly_analytics_summary(company_id, year_month);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_monthly_analytics_summary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_monthly_analytics_summary_updated_at ON monthly_analytics_summary;
CREATE TRIGGER trigger_update_monthly_analytics_summary_updated_at
  BEFORE UPDATE ON monthly_analytics_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_analytics_summary_updated_at();

-- RLSポリシー
ALTER TABLE monthly_analytics_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can view their company analytics" ON monthly_analytics_summary;
CREATE POLICY "Company members can view their company analytics"
  ON monthly_analytics_summary
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_memberships
      WHERE company_memberships.company_id = monthly_analytics_summary.company_id
      AND company_memberships.business_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Partners can view affiliate company analytics" ON monthly_analytics_summary;
CREATE POLICY "Partners can view affiliate company analytics"
  ON monthly_analytics_summary
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_affiliate_companies pac
      JOIN partner_memberships pm ON pac.partner_company_id = pm.partner_company_id
      WHERE pac.companies_id = monthly_analytics_summary.company_id
      AND pm.business_users_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role has full access" ON monthly_analytics_summary;
CREATE POLICY "Service role has full access"
  ON monthly_analytics_summary
  FOR ALL
  USING (auth.role() = 'service_role');

-- ========================================
-- 3. pg_net拡張を有効化
-- ========================================
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ========================================
-- 成功メッセージ
-- ========================================
SELECT 'テーブル作成完了！次にCronジョブを設定してください。' AS message;
