-- ========================================
-- monthly_analytics_issue に AI 分析メタデータカラムを追加
-- ========================================
-- 3段階パイプライン化により AI が出力するようになった
-- メタ情報を DB にも保存することで、
-- - 比較軸別の傾向分析
-- - 慢性課題の追跡
-- - 信頼度に応じた表示制御
-- が可能になる。

ALTER TABLE public.monthly_analytics_issue
  ADD COLUMN IF NOT EXISTS comparison_axis text,
  ADD COLUMN IF NOT EXISTS chronic boolean,
  ADD COLUMN IF NOT EXISTS confidence numeric(4,3),
  ADD COLUMN IF NOT EXISTS evidence_count integer;

-- 比較軸の取りうる値を制約 (NULL も許容)
ALTER TABLE public.monthly_analytics_issue
  DROP CONSTRAINT IF EXISTS monthly_analytics_issue_comparison_axis_check;

ALTER TABLE public.monthly_analytics_issue
  ADD CONSTRAINT monthly_analytics_issue_comparison_axis_check
  CHECK (comparison_axis IS NULL OR comparison_axis IN (
    'month_vs_month',
    'segment_vs_overall',
    'segment_vs_segment',
    'qsc_item_relative'
  ));

-- 信頼度は 0〜1
ALTER TABLE public.monthly_analytics_issue
  DROP CONSTRAINT IF EXISTS monthly_analytics_issue_confidence_check;

ALTER TABLE public.monthly_analytics_issue
  ADD CONSTRAINT monthly_analytics_issue_confidence_check
  CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1));

-- 慢性課題の絞り込み用
CREATE INDEX IF NOT EXISTS monthly_analytics_issue_chronic_idx
  ON public.monthly_analytics_issue(company_id, store_id, chronic)
  WHERE chronic = true;

COMMENT ON COLUMN public.monthly_analytics_issue.comparison_axis
  IS 'AI が選択した比較軸: month_vs_month / segment_vs_overall / segment_vs_segment / qsc_item_relative';
COMMENT ON COLUMN public.monthly_analytics_issue.chronic
  IS '3ヶ月以上続いている慢性課題かどうか';
COMMENT ON COLUMN public.monthly_analytics_issue.confidence
  IS 'AI が自己評価したインサイトの信頼度 0.0-1.0 (0.7 以上のみ保存される)';
COMMENT ON COLUMN public.monthly_analytics_issue.evidence_count
  IS '根拠となる回答件数 (3 以上のみ保存される)';
