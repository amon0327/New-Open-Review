-- completion_screen_settingsテーブルにユニーク制約を追加
-- 一つのフォームに対して一つの完了画面設定のみ許可

ALTER TABLE public.completion_screen_settings 
ADD CONSTRAINT completion_screen_settings_review_forms_id_unique 
UNIQUE (review_forms_id);