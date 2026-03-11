-- companiesテーブルにレポート自動公開設定カラムを追加
-- true = 新レポート生成時に自動公開（default ON）
-- false = 手動公開（default OFF、現状維持）

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS auto_publish_reports BOOLEAN NOT NULL DEFAULT false;
