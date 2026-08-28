-- ========================================
-- 別店舗用 2026年1月のサンプルデータを挿入
-- 既存データとは異なる店舗のデータを作成
-- ========================================

-- 利用可能な店舗一覧を確認
SELECT s.id as store_id, s.name as store_name, c.id as company_id, c.name as company_name
FROM stores s
JOIN companies c ON s.company_id = c.id;

-- 既存のmonthly_analytics_summaryデータを確認
SELECT company_id, store_id, year_month, total_responses FROM monthly_analytics_summary;

-- 別の店舗にサンプルデータを挿入
-- (company_idとstore_idは上記クエリで確認した値に置き換えてください)
-- 例: INSERT INTO ... VALUES ('your-company-id', 'your-store-id', ...);

-- 動的に別店舗を取得してデータを挿入するクエリ
-- 既存データのstore_id以外の最初の店舗を使用
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
  s.company_id,
  s.id as store_id,
  '2026-01',  -- 2026年1月のデータ

  -- 概要 (店舗2: やや低めのパフォーマンス)
  38,   -- total_responses
  18,   -- nps_score
  30,   -- nps_promoters_percent
  45,   -- nps_passives_percent
  25,   -- nps_detractors_percent
  11,   -- nps_promoters_count
  17,   -- nps_passives_count
  10,   -- nps_detractors_count

  50.00,  -- repeat_rate
  19,     -- repeater_count
  19,     -- new_customer_count

  65.00,  -- repeater_revisit_rate
  12,     -- repeater_revisit_yes_count
  7,      -- repeater_revisit_no_count

  55.00,  -- new_revisit_rate
  10,     -- new_revisit_yes_count
  9,      -- new_revisit_no_count

  -- 12セグメント (店舗2)
  5, 13.16,   -- seg_promoter_revisit_repeater
  4, 10.53,   -- seg_promoter_revisit_new
  1, 2.63,    -- seg_promoter_norevisit_repeater
  1, 2.63,    -- seg_promoter_norevisit_new
  5, 13.16,   -- seg_passive_revisit_repeater
  5, 13.16,   -- seg_passive_revisit_new
  3, 7.89,    -- seg_passive_norevisit_repeater
  4, 10.53,   -- seg_passive_norevisit_new
  2, 5.26,    -- seg_detractor_revisit_repeater
  3, 7.89,    -- seg_detractor_revisit_new
  2, 5.26,    -- seg_detractor_norevisit_repeater
  3, 7.89,    -- seg_detractor_norevisit_new

  19, 50.00,  -- positive_impact
  19, 50.00,  -- negative_impact

  -- QSC総合 (店舗2)
  3.2, 35,    -- quality
  3.4, 36,    -- service
  3.1, 34,    -- cleanliness

  -- Quality項目別 (q1-q10) - 店舗2
  60, 18, 22, 35,  -- q1
  55, 20, 25, 33,  -- q2
  65, 15, 20, 37,  -- q3
  50, 22, 28, 32,  -- q4
  52, 20, 28, 33,  -- q5
  58, 18, 24, 35,  -- q6
  62, 15, 23, 36,  -- q7
  50, 22, 28, 32,  -- q8
  55, 20, 25, 33,  -- q9
  60, 18, 22, 35,  -- q10

  -- Service項目別 (s1-s10) - 店舗2
  65, 15, 20, 36,  -- s1
  62, 18, 20, 35,  -- s2
  68, 12, 20, 38,  -- s3
  60, 18, 22, 35,  -- s4
  55, 20, 25, 33,  -- s5
  62, 15, 23, 36,  -- s6
  65, 15, 20, 36,  -- s7
  60, 18, 22, 35,  -- s8
  58, 20, 22, 34,  -- s9
  62, 18, 20, 35,  -- s10

  -- Cleanliness項目別 (c1-c10) - 店舗2
  58, 18, 24, 34,  -- c1
  55, 20, 25, 33,  -- c2
  62, 15, 23, 36,  -- c3
  58, 18, 24, 34,  -- c4
  65, 15, 20, 36,  -- c5
  60, 18, 22, 35,  -- c6
  52, 22, 26, 32,  -- c7
  58, 20, 22, 34,  -- c8
  60, 18, 22, 35,  -- c9
  55, 20, 25, 33,  -- c10

  -- QSCカテゴリ別集計 - 店舗2
  200, 70, 80,   -- quality
  220, 60, 70,   -- service
  190, 75, 85,   -- cleanliness

  -- 性別分布 - 店舗2
  18, 47,   -- male
  17, 45,   -- female
  3, 8,     -- other

  -- 年齢分布 - 店舗2
  10, 26,   -- 20s
  10, 26,   -- 30s
  10, 26,   -- 40s
  5, 13,    -- 50s
  3, 8,     -- 60plus

  -- 同行者分布 - 店舗2
  8, 21,    -- alone
  10, 26,   -- couple
  10, 26,   -- friends
  6, 16,    -- family
  2, 5,     -- business
  2, 5,     -- other

  -- 顧客重視ポイント - 店舗2
  40, 25, 15, 30, 45,   -- total
  42, 28, 18, 32, 40,   -- repeater
  38, 22, 12, 28, 50    -- new

FROM stores s
WHERE s.id NOT IN (
  SELECT DISTINCT store_id FROM monthly_analytics_summary WHERE year_month = '2026-01'
)
LIMIT 1
ON CONFLICT ON CONSTRAINT unique_company_store_yearmonth
DO UPDATE SET
  total_responses = EXCLUDED.total_responses,
  nps_score = EXCLUDED.nps_score;

-- 挿入結果の確認
SELECT
  mas.company_id,
  mas.store_id,
  s.name as store_name,
  mas.year_month,
  mas.total_responses,
  mas.nps_score
FROM monthly_analytics_summary mas
JOIN stores s ON mas.store_id = s.id
ORDER BY mas.store_id, mas.year_month;
