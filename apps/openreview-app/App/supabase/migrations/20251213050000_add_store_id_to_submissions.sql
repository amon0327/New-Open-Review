-- 回答（submission）に店舗IDを記録するためのカラム追加
-- これにより、どの店舗からの回答かを正確に追跡可能

-- review_form_submissions テーブルに store_id カラムを追加（存在しない場合のみ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'review_form_submissions'
        AND column_name = 'store_id'
    ) THEN
        ALTER TABLE public.review_form_submissions
        ADD COLUMN store_id uuid REFERENCES public.stores(id);

        COMMENT ON COLUMN public.review_form_submissions.store_id IS '回答が行われた店舗のID（店舗URLからアクセスした場合）';
    END IF;
END $$;

-- store_id にインデックスを追加（クエリパフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_review_form_submissions_store_id
ON public.review_form_submissions(store_id);

-- 複合インデックス：店舗別・フォーム別の回答検索用
CREATE INDEX IF NOT EXISTS idx_review_form_submissions_store_form
ON public.review_form_submissions(store_id, review_forms_id);
