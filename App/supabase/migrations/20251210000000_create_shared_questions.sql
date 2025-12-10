-- ============================================================================
-- 共有質問機能のためのテーブル作成
--
-- 目的: 同じ質問を複数のフォームで共有し、回答データを質問IDで集計可能にする
--
-- 設計:
-- - shared_questions: 会社単位で質問マスターを管理
-- - shared_question_option_choices: 共有質問の選択肢
-- - shared_question_option_linear_scale: 共有質問のスケール設定
-- - review_questions.shared_question_id: 共有質問への参照（既存テーブルに追加）
-- ============================================================================

-- ============================================================================
-- 1. shared_questions テーブル（共有質問マスター）
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shared_questions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- 会社に紐付け（同じ会社内で質問を共有）
    company_id UUID NOT NULL,

    -- 質問の内容
    question_text TEXT NOT NULL DEFAULT '',
    question_detail_text TEXT NULL,
    question_types_id BIGINT NOT NULL,

    -- 設定
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    is_detail_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    -- 作成者
    created_by UUID NULL,

    -- 制約
    CONSTRAINT shared_questions_pkey PRIMARY KEY (id),
    CONSTRAINT shared_questions_company_id_fkey FOREIGN KEY (company_id)
        REFERENCES companies (id) ON DELETE CASCADE,
    CONSTRAINT shared_questions_question_types_id_fkey FOREIGN KEY (question_types_id)
        REFERENCES question_types (id),
    CONSTRAINT shared_questions_created_by_fkey FOREIGN KEY (created_by)
        REFERENCES auth.users (id) ON DELETE SET NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_shared_questions_company_id ON public.shared_questions (company_id);
CREATE INDEX IF NOT EXISTS idx_shared_questions_question_types_id ON public.shared_questions (question_types_id);

-- コメント
COMMENT ON TABLE public.shared_questions IS '共有質問マスター - 会社単位で質問を共有し、複数のフォームで使用可能';
COMMENT ON COLUMN public.shared_questions.company_id IS '所属する会社のID';
COMMENT ON COLUMN public.shared_questions.question_text IS '質問テキスト';
COMMENT ON COLUMN public.shared_questions.question_detail_text IS '質問の詳細説明';

-- ============================================================================
-- 2. shared_question_option_choices テーブル（共有質問の選択肢）
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shared_question_option_choices (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- 共有質問に紐付け
    shared_question_id UUID NOT NULL,

    -- 選択肢の内容
    choice_name TEXT NOT NULL DEFAULT '',
    choice_number BIGINT NOT NULL DEFAULT 1,

    -- 制約
    CONSTRAINT shared_question_option_choices_pkey PRIMARY KEY (id),
    CONSTRAINT shared_question_option_choices_shared_question_id_fkey FOREIGN KEY (shared_question_id)
        REFERENCES shared_questions (id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_shared_question_option_choices_shared_question_id
    ON public.shared_question_option_choices (shared_question_id);

-- コメント
COMMENT ON TABLE public.shared_question_option_choices IS '共有質問の選択肢';

-- ============================================================================
-- 3. shared_question_option_linear_scale テーブル（共有質問のスケール設定）
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shared_question_option_linear_scale (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- 共有質問に紐付け
    shared_question_id UUID NOT NULL,

    -- スケール設定
    min_text TEXT NULL DEFAULT '',
    max_text TEXT NULL DEFAULT '',
    loyalty_score_flags BOOLEAN NULL DEFAULT FALSE,

    -- 制約
    CONSTRAINT shared_question_option_linear_scale_pkey PRIMARY KEY (id),
    CONSTRAINT shared_question_option_linear_scale_shared_question_id_fkey FOREIGN KEY (shared_question_id)
        REFERENCES shared_questions (id) ON DELETE CASCADE,
    CONSTRAINT shared_question_option_linear_scale_unique UNIQUE (shared_question_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_shared_question_option_linear_scale_shared_question_id
    ON public.shared_question_option_linear_scale (shared_question_id);

-- コメント
COMMENT ON TABLE public.shared_question_option_linear_scale IS '共有質問のリニアスケール設定';

-- ============================================================================
-- 4. review_questions テーブルに shared_question_id カラムを追加
-- ============================================================================
ALTER TABLE public.review_questions
ADD COLUMN IF NOT EXISTS shared_question_id UUID NULL;

-- 外部キー制約を追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'review_questions_shared_question_id_fkey'
    ) THEN
        ALTER TABLE public.review_questions
        ADD CONSTRAINT review_questions_shared_question_id_fkey
        FOREIGN KEY (shared_question_id) REFERENCES shared_questions (id) ON DELETE SET NULL;
    END IF;
END $$;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_review_questions_shared_question_id
    ON public.review_questions (shared_question_id);

-- コメント
COMMENT ON COLUMN public.review_questions.shared_question_id IS '共有質問への参照（設定されている場合、この質問は共有質問から作成された）';

-- ============================================================================
-- 5. RLS ポリシー（Row Level Security）
-- ============================================================================

-- shared_questions の RLS を有効化
ALTER TABLE public.shared_questions ENABLE ROW LEVEL SECURITY;

-- SELECT: 同じ会社のメンバーまたはパートナーが参照可能
CREATE POLICY "shared_questions_select_policy" ON public.shared_questions
    FOR SELECT
    USING (
        -- 直接所属している会社
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
        OR
        -- パートナーとしてアクセスできる会社
        company_id IN (
            SELECT pac.companies_id
            FROM partner_affiliate_companies pac
            JOIN partner_memberships pm ON pm.partner_company_id = pac.partner_company_id
            WHERE pm.business_users_id = auth.uid()
        )
    );

-- INSERT: 同じ会社のメンバーが作成可能
CREATE POLICY "shared_questions_insert_policy" ON public.shared_questions
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
    );

-- UPDATE: 同じ会社のメンバーが更新可能
CREATE POLICY "shared_questions_update_policy" ON public.shared_questions
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
    );

-- DELETE: 同じ会社のメンバーが削除可能
CREATE POLICY "shared_questions_delete_policy" ON public.shared_questions
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
    );

-- shared_question_option_choices の RLS を有効化
ALTER TABLE public.shared_question_option_choices ENABLE ROW LEVEL SECURITY;

-- SELECT: 親の shared_questions にアクセスできるユーザーが参照可能
CREATE POLICY "shared_question_option_choices_select_policy" ON public.shared_question_option_choices
    FOR SELECT
    USING (
        shared_question_id IN (
            SELECT id FROM shared_questions
        )
    );

-- INSERT: 親の shared_questions にアクセスできるユーザーが作成可能
CREATE POLICY "shared_question_option_choices_insert_policy" ON public.shared_question_option_choices
    FOR INSERT
    WITH CHECK (
        shared_question_id IN (
            SELECT id FROM shared_questions sq
            WHERE sq.company_id IN (
                SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
            )
        )
    );

-- UPDATE: 親の shared_questions にアクセスできるユーザーが更新可能
CREATE POLICY "shared_question_option_choices_update_policy" ON public.shared_question_option_choices
    FOR UPDATE
    USING (
        shared_question_id IN (
            SELECT id FROM shared_questions sq
            WHERE sq.company_id IN (
                SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
            )
        )
    );

-- DELETE: 親の shared_questions にアクセスできるユーザーが削除可能
CREATE POLICY "shared_question_option_choices_delete_policy" ON public.shared_question_option_choices
    FOR DELETE
    USING (
        shared_question_id IN (
            SELECT id FROM shared_questions sq
            WHERE sq.company_id IN (
                SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
            )
        )
    );

-- shared_question_option_linear_scale の RLS を有効化
ALTER TABLE public.shared_question_option_linear_scale ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "shared_question_option_linear_scale_select_policy" ON public.shared_question_option_linear_scale
    FOR SELECT
    USING (
        shared_question_id IN (
            SELECT id FROM shared_questions
        )
    );

-- INSERT
CREATE POLICY "shared_question_option_linear_scale_insert_policy" ON public.shared_question_option_linear_scale
    FOR INSERT
    WITH CHECK (
        shared_question_id IN (
            SELECT id FROM shared_questions sq
            WHERE sq.company_id IN (
                SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
            )
        )
    );

-- UPDATE
CREATE POLICY "shared_question_option_linear_scale_update_policy" ON public.shared_question_option_linear_scale
    FOR UPDATE
    USING (
        shared_question_id IN (
            SELECT id FROM shared_questions sq
            WHERE sq.company_id IN (
                SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
            )
        )
    );

-- DELETE
CREATE POLICY "shared_question_option_linear_scale_delete_policy" ON public.shared_question_option_linear_scale
    FOR DELETE
    USING (
        shared_question_id IN (
            SELECT id FROM shared_questions sq
            WHERE sq.company_id IN (
                SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
            )
        )
    );

-- ============================================================================
-- 6. updated_at を自動更新するトリガー
-- ============================================================================
CREATE OR REPLACE FUNCTION update_shared_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shared_questions_updated_at_trigger ON public.shared_questions;
CREATE TRIGGER shared_questions_updated_at_trigger
    BEFORE UPDATE ON public.shared_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_shared_questions_updated_at();
