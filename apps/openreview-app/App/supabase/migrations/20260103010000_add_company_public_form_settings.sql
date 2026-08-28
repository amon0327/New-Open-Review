-- ============================================================================
-- 会社の公開フォーム設定テーブル
-- 会社ごとに店舗URLで公開するレビューフォームを設定
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_public_form_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- 会社に紐付け
    company_id UUID NOT NULL,

    -- 公開するレビューフォームID
    public_form_id UUID NOT NULL,

    -- 制約
    CONSTRAINT company_public_form_settings_pkey PRIMARY KEY (id),
    CONSTRAINT company_public_form_settings_company_id_fkey
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    CONSTRAINT company_public_form_settings_public_form_id_fkey
        FOREIGN KEY (public_form_id) REFERENCES review_forms (id) ON DELETE CASCADE,
    -- 1会社につき1レコード
    CONSTRAINT company_public_form_settings_company_unique UNIQUE (company_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_company_public_form_settings_company_id
    ON public.company_public_form_settings (company_id);

-- コメント
COMMENT ON TABLE public.company_public_form_settings IS '会社ごとの公開フォーム設定（店舗URLで公開するレビューフォーム）';
COMMENT ON COLUMN public.company_public_form_settings.public_form_id IS '公開するレビューフォームID';

-- ============================================================================
-- RLS ポリシー（Row Level Security）
-- ============================================================================

ALTER TABLE public.company_public_form_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_public_form_settings_select_policy" ON public.company_public_form_settings
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
        OR
        company_id IN (
            SELECT pac.companies_id
            FROM partner_affiliate_companies pac
            JOIN partner_memberships pm ON pm.partner_company_id = pac.partner_company_id
            WHERE pm.business_users_id = auth.uid()
        )
    );

CREATE POLICY "company_public_form_settings_insert_policy" ON public.company_public_form_settings
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
    );

CREATE POLICY "company_public_form_settings_update_policy" ON public.company_public_form_settings
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
    );

CREATE POLICY "company_public_form_settings_delete_policy" ON public.company_public_form_settings
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
    );

-- ============================================================================
-- updated_at を自動更新するトリガー
-- ============================================================================

CREATE OR REPLACE FUNCTION update_company_public_form_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_public_form_settings_updated_at_trigger
    BEFORE UPDATE ON public.company_public_form_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_company_public_form_settings_updated_at();