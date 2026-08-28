-- ============================================================================
-- QSCローテーション機能のためのテーブル作成
--
-- 目的:
-- 1. 会社ごとにQ/S/Cそれぞれに紐づくレビューフォームを設定
-- 2. QSCのローテーション順序（どの月グループにどのQSCを割り当てるか）を設定
-- 3. 今月使用中の設定をロック（回答があった場合、変更は来月から適用）
--
-- テーブル:
-- - company_qsc_form_settings: 会社ごとのQSCフォーム設定
-- - company_qsc_rotation_settings: 会社ごとのQSCローテーション順序設定
-- - company_qsc_monthly_locks: 今月使用中の設定ロック（回答があった月の設定を保持）
-- ============================================================================

-- ============================================================================
-- 1. company_qsc_form_settings テーブル
--    会社ごとにQ/S/Cそれぞれに紐づくレビューフォームを設定
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_qsc_form_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- 会社に紐付け
    company_id UUID NOT NULL,

    -- Q/S/C それぞれに紐づくレビューフォームID
    quality_form_id UUID NULL,      -- Qualityフォーム
    service_form_id UUID NULL,      -- Serviceフォーム
    cleanliness_form_id UUID NULL,  -- Cleanlinessフォーム

    -- 制約
    CONSTRAINT company_qsc_form_settings_pkey PRIMARY KEY (id),
    CONSTRAINT company_qsc_form_settings_company_id_fkey
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    CONSTRAINT company_qsc_form_settings_quality_form_id_fkey
        FOREIGN KEY (quality_form_id) REFERENCES review_forms (id) ON DELETE SET NULL,
    CONSTRAINT company_qsc_form_settings_service_form_id_fkey
        FOREIGN KEY (service_form_id) REFERENCES review_forms (id) ON DELETE SET NULL,
    CONSTRAINT company_qsc_form_settings_cleanliness_form_id_fkey
        FOREIGN KEY (cleanliness_form_id) REFERENCES review_forms (id) ON DELETE SET NULL,
    -- 1会社につき1レコード
    CONSTRAINT company_qsc_form_settings_company_unique UNIQUE (company_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_company_qsc_form_settings_company_id
    ON public.company_qsc_form_settings (company_id);

-- コメント
COMMENT ON TABLE public.company_qsc_form_settings IS '会社ごとのQSCフォーム設定（Q/S/Cそれぞれに紐づくレビューフォーム）';
COMMENT ON COLUMN public.company_qsc_form_settings.quality_form_id IS 'Quality（品質）評価に使用するレビューフォームID';
COMMENT ON COLUMN public.company_qsc_form_settings.service_form_id IS 'Service（サービス）評価に使用するレビューフォームID';
COMMENT ON COLUMN public.company_qsc_form_settings.cleanliness_form_id IS 'Cleanliness（清潔度）評価に使用するレビューフォームID';

-- ============================================================================
-- 2. company_qsc_rotation_settings テーブル
--    会社ごとのQSCローテーション順序設定
--    どの月グループ(1,4,7,10月 / 2,5,8,11月 / 3,6,9,12月)にどのQSCを割り当てるか
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_qsc_rotation_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- 会社に紐付け
    company_id UUID NOT NULL,

    -- 月グループごとのQSC割り当て
    -- groupA: 1,4,7,10月、groupB: 2,5,8,11月、groupC: 3,6,9,12月
    group_a_type TEXT NOT NULL DEFAULT 'Quality' CHECK (group_a_type IN ('Quality', 'Service', 'Cleanliness')),
    group_b_type TEXT NOT NULL DEFAULT 'Service' CHECK (group_b_type IN ('Quality', 'Service', 'Cleanliness')),
    group_c_type TEXT NOT NULL DEFAULT 'Cleanliness' CHECK (group_c_type IN ('Quality', 'Service', 'Cleanliness')),

    -- 制約
    CONSTRAINT company_qsc_rotation_settings_pkey PRIMARY KEY (id),
    CONSTRAINT company_qsc_rotation_settings_company_id_fkey
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    -- 1会社につき1レコード
    CONSTRAINT company_qsc_rotation_settings_company_unique UNIQUE (company_id),
    -- 各グループには異なるQSCタイプが割り当てられる必要がある
    CONSTRAINT company_qsc_rotation_settings_unique_types
        CHECK (group_a_type != group_b_type AND group_b_type != group_c_type AND group_a_type != group_c_type)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_company_qsc_rotation_settings_company_id
    ON public.company_qsc_rotation_settings (company_id);

-- コメント
COMMENT ON TABLE public.company_qsc_rotation_settings IS '会社ごとのQSCローテーション順序設定';
COMMENT ON COLUMN public.company_qsc_rotation_settings.group_a_type IS '1,4,7,10月に実施するQSCタイプ';
COMMENT ON COLUMN public.company_qsc_rotation_settings.group_b_type IS '2,5,8,11月に実施するQSCタイプ';
COMMENT ON COLUMN public.company_qsc_rotation_settings.group_c_type IS '3,6,9,12月に実施するQSCタイプ';

-- ============================================================================
-- 3. company_qsc_monthly_locks テーブル
--    今月使用中の設定ロック（回答があった月の設定を保持）
--    回答アプリで回答があった時点でこのテーブルに書き込み、
--    その月は設定変更しても来月から適用となる
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_qsc_monthly_locks (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- 会社に紐付け
    company_id UUID NOT NULL,

    -- 対象年月（YYYY-MM形式で管理）
    target_year INTEGER NOT NULL,
    target_month INTEGER NOT NULL CHECK (target_month >= 1 AND target_month <= 12),

    -- ロック時点でのQSCタイプ（この月に実際に使用されているタイプ）
    locked_qsc_type TEXT NOT NULL CHECK (locked_qsc_type IN ('Quality', 'Service', 'Cleanliness')),

    -- ロック時点で使用されているレビューフォームID
    locked_form_id UUID NOT NULL,

    -- ロック時点でのローテーション設定（スナップショット）
    locked_group_a_type TEXT NOT NULL CHECK (locked_group_a_type IN ('Quality', 'Service', 'Cleanliness')),
    locked_group_b_type TEXT NOT NULL CHECK (locked_group_b_type IN ('Quality', 'Service', 'Cleanliness')),
    locked_group_c_type TEXT NOT NULL CHECK (locked_group_c_type IN ('Quality', 'Service', 'Cleanliness')),

    -- 制約
    CONSTRAINT company_qsc_monthly_locks_pkey PRIMARY KEY (id),
    CONSTRAINT company_qsc_monthly_locks_company_id_fkey
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    CONSTRAINT company_qsc_monthly_locks_locked_form_id_fkey
        FOREIGN KEY (locked_form_id) REFERENCES review_forms (id) ON DELETE CASCADE,
    -- 同じ会社の同じ年月には1レコードのみ
    CONSTRAINT company_qsc_monthly_locks_unique UNIQUE (company_id, target_year, target_month)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_company_qsc_monthly_locks_company_id
    ON public.company_qsc_monthly_locks (company_id);
CREATE INDEX IF NOT EXISTS idx_company_qsc_monthly_locks_year_month
    ON public.company_qsc_monthly_locks (target_year, target_month);

-- コメント
COMMENT ON TABLE public.company_qsc_monthly_locks IS '今月使用中のQSC設定ロック。回答があった時点で書き込まれ、その月の設定変更は来月から適用される。';
COMMENT ON COLUMN public.company_qsc_monthly_locks.target_year IS '対象年';
COMMENT ON COLUMN public.company_qsc_monthly_locks.target_month IS '対象月(1-12)';
COMMENT ON COLUMN public.company_qsc_monthly_locks.locked_qsc_type IS 'ロック時点で使用されているQSCタイプ';
COMMENT ON COLUMN public.company_qsc_monthly_locks.locked_form_id IS 'ロック時点で使用されているレビューフォームID';

-- ============================================================================
-- 4. RLS ポリシー（Row Level Security）
-- ============================================================================

-- company_qsc_form_settings の RLS
ALTER TABLE public.company_qsc_form_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_qsc_form_settings_select_policy" ON public.company_qsc_form_settings
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

CREATE POLICY "company_qsc_form_settings_insert_policy" ON public.company_qsc_form_settings
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
    );

CREATE POLICY "company_qsc_form_settings_update_policy" ON public.company_qsc_form_settings
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
    );

CREATE POLICY "company_qsc_form_settings_delete_policy" ON public.company_qsc_form_settings
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
    );

-- company_qsc_rotation_settings の RLS
ALTER TABLE public.company_qsc_rotation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_qsc_rotation_settings_select_policy" ON public.company_qsc_rotation_settings
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

CREATE POLICY "company_qsc_rotation_settings_insert_policy" ON public.company_qsc_rotation_settings
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
    );

CREATE POLICY "company_qsc_rotation_settings_update_policy" ON public.company_qsc_rotation_settings
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
    );

CREATE POLICY "company_qsc_rotation_settings_delete_policy" ON public.company_qsc_rotation_settings
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
    );

-- company_qsc_monthly_locks の RLS
ALTER TABLE public.company_qsc_monthly_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_qsc_monthly_locks_select_policy" ON public.company_qsc_monthly_locks
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

-- INSERTはサービスロール（回答アプリ）からのみ許可
CREATE POLICY "company_qsc_monthly_locks_insert_policy" ON public.company_qsc_monthly_locks
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR
        company_id IN (
            SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
        )
    );

-- UPDATEとDELETEは基本的に禁止（ロックデータは変更不可）
-- 管理者のみ削除可能
CREATE POLICY "company_qsc_monthly_locks_delete_policy" ON public.company_qsc_monthly_locks
    FOR DELETE
    USING (
        auth.role() = 'service_role'
    );

-- ============================================================================
-- 5. updated_at を自動更新するトリガー
-- ============================================================================

CREATE OR REPLACE FUNCTION update_qsc_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS company_qsc_form_settings_updated_at_trigger ON public.company_qsc_form_settings;
CREATE TRIGGER company_qsc_form_settings_updated_at_trigger
    BEFORE UPDATE ON public.company_qsc_form_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_qsc_settings_updated_at();

DROP TRIGGER IF EXISTS company_qsc_rotation_settings_updated_at_trigger ON public.company_qsc_rotation_settings;
CREATE TRIGGER company_qsc_rotation_settings_updated_at_trigger
    BEFORE UPDATE ON public.company_qsc_rotation_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_qsc_settings_updated_at();
