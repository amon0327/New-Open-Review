-- ============================================================================
-- QSC関連テーブルの削除
-- 
-- 削除対象:
-- 1. company_qsc_monthly_locks - 月次ロックテーブル
-- 2. company_qsc_rotation_settings - ローテーション設定テーブル
-- 3. company_qsc_form_settings - フォーム設定テーブル
-- ============================================================================

-- 1. company_qsc_monthly_locks テーブルの削除
DROP TABLE IF EXISTS public.company_qsc_monthly_locks CASCADE;

-- 2. company_qsc_rotation_settings テーブルの削除
DROP TABLE IF EXISTS public.company_qsc_rotation_settings CASCADE;

-- 3. company_qsc_form_settings テーブルの削除
DROP TABLE IF EXISTS public.company_qsc_form_settings CASCADE;

-- 関連するトリガー関数も削除
DROP FUNCTION IF EXISTS update_qsc_settings_updated_at() CASCADE;

-- ============================================================================
-- review_forms テーブルから qsc_theme カラムを削除（存在する場合）
-- ============================================================================
ALTER TABLE public.review_forms DROP COLUMN IF EXISTS qsc_theme;