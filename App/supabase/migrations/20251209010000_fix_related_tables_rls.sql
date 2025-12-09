-- Fix RLS policies for review form related tables
-- Allow access based on company_memberships and partner_memberships

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Check access via review_form_id (singular)
CREATE OR REPLACE FUNCTION public.user_has_review_form_access(form_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = form_id
    AND (
      rf.business_users = auth.uid()
      OR
      rf.company_id IN (
        SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
      )
      OR
      rf.company_id IN (
        SELECT pac.companies_id
        FROM partner_affiliate_companies pac
        JOIN partner_memberships pm ON pac.partner_company_id = pm.partner_company_id
        WHERE pm.business_users_id = auth.uid()
      )
    )
  );
$$;

-- Check access via review_forms_id (plural)
CREATE OR REPLACE FUNCTION public.user_has_review_forms_access(forms_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = forms_id
    AND (
      rf.business_users = auth.uid()
      OR
      rf.company_id IN (
        SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
      )
      OR
      rf.company_id IN (
        SELECT pac.companies_id
        FROM partner_affiliate_companies pac
        JOIN partner_memberships pm ON pac.partner_company_id = pm.partner_company_id
        WHERE pm.business_users_id = auth.uid()
      )
    )
  );
$$;

-- Check access via review_fome_id (typo in column name)
CREATE OR REPLACE FUNCTION public.user_has_review_fome_access(fome_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = fome_id
    AND (
      rf.business_users = auth.uid()
      OR
      rf.company_id IN (
        SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
      )
      OR
      rf.company_id IN (
        SELECT pac.companies_id
        FROM partner_affiliate_companies pac
        JOIN partner_memberships pm ON pac.partner_company_id = pm.partner_company_id
        WHERE pm.business_users_id = auth.uid()
      )
    )
  );
$$;

-- Check access via review_questions_id
CREATE OR REPLACE FUNCTION public.user_has_review_question_access(question_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM review_questions rq
    JOIN review_forms rf ON rf.id = rq.review_fome_id
    WHERE rq.id = question_id
    AND (
      rf.business_users = auth.uid()
      OR
      rf.company_id IN (
        SELECT company_id FROM company_memberships WHERE business_user_id = auth.uid()
      )
      OR
      rf.company_id IN (
        SELECT pac.companies_id
        FROM partner_affiliate_companies pac
        JOIN partner_memberships pm ON pac.partner_company_id = pm.partner_company_id
        WHERE pm.business_users_id = auth.uid()
      )
    )
  );
$$;

-- ============================================================================
-- review_form_settings RLS
-- ============================================================================
DROP POLICY IF EXISTS "Allow users to view their own review_form_settings" ON review_form_settings;
DROP POLICY IF EXISTS "Allow users to update their own review_form_settings" ON review_form_settings;
DROP POLICY IF EXISTS "Allow users to delete their own review_form_settings" ON review_form_settings;

CREATE POLICY "review_form_settings_select" ON review_form_settings
FOR SELECT USING (public.user_has_review_form_access(review_form_id));

CREATE POLICY "review_form_settings_update" ON review_form_settings
FOR UPDATE USING (public.user_has_review_form_access(review_form_id))
WITH CHECK (public.user_has_review_form_access(review_form_id));

CREATE POLICY "review_form_settings_delete" ON review_form_settings
FOR DELETE USING (public.user_has_review_form_access(review_form_id));

-- ============================================================================
-- review_form_pages RLS
-- ============================================================================
DROP POLICY IF EXISTS "Allow users to view their own review_form_pages" ON review_form_pages;
DROP POLICY IF EXISTS "Allow users to update their own review_form_pages" ON review_form_pages;
DROP POLICY IF EXISTS "Allow users to delete their own review_form_pages" ON review_form_pages;

CREATE POLICY "review_form_pages_select" ON review_form_pages
FOR SELECT USING (public.user_has_review_forms_access(review_forms_id));

CREATE POLICY "review_form_pages_update" ON review_form_pages
FOR UPDATE USING (public.user_has_review_forms_access(review_forms_id))
WITH CHECK (public.user_has_review_forms_access(review_forms_id));

CREATE POLICY "review_form_pages_delete" ON review_form_pages
FOR DELETE USING (public.user_has_review_forms_access(review_forms_id));

-- ============================================================================
-- review_questions RLS
-- ============================================================================
DROP POLICY IF EXISTS "Allow users to view their own review_questions" ON review_questions;
DROP POLICY IF EXISTS "Users can view questions
  for their forms" ON review_questions;
DROP POLICY IF EXISTS "Allow users to update their own review_questions" ON review_questions;
DROP POLICY IF EXISTS "Allow users to delete their own review_questions" ON review_questions;

CREATE POLICY "review_questions_select" ON review_questions
FOR SELECT USING (public.user_has_review_fome_access(review_fome_id));

CREATE POLICY "review_questions_update" ON review_questions
FOR UPDATE USING (public.user_has_review_fome_access(review_fome_id))
WITH CHECK (public.user_has_review_fome_access(review_fome_id));

CREATE POLICY "review_questions_delete" ON review_questions
FOR DELETE USING (public.user_has_review_fome_access(review_fome_id));

-- ============================================================================
-- login_screen_settings RLS
-- ============================================================================
DROP POLICY IF EXISTS "Allow users to view their own login_screen_settings" ON login_screen_settings;
DROP POLICY IF EXISTS "Allow users to update their own login_screen_settings" ON login_screen_settings;
DROP POLICY IF EXISTS "Allow users to delete their own login_screen_settings" ON login_screen_settings;

CREATE POLICY "login_screen_settings_select" ON login_screen_settings
FOR SELECT USING (public.user_has_review_forms_access(review_forms_id));

CREATE POLICY "login_screen_settings_update" ON login_screen_settings
FOR UPDATE USING (public.user_has_review_forms_access(review_forms_id))
WITH CHECK (public.user_has_review_forms_access(review_forms_id));

CREATE POLICY "login_screen_settings_delete" ON login_screen_settings
FOR DELETE USING (public.user_has_review_forms_access(review_forms_id));

-- ============================================================================
-- question_screen_settings RLS
-- ============================================================================
DROP POLICY IF EXISTS "Allow users to view their own question_screen_settings" ON question_screen_settings;
DROP POLICY IF EXISTS "Allow users to update their own question_screen_settings" ON question_screen_settings;
DROP POLICY IF EXISTS "Allow users to delete their own question_screen_settings" ON question_screen_settings;

CREATE POLICY "question_screen_settings_select" ON question_screen_settings
FOR SELECT USING (public.user_has_review_forms_access(review_forms_id));

CREATE POLICY "question_screen_settings_update" ON question_screen_settings
FOR UPDATE USING (public.user_has_review_forms_access(review_forms_id))
WITH CHECK (public.user_has_review_forms_access(review_forms_id));

CREATE POLICY "question_screen_settings_delete" ON question_screen_settings
FOR DELETE USING (public.user_has_review_forms_access(review_forms_id));

-- ============================================================================
-- completion_screen_settings RLS
-- ============================================================================
DROP POLICY IF EXISTS "Allow users to view their own completion_screen_settings" ON completion_screen_settings;
DROP POLICY IF EXISTS "Allow users to update their own completion_screen_settings" ON completion_screen_settings;
DROP POLICY IF EXISTS "Allow users to delete their own completion_screen_settings" ON completion_screen_settings;

CREATE POLICY "completion_screen_settings_select" ON completion_screen_settings
FOR SELECT USING (public.user_has_review_forms_access(review_forms_id));

CREATE POLICY "completion_screen_settings_update" ON completion_screen_settings
FOR UPDATE USING (public.user_has_review_forms_access(review_forms_id))
WITH CHECK (public.user_has_review_forms_access(review_forms_id));

CREATE POLICY "completion_screen_settings_delete" ON completion_screen_settings
FOR DELETE USING (public.user_has_review_forms_access(review_forms_id));

-- ============================================================================
-- question_option_choices RLS
-- ============================================================================
DROP POLICY IF EXISTS "Allow users to view their own question_option_choices" ON question_option_choices;
DROP POLICY IF EXISTS "Allow users to update their own question_option_choices" ON question_option_choices;
DROP POLICY IF EXISTS "Allow users to delete their own question_option_choices" ON question_option_choices;

CREATE POLICY "question_option_choices_select" ON question_option_choices
FOR SELECT USING (public.user_has_review_question_access(review_questions_id));

CREATE POLICY "question_option_choices_update" ON question_option_choices
FOR UPDATE USING (public.user_has_review_question_access(review_questions_id))
WITH CHECK (public.user_has_review_question_access(review_questions_id));

CREATE POLICY "question_option_choices_delete" ON question_option_choices
FOR DELETE USING (public.user_has_review_question_access(review_questions_id));

-- ============================================================================
-- question_option_linear_scale RLS
-- ============================================================================
DROP POLICY IF EXISTS "Allow users to view their own question_option_linear_scale" ON question_option_linear_scale;
DROP POLICY IF EXISTS "Allow users to update their own question_option_linear_scale" ON question_option_linear_scale;
DROP POLICY IF EXISTS "Allow users to delete their own question_option_linear_scale" ON question_option_linear_scale;

CREATE POLICY "question_option_linear_scale_select" ON question_option_linear_scale
FOR SELECT USING (public.user_has_review_question_access(review_questions_id));

CREATE POLICY "question_option_linear_scale_update" ON question_option_linear_scale
FOR UPDATE USING (public.user_has_review_question_access(review_questions_id))
WITH CHECK (public.user_has_review_question_access(review_questions_id));

CREATE POLICY "question_option_linear_scale_delete" ON question_option_linear_scale
FOR DELETE USING (public.user_has_review_question_access(review_questions_id));
