-- companiesテーブルに非アクティブ化スケジュール用カラムを追加
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS deactivation_scheduled_at TIMESTAMPTZ DEFAULT NULL;

-- cronクエリ高速化用パーシャルインデックス
CREATE INDEX IF NOT EXISTS idx_companies_deactivation_scheduled
ON companies (deactivation_scheduled_at)
WHERE deactivation_scheduled_at IS NOT NULL;

COMMENT ON COLUMN companies.deactivation_scheduled_at IS '非アクティブ化予定日時。NULLでない場合、cronジョブによりこの日時以降に自動で非アクティブ化される';
