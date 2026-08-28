-- ============================================================================
-- 共有質問の設計修正
--
-- 目的: 質問をフォーム間で共有する際、新しいreview_questionsレコードを作成せず、
-- 既存の質問IDとフォーム/ページの関係性を中間テーブルで管理する
--
-- 変更内容:
-- 1. 不要なテーブルを削除 (shared_questions, shared_question_option_choices, shared_question_option_linear_scale)
-- 2. review_questionsからshared_question_idカラムを削除
-- 3. review_question_form_links 中間テーブルを作成（質問とフォーム/ページの紐付け）
-- ============================================================================

-- ============================================================================
-- 1. review_questionsからshared_question_idの外部キー制約とカラムを先に削除
-- ============================================================================

-- 外部キー制約を削除
ALTER TABLE public.review_questions
DROP CONSTRAINT IF EXISTS review_questions_shared_question_id_fkey;

-- インデックスを削除
DROP INDEX IF EXISTS idx_review_questions_shared_question_id;

-- カラムを削除
ALTER TABLE public.review_questions
DROP COLUMN IF EXISTS shared_question_id;

-- ============================================================================
-- 2. 不要なテーブルを削除
-- ============================================================================

-- RLSポリシーを先に削除
DROP POLICY IF EXISTS "shared_question_option_linear_scale_select_policy" ON public.shared_question_option_linear_scale;
DROP POLICY IF EXISTS "shared_question_option_linear_scale_insert_policy" ON public.shared_question_option_linear_scale;
DROP POLICY IF EXISTS "shared_question_option_linear_scale_update_policy" ON public.shared_question_option_linear_scale;
DROP POLICY IF EXISTS "shared_question_option_linear_scale_delete_policy" ON public.shared_question_option_linear_scale;

DROP POLICY IF EXISTS "shared_question_option_choices_select_policy" ON public.shared_question_option_choices;
DROP POLICY IF EXISTS "shared_question_option_choices_insert_policy" ON public.shared_question_option_choices;
DROP POLICY IF EXISTS "shared_question_option_choices_update_policy" ON public.shared_question_option_choices;
DROP POLICY IF EXISTS "shared_question_option_choices_delete_policy" ON public.shared_question_option_choices;

DROP POLICY IF EXISTS "shared_questions_select_policy" ON public.shared_questions;
DROP POLICY IF EXISTS "shared_questions_insert_policy" ON public.shared_questions;
DROP POLICY IF EXISTS "shared_questions_update_policy" ON public.shared_questions;
DROP POLICY IF EXISTS "shared_questions_delete_policy" ON public.shared_questions;

-- トリガーを削除
DROP TRIGGER IF EXISTS shared_questions_updated_at_trigger ON public.shared_questions;
DROP FUNCTION IF EXISTS update_shared_questions_updated_at();

-- テーブルを削除（依存関係の順序で）
DROP TABLE IF EXISTS public.shared_question_option_linear_scale;
DROP TABLE IF EXISTS public.shared_question_option_choices;
DROP TABLE IF EXISTS public.shared_questions;

-- ============================================================================
-- 3. review_question_form_links 中間テーブルを作成
--    （質問とフォーム/ページの紐付けを管理）
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.review_question_form_links (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- 質問への参照（review_questionsの元となる質問ID）
    review_question_id UUID NOT NULL,

    -- フォームとページへの参照
    review_form_id UUID NOT NULL,
    review_form_pages_id UUID NOT NULL,

    -- 表示順序
    question_number BIGINT NOT NULL DEFAULT 1,

    -- このリンク固有の設定（必要に応じてオーバーライド）
    is_required BOOLEAN NULL,  -- NULLの場合は元の質問の設定を使用

    -- 制約
    CONSTRAINT review_question_form_links_pkey PRIMARY KEY (id),
    CONSTRAINT review_question_form_links_review_question_id_fkey
        FOREIGN KEY (review_question_id) REFERENCES review_questions (id) ON DELETE CASCADE,
    CONSTRAINT review_question_form_links_review_form_id_fkey
        FOREIGN KEY (review_form_id) REFERENCES review_forms (id) ON DELETE CASCADE,
    CONSTRAINT review_question_form_links_review_form_pages_id_fkey
        FOREIGN KEY (review_form_pages_id) REFERENCES review_form_pages (id) ON DELETE CASCADE,
    -- 同じフォームの同じページに同じ質問は1回だけ
    CONSTRAINT review_question_form_links_unique
        UNIQUE (review_question_id, review_form_id, review_form_pages_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_review_question_form_links_review_question_id
    ON public.review_question_form_links (review_question_id);
CREATE INDEX IF NOT EXISTS idx_review_question_form_links_review_form_id
    ON public.review_question_form_links (review_form_id);
CREATE INDEX IF NOT EXISTS idx_review_question_form_links_review_form_pages_id
    ON public.review_question_form_links (review_form_pages_id);

-- コメント
COMMENT ON TABLE public.review_question_form_links IS '質問とフォーム/ページの紐付けを管理する中間テーブル。同じ質問を複数のフォームで共有可能にする。';
COMMENT ON COLUMN public.review_question_form_links.review_question_id IS '元となる質問のID';
COMMENT ON COLUMN public.review_question_form_links.review_form_id IS '紐付けるフォームのID';
COMMENT ON COLUMN public.review_question_form_links.review_form_pages_id IS '紐付けるページのID';
COMMENT ON COLUMN public.review_question_form_links.question_number IS 'このフォーム内での質問の表示順序';
COMMENT ON COLUMN public.review_question_form_links.is_required IS 'このリンクでの必須設定（NULLなら元の質問設定を使用）';

-- ============================================================================
-- 4. RLS ポリシー（Row Level Security）
-- ============================================================================

ALTER TABLE public.review_question_form_links ENABLE ROW LEVEL SECURITY;

-- SELECT: 元の質問またはフォームにアクセスできるユーザーが参照可能
CREATE POLICY "review_question_form_links_select_policy" ON public.review_question_form_links
    FOR SELECT
    USING (
        -- フォームへのアクセス権があるユーザー
        review_form_id IN (
            SELECT rf.id FROM review_forms rf
            JOIN company_memberships cm ON cm.company_id = rf.company_id
            WHERE cm.business_user_id = auth.uid()
        )
        OR
        -- パートナーとしてアクセスできるフォーム
        review_form_id IN (
            SELECT rf.id FROM review_forms rf
            JOIN partner_affiliate_companies pac ON pac.companies_id = rf.company_id
            JOIN partner_memberships pm ON pm.partner_company_id = pac.partner_company_id
            WHERE pm.business_users_id = auth.uid()
        )
    );

-- INSERT: フォームへのアクセス権があるユーザーが作成可能
CREATE POLICY "review_question_form_links_insert_policy" ON public.review_question_form_links
    FOR INSERT
    WITH CHECK (
        review_form_id IN (
            SELECT rf.id FROM review_forms rf
            JOIN company_memberships cm ON cm.company_id = rf.company_id
            WHERE cm.business_user_id = auth.uid()
        )
    );

-- UPDATE: フォームへのアクセス権があるユーザーが更新可能
CREATE POLICY "review_question_form_links_update_policy" ON public.review_question_form_links
    FOR UPDATE
    USING (
        review_form_id IN (
            SELECT rf.id FROM review_forms rf
            JOIN company_memberships cm ON cm.company_id = rf.company_id
            WHERE cm.business_user_id = auth.uid()
        )
    );

-- DELETE: フォームへのアクセス権があるユーザーが削除可能
CREATE POLICY "review_question_form_links_delete_policy" ON public.review_question_form_links
    FOR DELETE
    USING (
        review_form_id IN (
            SELECT rf.id FROM review_forms rf
            JOIN company_memberships cm ON cm.company_id = rf.company_id
            WHERE cm.business_user_id = auth.uid()
        )
    );
