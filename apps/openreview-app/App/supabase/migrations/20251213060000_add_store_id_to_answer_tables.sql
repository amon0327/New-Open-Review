-- 回答関連テーブルに店舗IDカラムを追加
-- これにより、どの店舗からの回答かを各回答レベルで追跡可能

-- 1. review_question_answers テーブルに store_id を追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'review_question_answers'
        AND column_name = 'store_id'
    ) THEN
        ALTER TABLE public.review_question_answers
        ADD COLUMN store_id uuid REFERENCES public.stores(id);

        COMMENT ON COLUMN public.review_question_answers.store_id IS '回答が行われた店舗のID';
    END IF;
END $$;

-- 2. question_answer_texts テーブルに store_id を追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'question_answer_texts'
        AND column_name = 'store_id'
    ) THEN
        ALTER TABLE public.question_answer_texts
        ADD COLUMN store_id uuid REFERENCES public.stores(id);

        COMMENT ON COLUMN public.question_answer_texts.store_id IS '回答が行われた店舗のID';
    END IF;
END $$;

-- 3. question_answer_option_choices テーブルに store_id を追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'question_answer_option_choices'
        AND column_name = 'store_id'
    ) THEN
        ALTER TABLE public.question_answer_option_choices
        ADD COLUMN store_id uuid REFERENCES public.stores(id);

        COMMENT ON COLUMN public.question_answer_option_choices.store_id IS '回答が行われた店舗のID';
    END IF;
END $$;

-- 4. question_answer_option_linear_scale テーブルに store_id を追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'question_answer_option_linear_scale'
        AND column_name = 'store_id'
    ) THEN
        ALTER TABLE public.question_answer_option_linear_scale
        ADD COLUMN store_id uuid REFERENCES public.stores(id);

        COMMENT ON COLUMN public.question_answer_option_linear_scale.store_id IS '回答が行われた店舗のID';
    END IF;
END $$;

-- インデックス追加（店舗別の回答検索を高速化）
CREATE INDEX IF NOT EXISTS idx_review_question_answers_store_id
ON public.review_question_answers(store_id);

CREATE INDEX IF NOT EXISTS idx_question_answer_texts_store_id
ON public.question_answer_texts(store_id);

CREATE INDEX IF NOT EXISTS idx_question_answer_option_choices_store_id
ON public.question_answer_option_choices(store_id);

CREATE INDEX IF NOT EXISTS idx_question_answer_option_linear_scale_store_id
ON public.question_answer_option_linear_scale(store_id);
