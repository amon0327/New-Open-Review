-- ============================================================================
-- review_question_form_links のRLSポリシー修正
--
-- 問題: INSERTポリシーがパートナーユーザーを考慮していなかった
-- 修正: パートナーとしてフォームにアクセスできるユーザーもINSERT可能に
-- ============================================================================

-- 既存のINSERTポリシーを削除
DROP POLICY IF EXISTS "review_question_form_links_insert_policy" ON public.review_question_form_links;

-- 新しいINSERTポリシー（パートナーも含む）
CREATE POLICY "review_question_form_links_insert_policy" ON public.review_question_form_links
    FOR INSERT
    WITH CHECK (
        -- 直接所属している会社のフォーム
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

-- UPDATEポリシーも同様に修正
DROP POLICY IF EXISTS "review_question_form_links_update_policy" ON public.review_question_form_links;

CREATE POLICY "review_question_form_links_update_policy" ON public.review_question_form_links
    FOR UPDATE
    USING (
        review_form_id IN (
            SELECT rf.id FROM review_forms rf
            JOIN company_memberships cm ON cm.company_id = rf.company_id
            WHERE cm.business_user_id = auth.uid()
        )
        OR
        review_form_id IN (
            SELECT rf.id FROM review_forms rf
            JOIN partner_affiliate_companies pac ON pac.companies_id = rf.company_id
            JOIN partner_memberships pm ON pm.partner_company_id = pac.partner_company_id
            WHERE pm.business_users_id = auth.uid()
        )
    );

-- DELETEポリシーも同様に修正
DROP POLICY IF EXISTS "review_question_form_links_delete_policy" ON public.review_question_form_links;

CREATE POLICY "review_question_form_links_delete_policy" ON public.review_question_form_links
    FOR DELETE
    USING (
        review_form_id IN (
            SELECT rf.id FROM review_forms rf
            JOIN company_memberships cm ON cm.company_id = rf.company_id
            WHERE cm.business_user_id = auth.uid()
        )
        OR
        review_form_id IN (
            SELECT rf.id FROM review_forms rf
            JOIN partner_affiliate_companies pac ON pac.companies_id = rf.company_id
            JOIN partner_memberships pm ON pm.partner_company_id = pac.partner_company_id
            WHERE pm.business_users_id = auth.uid()
        )
    );
