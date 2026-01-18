-- ========================================
-- 2025年12月のテストデータを挿入
-- 既存のstore_idと同じものを使用
-- ========================================

-- 既存データの確認
SELECT company_id, store_id, year_month, total_responses FROM monthly_analytics_summary;

-- 既存のstore_idを使用して2025-12のテストデータを挿入
-- (既存データがある前提で、そのcompany_idとstore_idを使用)
INSERT INTO monthly_analytics_summary (
  company_id,
  store_id,
  year_month,

  -- 概要
  total_responses,
  nps_score,
  nps_promoters_percent,
  nps_passives_percent,
  nps_detractors_percent,
  nps_promoters_count,
  nps_passives_count,
  nps_detractors_count,

  repeat_rate,
  repeater_count,
  new_customer_count,

  repeater_revisit_rate,
  repeater_revisit_yes_count,
  repeater_revisit_no_count,

  new_revisit_rate,
  new_revisit_yes_count,
  new_revisit_no_count,

  -- 12セグメント
  seg_promoter_revisit_repeater_count,
  seg_promoter_revisit_repeater_percent,
  seg_promoter_revisit_new_count,
  seg_promoter_revisit_new_percent,
  seg_promoter_norevisit_repeater_count,
  seg_promoter_norevisit_repeater_percent,
  seg_promoter_norevisit_new_count,
  seg_promoter_norevisit_new_percent,
  seg_passive_revisit_repeater_count,
  seg_passive_revisit_repeater_percent,
  seg_passive_revisit_new_count,
  seg_passive_revisit_new_percent,
  seg_passive_norevisit_repeater_count,
  seg_passive_norevisit_repeater_percent,
  seg_passive_norevisit_new_count,
  seg_passive_norevisit_new_percent,
  seg_detractor_revisit_repeater_count,
  seg_detractor_revisit_repeater_percent,
  seg_detractor_revisit_new_count,
  seg_detractor_revisit_new_percent,
  seg_detractor_norevisit_repeater_count,
  seg_detractor_norevisit_repeater_percent,
  seg_detractor_norevisit_new_count,
  seg_detractor_norevisit_new_percent,

  positive_impact_count,
  positive_impact_percent,
  negative_impact_count,
  negative_impact_percent,

  -- QSC総合
  qsc_quality_score,
  qsc_quality_count,
  qsc_service_score,
  qsc_service_count,
  qsc_cleanliness_score,
  qsc_cleanliness_count,

  -- Quality項目別 (q1-q10)
  q1_positive_percent, q1_negative_percent, q1_neutral_percent, q1_total_count,
  q2_positive_percent, q2_negative_percent, q2_neutral_percent, q2_total_count,
  q3_positive_percent, q3_negative_percent, q3_neutral_percent, q3_total_count,
  q4_positive_percent, q4_negative_percent, q4_neutral_percent, q4_total_count,
  q5_positive_percent, q5_negative_percent, q5_neutral_percent, q5_total_count,
  q6_positive_percent, q6_negative_percent, q6_neutral_percent, q6_total_count,
  q7_positive_percent, q7_negative_percent, q7_neutral_percent, q7_total_count,
  q8_positive_percent, q8_negative_percent, q8_neutral_percent, q8_total_count,
  q9_positive_percent, q9_negative_percent, q9_neutral_percent, q9_total_count,
  q10_positive_percent, q10_negative_percent, q10_neutral_percent, q10_total_count,

  -- Service項目別 (s1-s10)
  s1_positive_percent, s1_negative_percent, s1_neutral_percent, s1_total_count,
  s2_positive_percent, s2_negative_percent, s2_neutral_percent, s2_total_count,
  s3_positive_percent, s3_negative_percent, s3_neutral_percent, s3_total_count,
  s4_positive_percent, s4_negative_percent, s4_neutral_percent, s4_total_count,
  s5_positive_percent, s5_negative_percent, s5_neutral_percent, s5_total_count,
  s6_positive_percent, s6_negative_percent, s6_neutral_percent, s6_total_count,
  s7_positive_percent, s7_negative_percent, s7_neutral_percent, s7_total_count,
  s8_positive_percent, s8_negative_percent, s8_neutral_percent, s8_total_count,
  s9_positive_percent, s9_negative_percent, s9_neutral_percent, s9_total_count,
  s10_positive_percent, s10_negative_percent, s10_neutral_percent, s10_total_count,

  -- Cleanliness項目別 (c1-c10)
  c1_positive_percent, c1_negative_percent, c1_neutral_percent, c1_total_count,
  c2_positive_percent, c2_negative_percent, c2_neutral_percent, c2_total_count,
  c3_positive_percent, c3_negative_percent, c3_neutral_percent, c3_total_count,
  c4_positive_percent, c4_negative_percent, c4_neutral_percent, c4_total_count,
  c5_positive_percent, c5_negative_percent, c5_neutral_percent, c5_total_count,
  c6_positive_percent, c6_negative_percent, c6_neutral_percent, c6_total_count,
  c7_positive_percent, c7_negative_percent, c7_neutral_percent, c7_total_count,
  c8_positive_percent, c8_negative_percent, c8_neutral_percent, c8_total_count,
  c9_positive_percent, c9_negative_percent, c9_neutral_percent, c9_total_count,
  c10_positive_percent, c10_negative_percent, c10_neutral_percent, c10_total_count,

  -- QSCカテゴリ別集計
  quality_positive_count, quality_negative_count, quality_neutral_count,
  service_positive_count, service_negative_count, service_neutral_count,
  cleanliness_positive_count, cleanliness_negative_count, cleanliness_neutral_count,

  -- 性別分布
  gender_male_count, gender_male_percent,
  gender_female_count, gender_female_percent,
  gender_other_count, gender_other_percent,

  -- 年齢分布
  age_20s_count, age_20s_percent,
  age_30s_count, age_30s_percent,
  age_40s_count, age_40s_percent,
  age_50s_count, age_50s_percent,
  age_60plus_count, age_60plus_percent,

  -- 同行者分布
  companion_alone_count, companion_alone_percent,
  companion_couple_count, companion_couple_percent,
  companion_friends_count, companion_friends_percent,
  companion_family_count, companion_family_percent,
  companion_business_count, companion_business_percent,
  companion_other_count, companion_other_percent,

  -- 顧客重視ポイント
  pref_total_quality, pref_total_service, pref_total_atmosphere, pref_total_hygiene, pref_total_price,
  pref_repeater_quality, pref_repeater_service, pref_repeater_atmosphere, pref_repeater_hygiene, pref_repeater_price,
  pref_new_quality, pref_new_service, pref_new_atmosphere, pref_new_hygiene, pref_new_price
)
SELECT
  company_id,
  store_id,
  '2025-12',  -- 12月のデータ

  -- 概要 (1月より少し低いテストデータ)
  45,   -- total_responses
  25,   -- nps_score (1月より低い)
  35,   -- nps_promoters_percent
  40,   -- nps_passives_percent
  25,   -- nps_detractors_percent
  16,   -- nps_promoters_count
  18,   -- nps_passives_count
  11,   -- nps_detractors_count

  55.00,  -- repeat_rate
  25,     -- repeater_count
  20,     -- new_customer_count

  70.00,  -- repeater_revisit_rate
  17,     -- repeater_revisit_yes_count
  8,      -- repeater_revisit_no_count

  60.00,  -- new_revisit_rate
  12,     -- new_revisit_yes_count
  8,      -- new_revisit_no_count

  -- 12セグメント
  8, 17.78,   -- seg_promoter_revisit_repeater
  5, 11.11,   -- seg_promoter_revisit_new
  2, 4.44,    -- seg_promoter_norevisit_repeater
  1, 2.22,    -- seg_promoter_norevisit_new
  6, 13.33,   -- seg_passive_revisit_repeater
  4, 8.89,    -- seg_passive_revisit_new
  4, 8.89,    -- seg_passive_norevisit_repeater
  4, 8.89,    -- seg_passive_norevisit_new
  3, 6.67,    -- seg_detractor_revisit_repeater
  3, 6.67,    -- seg_detractor_revisit_new
  2, 4.44,    -- seg_detractor_norevisit_repeater
  3, 6.67,    -- seg_detractor_norevisit_new

  26, 57.78,  -- positive_impact
  19, 42.22,  -- negative_impact

  -- QSC総合
  3.5, 40,    -- quality
  3.6, 42,    -- service
  3.4, 38,    -- cleanliness

  -- Quality項目別 (q1-q10) - 1月より少し低め
  65, 15, 20, 40,  -- q1
  60, 18, 22, 38,  -- q2
  70, 12, 18, 42,  -- q3
  55, 20, 25, 35,  -- q4
  58, 17, 25, 36,  -- q5
  62, 15, 23, 40,  -- q6
  68, 12, 20, 41,  -- q7
  55, 20, 25, 35,  -- q8
  60, 18, 22, 38,  -- q9
  65, 15, 20, 40,  -- q10

  -- Service項目別 (s1-s10)
  70, 12, 18, 42,  -- s1
  68, 14, 18, 40,  -- s2
  72, 10, 18, 44,  -- s3
  65, 15, 20, 40,  -- s4
  60, 18, 22, 38,  -- s5
  68, 12, 20, 41,  -- s6
  70, 12, 18, 42,  -- s7
  65, 15, 20, 40,  -- s8
  62, 18, 20, 39,  -- s9
  68, 14, 18, 40,  -- s10

  -- Cleanliness項目別 (c1-c10)
  65, 15, 20, 40,  -- c1
  60, 18, 22, 38,  -- c2
  68, 12, 20, 41,  -- c3
  62, 16, 22, 39,  -- c4
  70, 12, 18, 42,  -- c5
  65, 15, 20, 40,  -- c6
  58, 20, 22, 36,  -- c7
  62, 18, 20, 39,  -- c8
  65, 15, 20, 40,  -- c9
  60, 18, 22, 38,  -- c10

  -- QSCカテゴリ別集計
  250, 60, 85,   -- quality
  270, 55, 75,   -- service
  240, 65, 80,   -- cleanliness

  -- 性別分布
  20, 44,   -- male
  22, 49,   -- female
  3, 7,     -- other

  -- 年齢分布
  8, 18,    -- 20s
  12, 27,   -- 30s
  15, 33,   -- 40s
  7, 16,    -- 50s
  3, 7,     -- 60plus

  -- 同行者分布
  10, 22,   -- alone
  8, 18,    -- couple
  12, 27,   -- friends
  10, 22,   -- family
  3, 7,     -- business
  2, 4,     -- other

  -- 顧客重視ポイント
  35, 30, 20, 25, 40,   -- total
  38, 32, 22, 28, 35,   -- repeater
  30, 28, 18, 22, 48    -- new

FROM monthly_analytics_summary
WHERE year_month = '2026-01'
LIMIT 1
ON CONFLICT ON CONSTRAINT unique_company_store_yearmonth
DO UPDATE SET
  total_responses = EXCLUDED.total_responses,
  nps_score = EXCLUDED.nps_score,
  updated_at = NOW();

-- 挿入結果の確認
SELECT company_id, store_id, year_month, total_responses, nps_score
FROM monthly_analytics_summary
ORDER BY year_month;
