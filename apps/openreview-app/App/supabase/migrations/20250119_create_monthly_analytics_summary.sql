-- ========================================
-- 月次分析サマリーテーブル作成
-- ========================================

CREATE TABLE IF NOT EXISTS monthly_analytics_summary (
  -- ========================================
  -- 基本情報
  -- ========================================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE, -- NULL = 全店舗
  year_month VARCHAR(7) NOT NULL, -- "2025-01" 形式
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- ========================================
  -- 概要 (get-store-overview)
  -- ========================================
  -- 回答数
  total_responses INTEGER DEFAULT 0,

  -- NPS分布
  nps_score INTEGER, -- -100 ~ 100
  nps_promoters_percent INTEGER DEFAULT 0, -- 推奨者%
  nps_passives_percent INTEGER DEFAULT 0, -- 中立者%
  nps_detractors_percent INTEGER DEFAULT 0, -- 批判者%
  nps_promoters_count INTEGER DEFAULT 0,
  nps_passives_count INTEGER DEFAULT 0,
  nps_detractors_count INTEGER DEFAULT 0,

  -- リピート率
  repeat_rate DECIMAL(5,2) DEFAULT 0, -- リピーター比率%
  repeater_count INTEGER DEFAULT 0,
  new_customer_count INTEGER DEFAULT 0,

  -- 再来店意向（リピーター）
  repeater_revisit_rate DECIMAL(5,2) DEFAULT 0, -- %
  repeater_revisit_yes_count INTEGER DEFAULT 0,
  repeater_revisit_no_count INTEGER DEFAULT 0,

  -- 再来店意向（新規）
  new_revisit_rate DECIMAL(5,2) DEFAULT 0, -- %
  new_revisit_yes_count INTEGER DEFAULT 0,
  new_revisit_no_count INTEGER DEFAULT 0,

  -- ========================================
  -- 売上影響 (get-sales-impact) - 12セグメント
  -- ========================================
  -- セグメント1: 推奨者 × 再来店あり × リピーター (ロイヤル顧客)
  seg_promoter_revisit_repeater_count INTEGER DEFAULT 0,
  seg_promoter_revisit_repeater_percent DECIMAL(5,2) DEFAULT 0,

  -- セグメント2: 推奨者 × 再来店あり × 新規 (期待の新規)
  seg_promoter_revisit_new_count INTEGER DEFAULT 0,
  seg_promoter_revisit_new_percent DECIMAL(5,2) DEFAULT 0,

  -- セグメント3: 推奨者 × 再来店なし × リピーター (離脱リスク推奨者)
  seg_promoter_norevisit_repeater_count INTEGER DEFAULT 0,
  seg_promoter_norevisit_repeater_percent DECIMAL(5,2) DEFAULT 0,

  -- セグメント4: 推奨者 × 再来店なし × 新規 (一見推奨者)
  seg_promoter_norevisit_new_count INTEGER DEFAULT 0,
  seg_promoter_norevisit_new_percent DECIMAL(5,2) DEFAULT 0,

  -- セグメント5: 中立者 × 再来店あり × リピーター (安定中立)
  seg_passive_revisit_repeater_count INTEGER DEFAULT 0,
  seg_passive_revisit_repeater_percent DECIMAL(5,2) DEFAULT 0,

  -- セグメント6: 中立者 × 再来店あり × 新規 (様子見新規)
  seg_passive_revisit_new_count INTEGER DEFAULT 0,
  seg_passive_revisit_new_percent DECIMAL(5,2) DEFAULT 0,

  -- セグメント7: 中立者 × 再来店なし × リピーター (離脱リスク中立)
  seg_passive_norevisit_repeater_count INTEGER DEFAULT 0,
  seg_passive_norevisit_repeater_percent DECIMAL(5,2) DEFAULT 0,

  -- セグメント8: 中立者 × 再来店なし × 新規 (低関心新規)
  seg_passive_norevisit_new_count INTEGER DEFAULT 0,
  seg_passive_norevisit_new_percent DECIMAL(5,2) DEFAULT 0,

  -- セグメント9: 批判者 × 再来店あり × リピーター (不満継続)
  seg_detractor_revisit_repeater_count INTEGER DEFAULT 0,
  seg_detractor_revisit_repeater_percent DECIMAL(5,2) DEFAULT 0,

  -- セグメント10: 批判者 × 再来店あり × 新規 (改善余地新規)
  seg_detractor_revisit_new_count INTEGER DEFAULT 0,
  seg_detractor_revisit_new_percent DECIMAL(5,2) DEFAULT 0,

  -- セグメント11: 批判者 × 再来店なし × リピーター (リピーター離脱)
  seg_detractor_norevisit_repeater_count INTEGER DEFAULT 0,
  seg_detractor_norevisit_repeater_percent DECIMAL(5,2) DEFAULT 0,

  -- セグメント12: 批判者 × 再来店なし × 新規 (新規離脱)
  seg_detractor_norevisit_new_count INTEGER DEFAULT 0,
  seg_detractor_norevisit_new_percent DECIMAL(5,2) DEFAULT 0,

  -- 売上影響分析用集計
  positive_impact_count INTEGER DEFAULT 0, -- ポジティブ影響合計
  positive_impact_percent DECIMAL(5,2) DEFAULT 0,
  negative_impact_count INTEGER DEFAULT 0, -- ネガティブ影響合計
  negative_impact_percent DECIMAL(5,2) DEFAULT 0,

  -- ========================================
  -- 店舗評価 (get-store-evaluation) - QSCスコア
  -- ========================================
  -- QSC総合スコア (1-5スケール)
  qsc_quality_score DECIMAL(3,2) DEFAULT 0, -- Q総合
  qsc_quality_count INTEGER DEFAULT 0,
  qsc_service_score DECIMAL(3,2) DEFAULT 0, -- S総合
  qsc_service_count INTEGER DEFAULT 0,
  qsc_cleanliness_score DECIMAL(3,2) DEFAULT 0, -- C総合
  qsc_cleanliness_count INTEGER DEFAULT 0,

  -- ========================================
  -- Quality項目別 (10項目 × 4値)
  -- ========================================
  -- Q1: 料理の味
  q1_positive_percent INTEGER DEFAULT 0,
  q1_negative_percent INTEGER DEFAULT 0,
  q1_neutral_percent INTEGER DEFAULT 0,
  q1_total_count INTEGER DEFAULT 0,

  -- Q2: 料理の見た目
  q2_positive_percent INTEGER DEFAULT 0,
  q2_negative_percent INTEGER DEFAULT 0,
  q2_neutral_percent INTEGER DEFAULT 0,
  q2_total_count INTEGER DEFAULT 0,

  -- Q3: 料理の量/ボリューム
  q3_positive_percent INTEGER DEFAULT 0,
  q3_negative_percent INTEGER DEFAULT 0,
  q3_neutral_percent INTEGER DEFAULT 0,
  q3_total_count INTEGER DEFAULT 0,

  -- Q4: ドリンクの味
  q4_positive_percent INTEGER DEFAULT 0,
  q4_negative_percent INTEGER DEFAULT 0,
  q4_neutral_percent INTEGER DEFAULT 0,
  q4_total_count INTEGER DEFAULT 0,

  -- Q5: ドリンクの温度
  q5_positive_percent INTEGER DEFAULT 0,
  q5_negative_percent INTEGER DEFAULT 0,
  q5_neutral_percent INTEGER DEFAULT 0,
  q5_total_count INTEGER DEFAULT 0,

  -- Q6: 食べたい料理
  q6_positive_percent INTEGER DEFAULT 0,
  q6_negative_percent INTEGER DEFAULT 0,
  q6_neutral_percent INTEGER DEFAULT 0,
  q6_total_count INTEGER DEFAULT 0,

  -- Q7: 飲みたいドリンク
  q7_positive_percent INTEGER DEFAULT 0,
  q7_negative_percent INTEGER DEFAULT 0,
  q7_neutral_percent INTEGER DEFAULT 0,
  q7_total_count INTEGER DEFAULT 0,

  -- Q8: メニューの種類
  q8_positive_percent INTEGER DEFAULT 0,
  q8_negative_percent INTEGER DEFAULT 0,
  q8_neutral_percent INTEGER DEFAULT 0,
  q8_total_count INTEGER DEFAULT 0,

  -- Q9: 料理・ドリンクの温度
  q9_positive_percent INTEGER DEFAULT 0,
  q9_negative_percent INTEGER DEFAULT 0,
  q9_neutral_percent INTEGER DEFAULT 0,
  q9_total_count INTEGER DEFAULT 0,

  -- Q10: 特徴や独自性
  q10_positive_percent INTEGER DEFAULT 0,
  q10_negative_percent INTEGER DEFAULT 0,
  q10_neutral_percent INTEGER DEFAULT 0,
  q10_total_count INTEGER DEFAULT 0,

  -- ========================================
  -- Service項目別 (10項目 × 4値)
  -- ========================================
  -- S1: 入店時の挨拶
  s1_positive_percent INTEGER DEFAULT 0,
  s1_negative_percent INTEGER DEFAULT 0,
  s1_neutral_percent INTEGER DEFAULT 0,
  s1_total_count INTEGER DEFAULT 0,

  -- S2: 席への案内
  s2_positive_percent INTEGER DEFAULT 0,
  s2_negative_percent INTEGER DEFAULT 0,
  s2_neutral_percent INTEGER DEFAULT 0,
  s2_total_count INTEGER DEFAULT 0,

  -- S3: 注文時の対応
  s3_positive_percent INTEGER DEFAULT 0,
  s3_negative_percent INTEGER DEFAULT 0,
  s3_neutral_percent INTEGER DEFAULT 0,
  s3_total_count INTEGER DEFAULT 0,

  -- S4: メニュー説明・提案
  s4_positive_percent INTEGER DEFAULT 0,
  s4_negative_percent INTEGER DEFAULT 0,
  s4_neutral_percent INTEGER DEFAULT 0,
  s4_total_count INTEGER DEFAULT 0,

  -- S5: 提供スピード
  s5_positive_percent INTEGER DEFAULT 0,
  s5_negative_percent INTEGER DEFAULT 0,
  s5_neutral_percent INTEGER DEFAULT 0,
  s5_total_count INTEGER DEFAULT 0,

  -- S6: 注文・提供の正確さ
  s6_positive_percent INTEGER DEFAULT 0,
  s6_negative_percent INTEGER DEFAULT 0,
  s6_neutral_percent INTEGER DEFAULT 0,
  s6_total_count INTEGER DEFAULT 0,

  -- S7: スタッフの気配り
  s7_positive_percent INTEGER DEFAULT 0,
  s7_negative_percent INTEGER DEFAULT 0,
  s7_neutral_percent INTEGER DEFAULT 0,
  s7_total_count INTEGER DEFAULT 0,

  -- S8: スタッフの笑顔・感じの良さ
  s8_positive_percent INTEGER DEFAULT 0,
  s8_negative_percent INTEGER DEFAULT 0,
  s8_neutral_percent INTEGER DEFAULT 0,
  s8_total_count INTEGER DEFAULT 0,

  -- S9: スタッフの言葉遣い
  s9_positive_percent INTEGER DEFAULT 0,
  s9_negative_percent INTEGER DEFAULT 0,
  s9_neutral_percent INTEGER DEFAULT 0,
  s9_total_count INTEGER DEFAULT 0,

  -- S10: 特に良かったスタッフ
  s10_positive_percent INTEGER DEFAULT 0,
  s10_negative_percent INTEGER DEFAULT 0,
  s10_neutral_percent INTEGER DEFAULT 0,
  s10_total_count INTEGER DEFAULT 0,

  -- ========================================
  -- Cleanliness項目別 (10項目 × 4値)
  -- ========================================
  -- C1: 店舗外観・入口
  c1_positive_percent INTEGER DEFAULT 0,
  c1_negative_percent INTEGER DEFAULT 0,
  c1_neutral_percent INTEGER DEFAULT 0,
  c1_total_count INTEGER DEFAULT 0,

  -- C2: テーブル
  c2_positive_percent INTEGER DEFAULT 0,
  c2_negative_percent INTEGER DEFAULT 0,
  c2_neutral_percent INTEGER DEFAULT 0,
  c2_total_count INTEGER DEFAULT 0,

  -- C3: 椅子・ソファ
  c3_positive_percent INTEGER DEFAULT 0,
  c3_negative_percent INTEGER DEFAULT 0,
  c3_neutral_percent INTEGER DEFAULT 0,
  c3_total_count INTEGER DEFAULT 0,

  -- C4: 床
  c4_positive_percent INTEGER DEFAULT 0,
  c4_negative_percent INTEGER DEFAULT 0,
  c4_neutral_percent INTEGER DEFAULT 0,
  c4_total_count INTEGER DEFAULT 0,

  -- C5: 食器・カトラリー
  c5_positive_percent INTEGER DEFAULT 0,
  c5_negative_percent INTEGER DEFAULT 0,
  c5_neutral_percent INTEGER DEFAULT 0,
  c5_total_count INTEGER DEFAULT 0,

  -- C6: メニュー表・卓上備品
  c6_positive_percent INTEGER DEFAULT 0,
  c6_negative_percent INTEGER DEFAULT 0,
  c6_neutral_percent INTEGER DEFAULT 0,
  c6_total_count INTEGER DEFAULT 0,

  -- C7: トイレ
  c7_positive_percent INTEGER DEFAULT 0,
  c7_negative_percent INTEGER DEFAULT 0,
  c7_neutral_percent INTEGER DEFAULT 0,
  c7_total_count INTEGER DEFAULT 0,

  -- C8: 店内の空気や匂い
  c8_positive_percent INTEGER DEFAULT 0,
  c8_negative_percent INTEGER DEFAULT 0,
  c8_neutral_percent INTEGER DEFAULT 0,
  c8_total_count INTEGER DEFAULT 0,

  -- C9: 店内の整理整頓
  c9_positive_percent INTEGER DEFAULT 0,
  c9_negative_percent INTEGER DEFAULT 0,
  c9_neutral_percent INTEGER DEFAULT 0,
  c9_total_count INTEGER DEFAULT 0,

  -- C10: スタッフの身だしなみ
  c10_positive_percent INTEGER DEFAULT 0,
  c10_negative_percent INTEGER DEFAULT 0,
  c10_neutral_percent INTEGER DEFAULT 0,
  c10_total_count INTEGER DEFAULT 0,

  -- QSCカテゴリ別ポジネガ集計
  quality_positive_count INTEGER DEFAULT 0,
  quality_negative_count INTEGER DEFAULT 0,
  quality_neutral_count INTEGER DEFAULT 0,
  service_positive_count INTEGER DEFAULT 0,
  service_negative_count INTEGER DEFAULT 0,
  service_neutral_count INTEGER DEFAULT 0,
  cleanliness_positive_count INTEGER DEFAULT 0,
  cleanliness_negative_count INTEGER DEFAULT 0,
  cleanliness_neutral_count INTEGER DEFAULT 0,

  -- ========================================
  -- 顧客傾向 (get-customer-trends)
  -- ========================================
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

  -- 同行者分布（主要カテゴリ）
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

  -- 顧客重視ポイント（レーダーチャート用 - 正規化スコア0-100）
  -- 全体
  pref_total_quality INTEGER DEFAULT 0,
  pref_total_service INTEGER DEFAULT 0,
  pref_total_atmosphere INTEGER DEFAULT 0, -- 空間
  pref_total_hygiene INTEGER DEFAULT 0, -- 衛生
  pref_total_price INTEGER DEFAULT 0, -- 価格感度

  -- リピーター
  pref_repeater_quality INTEGER DEFAULT 0,
  pref_repeater_service INTEGER DEFAULT 0,
  pref_repeater_atmosphere INTEGER DEFAULT 0,
  pref_repeater_hygiene INTEGER DEFAULT 0,
  pref_repeater_price INTEGER DEFAULT 0,

  -- 新規
  pref_new_quality INTEGER DEFAULT 0,
  pref_new_service INTEGER DEFAULT 0,
  pref_new_atmosphere INTEGER DEFAULT 0,
  pref_new_hygiene INTEGER DEFAULT 0,
  pref_new_price INTEGER DEFAULT 0,

  -- ========================================
  -- 制約
  -- ========================================
  CONSTRAINT unique_company_store_yearmonth UNIQUE(company_id, store_id, year_month)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_monthly_analytics_company ON monthly_analytics_summary(company_id);
CREATE INDEX IF NOT EXISTS idx_monthly_analytics_store ON monthly_analytics_summary(store_id);
CREATE INDEX IF NOT EXISTS idx_monthly_analytics_yearmonth ON monthly_analytics_summary(year_month);
CREATE INDEX IF NOT EXISTS idx_monthly_analytics_company_yearmonth ON monthly_analytics_summary(company_id, year_month);

-- updated_atを自動更新するトリガー
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

-- 企業メンバーは自社データを参照可能
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

-- パートナーは関連企業のデータを参照可能
CREATE POLICY "Partners can view affiliate company analytics"
  ON monthly_analytics_summary
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_affiliate_companies pac
      JOIN partner_memberships pm ON pac.partner_id = pm.partner_id
      WHERE pac.companies_id = monthly_analytics_summary.company_id
      AND pm.business_users_id = auth.uid()
    )
  );

-- サービスロールは全データにアクセス可能（Edge Function用）
CREATE POLICY "Service role has full access"
  ON monthly_analytics_summary
  FOR ALL
  USING (auth.role() = 'service_role');

-- ========================================
-- pg_cronでスケジュール実行を設定
-- 日本時間0時45分 = UTC 15:45
-- ========================================

-- pg_cron拡張を有効化（必要な場合）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 既存のジョブを削除（存在する場合）
SELECT cron.unschedule('update-monthly-analytics')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'update-monthly-analytics'
);

-- 毎日UTC 15:45（日本時間0:45）にEdge Functionを実行
SELECT cron.schedule(
  'update-monthly-analytics',
  '45 15 * * *', -- 毎日UTC 15:45
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/update-monthly-analytics',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- コメント
COMMENT ON TABLE monthly_analytics_summary IS '月次分析サマリーテーブル - 概要、売上影響、店舗評価、顧客傾向のデータを月次で集計';
