-- ========================================
-- コメント本文センチメント分析レイヤ (Phase 1)
-- ----------------------------------------
-- 目的:
--   既存の preset_question_answer_comment.is_positive はアンケートの分岐
--   (ポジ系設問 / ネガ系設問のどちらに答えたか) の記録であって、
--   コメント本文の意味的センチメントではない。
--
--   月次レポート (generate-analytics-ai-text / generate-analytics-insights) で
--   「どの type の人がどの観点で何を不満に思っているか」を正しく拾うため、
--   コメント本文に対する独立したセンチメント・トピック分類レイヤを追加する。
--
-- 制約:
--   - per-response の集計 (update-monthly-analytics) には一切影響させない
--   - UI / フロントエンド非表示 (内部 AI 入力専用)
--   - 月次バッチからのみ書込・読込
-- ========================================

-- ========================================
-- 1. preset_question_answer_comment への列追加
--    (投稿時は 'unclassified' DEFAULT のまま、月次バッチで埋める)
-- ========================================
ALTER TABLE public.preset_question_answer_comment
  ADD COLUMN IF NOT EXISTS text_sentiment text NOT NULL DEFAULT 'unclassified'
    CHECK (text_sentiment IN ('positive', 'negative', 'neutral', 'mixed', 'unclassified')),
  ADD COLUMN IF NOT EXISTS text_sentiment_score numeric(3, 2)
    CHECK (text_sentiment_score IS NULL OR (text_sentiment_score >= -1.00 AND text_sentiment_score <= 1.00)),
  ADD COLUMN IF NOT EXISTS text_topics text[],
  ADD COLUMN IF NOT EXISTS text_is_actionable boolean,
  ADD COLUMN IF NOT EXISTS text_classified_at timestamptz,
  ADD COLUMN IF NOT EXISTS text_classifier_version text;

-- 未分類コメ抽出を高速化 (incremental バッチで使う)
CREATE INDEX IF NOT EXISTS preset_question_answer_comment_unclassified_idx
  ON public.preset_question_answer_comment(text_sentiment)
  WHERE text_sentiment = 'unclassified';

-- バージョン別の再分類対象抽出
CREATE INDEX IF NOT EXISTS preset_question_answer_comment_classifier_version_idx
  ON public.preset_question_answer_comment(text_classifier_version)
  WHERE text_classifier_version IS NOT NULL;

-- トピック検索 (Stage A の cross_type 検出 / Stage C のトピック引き)
CREATE INDEX IF NOT EXISTS preset_question_answer_comment_topics_idx
  ON public.preset_question_answer_comment USING gin (text_topics);

COMMENT ON COLUMN public.preset_question_answer_comment.text_sentiment IS
  'コメント本文の意味的センチメント (LLM分類)。投稿時は unclassified、月次バッチで上書き。is_positive (アンケート分岐) とは別物。';
COMMENT ON COLUMN public.preset_question_answer_comment.text_sentiment_score IS
  '極性×強度の連続値 (-1.00 〜 +1.00)。符号=極性、絶対値=強度。';
COMMENT ON COLUMN public.preset_question_answer_comment.text_topics IS
  '正規化済みトピック配列 (例: ["床","ベタつき"])。';
COMMENT ON COLUMN public.preset_question_answer_comment.text_is_actionable IS
  '具体的内容を含むか。「特になし」等は false で集計から除外。';
COMMENT ON COLUMN public.preset_question_answer_comment.text_classifier_version IS
  '分類器のプロンプト+モデル世代 (例: haiku-4-5_v1)。改訂時に再分類対象を WHERE で抽出。';

-- ========================================
-- 2. monthly_comment_sentiment_by_type
--    type 別 (12分類) の月次コメントセンチメント集計
-- ========================================
CREATE TABLE IF NOT EXISTS public.monthly_comment_sentiment_by_type (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  store_id uuid NOT NULL,
  year_month text NOT NULL,
  type smallint NOT NULL CHECK (type BETWEEN 1 AND 12),

  total_comments int NOT NULL DEFAULT 0,
  actionable_count int NOT NULL DEFAULT 0,
  positive_count int NOT NULL DEFAULT 0,
  negative_count int NOT NULL DEFAULT 0,
  neutral_count int NOT NULL DEFAULT 0,
  mixed_count int NOT NULL DEFAULT 0,
  avg_sentiment_score numeric(4, 3),

  -- selected_qsc × sentiment クロス
  quality_negative_count int NOT NULL DEFAULT 0,
  service_negative_count int NOT NULL DEFAULT 0,
  cleanliness_negative_count int NOT NULL DEFAULT 0,
  quality_positive_count int NOT NULL DEFAULT 0,
  service_positive_count int NOT NULL DEFAULT 0,
  cleanliness_positive_count int NOT NULL DEFAULT 0,

  -- 上位トピック
  -- 形式: [{topic:"床", count:8, avg_score:-0.6, sample_comment_ids:[uuid,uuid,uuid]}]
  top_negative_topics jsonb,
  top_positive_topics jsonb,

  generated_at timestamptz NOT NULL DEFAULT now(),
  classifier_version text,

  UNIQUE (company_id, store_id, year_month, type)
);

CREATE INDEX IF NOT EXISTS mcsbt_store_month_idx
  ON public.monthly_comment_sentiment_by_type(store_id, year_month);
CREATE INDEX IF NOT EXISTS mcsbt_company_month_idx
  ON public.monthly_comment_sentiment_by_type(company_id, year_month);

ALTER TABLE public.monthly_comment_sentiment_by_type ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_all ON public.monthly_comment_sentiment_by_type;
CREATE POLICY service_role_all ON public.monthly_comment_sentiment_by_type
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.monthly_comment_sentiment_by_type IS
  '月次バッチで生成する 12type × store × month 別のコメントセンチメント集計。Stage A/C の入力専用。';

-- ========================================
-- 3. monthly_comment_sentiment_summary
--    店舗横断 (type を跨ぐ) の月次コメントセンチメント集計
-- ========================================
CREATE TABLE IF NOT EXISTS public.monthly_comment_sentiment_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  store_id uuid NOT NULL,
  year_month text NOT NULL,

  total_comments int NOT NULL DEFAULT 0,
  actionable_count int NOT NULL DEFAULT 0,
  positive_count int NOT NULL DEFAULT 0,
  negative_count int NOT NULL DEFAULT 0,
  neutral_count int NOT NULL DEFAULT 0,
  mixed_count int NOT NULL DEFAULT 0,
  avg_sentiment_score numeric(4, 3),

  -- 横断テーマ検出の主データ
  -- 形式: [{topic:"床", total:12, type_count:4, type_distribution:{"1":5,"3":3,"11":4}, sample_comment_ids:[...]}]
  cross_type_negative_themes jsonb,
  cross_type_positive_themes jsonb,

  generated_at timestamptz NOT NULL DEFAULT now(),
  classifier_version text,

  UNIQUE (company_id, store_id, year_month)
);

CREATE INDEX IF NOT EXISTS mcss_store_month_idx
  ON public.monthly_comment_sentiment_summary(store_id, year_month);

ALTER TABLE public.monthly_comment_sentiment_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_all ON public.monthly_comment_sentiment_summary;
CREATE POLICY service_role_all ON public.monthly_comment_sentiment_summary
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.monthly_comment_sentiment_summary IS
  '月次バッチで生成する店舗横断 (type 跨ぎ) のセンチメント集計。Stage A の cross_type_theme 検出に使用。';

-- ========================================
-- 4. comment_classification_runs
--    分類バッチの実行履歴 (監査・再実行・品質追跡)
-- ========================================
CREATE TABLE IF NOT EXISTS public.comment_classification_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type text NOT NULL CHECK (run_type IN ('incremental', 'backfill', 'reclassify_version')),
  target_year_month text,
  store_ids uuid[],
  classifier_version text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  candidate_count int,
  classified_count int,
  failed_count int,
  error_sample jsonb,
  triggered_by text,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS ccr_started_at_idx
  ON public.comment_classification_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS ccr_year_month_idx
  ON public.comment_classification_runs(target_year_month);

ALTER TABLE public.comment_classification_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_all ON public.comment_classification_runs;
CREATE POLICY service_role_all ON public.comment_classification_runs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.comment_classification_runs IS
  'classify-comment-sentiment Edge Function の実行履歴。';

-- ========================================
-- 5. sentiment_aggregation_runs
--    集計バッチの実行履歴
-- ========================================
CREATE TABLE IF NOT EXISTS public.sentiment_aggregation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_year_month text,
  store_ids uuid[],
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  store_count int,
  type_rows_written int,
  summary_rows_written int,
  error_sample jsonb,
  triggered_by text,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS sar_started_at_idx
  ON public.sentiment_aggregation_runs(started_at DESC);

ALTER TABLE public.sentiment_aggregation_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_all ON public.sentiment_aggregation_runs;
CREATE POLICY service_role_all ON public.sentiment_aggregation_runs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.sentiment_aggregation_runs IS
  'aggregate-comment-sentiment Edge Function の実行履歴。';
