-- Comprehensive RLS Policy Update for Partner Company Access
-- This migration adds partner access to ALL tables that company members can access
-- Partner users can access the same data as company members when working with affiliated companies

-- ============================================================================
-- PART 1: Core Company Tables
-- ============================================================================

-- Companies table - Add UPDATE and DELETE policies for partner users
DROP POLICY IF EXISTS "companies_partner_update" ON companies;
DROP POLICY IF EXISTS "companies_partner_delete" ON companies;

CREATE POLICY "companies_partner_update" ON companies
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "companies_partner_delete" ON companies
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

-- Company Memberships table - Add partner SELECT policy
DROP POLICY IF EXISTS "company_memberships_partner_select" ON company_memberships;

CREATE POLICY "company_memberships_partner_select" ON company_memberships
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

-- ============================================================================
-- PART 2: Store Tables
-- ============================================================================

-- Stores table - Add partner policies
DROP POLICY IF EXISTS "stores_partner_select" ON stores;
DROP POLICY IF EXISTS "stores_partner_insert" ON stores;
DROP POLICY IF EXISTS "stores_partner_update" ON stores;
DROP POLICY IF EXISTS "stores_partner_delete" ON stores;

CREATE POLICY "stores_partner_select" ON stores
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "stores_partner_insert" ON stores
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "stores_partner_update" ON stores
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "stores_partner_delete" ON stores
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

-- Store Invitations table - Add partner policies
DROP POLICY IF EXISTS "store_invitations_partner_select" ON store_invitations;
DROP POLICY IF EXISTS "store_invitations_partner_insert" ON store_invitations;
DROP POLICY IF EXISTS "store_invitations_partner_update" ON store_invitations;
DROP POLICY IF EXISTS "store_invitations_partner_delete" ON store_invitations;

CREATE POLICY "store_invitations_partner_select" ON store_invitations
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "store_invitations_partner_insert" ON store_invitations
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "store_invitations_partner_update" ON store_invitations
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "store_invitations_partner_delete" ON store_invitations
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

-- Store Memberships table - Add partner policies
DROP POLICY IF EXISTS "store_memberships_partner_select" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_partner_insert" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_partner_update" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_partner_delete" ON store_memberships;

CREATE POLICY "store_memberships_partner_select" ON store_memberships
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "store_memberships_partner_insert" ON store_memberships
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "store_memberships_partner_update" ON store_memberships
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "store_memberships_partner_delete" ON store_memberships
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

-- ============================================================================
-- PART 3: Review Form Junction Tables
-- ============================================================================

-- Company Review Forms table - Add partner policies
DROP POLICY IF EXISTS "company_review_forms_partner_select" ON company_review_forms;
DROP POLICY IF EXISTS "company_review_forms_partner_insert" ON company_review_forms;
DROP POLICY IF EXISTS "company_review_forms_partner_update" ON company_review_forms;
DROP POLICY IF EXISTS "company_review_forms_partner_delete" ON company_review_forms;

CREATE POLICY "company_review_forms_partner_select" ON company_review_forms
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "company_review_forms_partner_insert" ON company_review_forms
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "company_review_forms_partner_update" ON company_review_forms
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "company_review_forms_partner_delete" ON company_review_forms
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

-- Store Review Forms table - Add partner policies (via stores)
DROP POLICY IF EXISTS "store_review_forms_partner_select" ON store_review_forms;
DROP POLICY IF EXISTS "store_review_forms_partner_insert" ON store_review_forms;
DROP POLICY IF EXISTS "store_review_forms_partner_update" ON store_review_forms;
DROP POLICY IF EXISTS "store_review_forms_partner_delete" ON store_review_forms;

CREATE POLICY "store_review_forms_partner_select" ON store_review_forms
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  store_id IN (
    SELECT s.id
    FROM stores s
    WHERE s.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "store_review_forms_partner_insert" ON store_review_forms
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  store_id IN (
    SELECT s.id
    FROM stores s
    WHERE s.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "store_review_forms_partner_update" ON store_review_forms
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  store_id IN (
    SELECT s.id
    FROM stores s
    WHERE s.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  store_id IN (
    SELECT s.id
    FROM stores s
    WHERE s.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "store_review_forms_partner_delete" ON store_review_forms
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  store_id IN (
    SELECT s.id
    FROM stores s
    WHERE s.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- ============================================================================
-- PART 4: Review Forms and Related Tables
-- ============================================================================

-- Review Forms table - Add partner policies
DROP POLICY IF EXISTS "review_forms_partner_select" ON review_forms;
DROP POLICY IF EXISTS "review_forms_partner_insert" ON review_forms;
DROP POLICY IF EXISTS "review_forms_partner_update" ON review_forms;
DROP POLICY IF EXISTS "review_forms_partner_delete" ON review_forms;

CREATE POLICY "review_forms_partner_select" ON review_forms
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT review_form_id
    FROM company_review_forms crf
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "review_forms_partner_insert" ON review_forms
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  business_users = auth.uid()
);

CREATE POLICY "review_forms_partner_update" ON review_forms
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT review_form_id
    FROM company_review_forms crf
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT review_form_id
    FROM company_review_forms crf
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "review_forms_partner_delete" ON review_forms
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT review_form_id
    FROM company_review_forms crf
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- ============================================================================
-- PART 5: Review Form Child Tables
-- ============================================================================

-- Review Form Pages - Add partner policies
DROP POLICY IF EXISTS "review_form_pages_partner_all" ON review_form_pages;

CREATE POLICY "review_form_pages_partner_all" ON review_form_pages
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_forms_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_forms_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- Review Form Settings - Add partner policies
DROP POLICY IF EXISTS "review_form_settings_partner_all" ON review_form_settings;

CREATE POLICY "review_form_settings_partner_all" ON review_form_settings
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_form_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_form_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- Review Form Submissions - Add partner policies
DROP POLICY IF EXISTS "review_form_submissions_partner_all" ON review_form_submissions;

CREATE POLICY "review_form_submissions_partner_all" ON review_form_submissions
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_forms_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_forms_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- Review Questions - Add partner policies
DROP POLICY IF EXISTS "review_questions_partner_all" ON review_questions;

CREATE POLICY "review_questions_partner_all" ON review_questions
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_fome_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_fome_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- Question Option Choices - Add partner policies
DROP POLICY IF EXISTS "question_option_choices_partner_all" ON question_option_choices;

CREATE POLICY "question_option_choices_partner_all" ON question_option_choices
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_questions_id IN (
    SELECT rq.id
    FROM review_questions rq
    JOIN review_forms rf ON rq.review_fome_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_questions_id IN (
    SELECT rq.id
    FROM review_questions rq
    JOIN review_forms rf ON rq.review_fome_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- Question Option Linear Scale - Add partner policies
DROP POLICY IF EXISTS "question_option_linear_scale_partner_all" ON question_option_linear_scale;

CREATE POLICY "question_option_linear_scale_partner_all" ON question_option_linear_scale
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_questions_id IN (
    SELECT rq.id
    FROM review_questions rq
    JOIN review_forms rf ON rq.review_fome_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_questions_id IN (
    SELECT rq.id
    FROM review_questions rq
    JOIN review_forms rf ON rq.review_fome_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- Completion Screen Settings - Add partner policies
DROP POLICY IF EXISTS "completion_screen_settings_partner_all" ON completion_screen_settings;

CREATE POLICY "completion_screen_settings_partner_all" ON completion_screen_settings
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_forms_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_forms_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- Login Screen Settings - Add partner policies
DROP POLICY IF EXISTS "login_screen_settings_partner_all" ON login_screen_settings;

CREATE POLICY "login_screen_settings_partner_all" ON login_screen_settings
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_forms_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_forms_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- Question Screen Settings - Add partner policies
DROP POLICY IF EXISTS "question_screen_settings_partner_all" ON question_screen_settings;

CREATE POLICY "question_screen_settings_partner_all" ON question_screen_settings
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_forms_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_forms_id IN (
    SELECT rf.id
    FROM review_forms rf
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- ============================================================================
-- PART 6: Review Question Answers and Related Tables
-- ============================================================================

-- Review Question Answers - Add partner policies
DROP POLICY IF EXISTS "review_question_answers_partner_all" ON review_question_answers;

CREATE POLICY "review_question_answers_partner_all" ON review_question_answers
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_form_submissions_id IN (
    SELECT rfs.id
    FROM review_form_submissions rfs
    JOIN review_forms rf ON rfs.review_forms_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_form_submissions_id IN (
    SELECT rfs.id
    FROM review_form_submissions rfs
    JOIN review_forms rf ON rfs.review_forms_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- Question Answer Option Choices - Add partner policies
DROP POLICY IF EXISTS "question_answer_option_choices_partner_all" ON question_answer_option_choices;

CREATE POLICY "question_answer_option_choices_partner_all" ON question_answer_option_choices
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_question_answers_id IN (
    SELECT rqa.id
    FROM review_question_answers rqa
    JOIN review_form_submissions rfs ON rqa.review_form_submissions_id = rfs.id
    JOIN review_forms rf ON rfs.review_forms_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_question_answers_id IN (
    SELECT rqa.id
    FROM review_question_answers rqa
    JOIN review_form_submissions rfs ON rqa.review_form_submissions_id = rfs.id
    JOIN review_forms rf ON rfs.review_forms_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- Question Answer Option Linear Scale - Add partner policies
DROP POLICY IF EXISTS "question_answer_option_linear_scale_partner_all" ON question_answer_option_linear_scale;

CREATE POLICY "question_answer_option_linear_scale_partner_all" ON question_answer_option_linear_scale
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_question_answers_id IN (
    SELECT rqa.id
    FROM review_question_answers rqa
    JOIN review_form_submissions rfs ON rqa.review_form_submissions_id = rfs.id
    JOIN review_forms rf ON rfs.review_forms_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_question_answers_id IN (
    SELECT rqa.id
    FROM review_question_answers rqa
    JOIN review_form_submissions rfs ON rqa.review_form_submissions_id = rfs.id
    JOIN review_forms rf ON rfs.review_forms_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- Question Answer Texts - Add partner policies
DROP POLICY IF EXISTS "question_answer_texts_partner_all" ON question_answer_texts;

CREATE POLICY "question_answer_texts_partner_all" ON question_answer_texts
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_questions_answers_id IN (
    SELECT rqa.id
    FROM review_question_answers rqa
    JOIN review_form_submissions rfs ON rqa.review_form_submissions_id = rfs.id
    JOIN review_forms rf ON rfs.review_forms_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_questions_answers_id IN (
    SELECT rqa.id
    FROM review_question_answers rqa
    JOIN review_form_submissions rfs ON rqa.review_form_submissions_id = rfs.id
    JOIN review_forms rf ON rfs.review_forms_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- ============================================================================
-- PART 7: Question Display Settings Tables
-- ============================================================================

-- Question Display Settings - Add partner policies
DROP POLICY IF EXISTS "question_display_settings_partner_all" ON question_display_settings;

CREATE POLICY "question_display_settings_partner_all" ON question_display_settings
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  review_question_id IN (
    SELECT rq.id
    FROM review_questions rq
    JOIN review_forms rf ON rq.review_fome_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  review_question_id IN (
    SELECT rq.id
    FROM review_questions rq
    JOIN review_forms rf ON rq.review_fome_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- Question Display Rule Settings - Add partner policies
DROP POLICY IF EXISTS "question_display_rule_settings_partner_all" ON question_display_rule_settings;

CREATE POLICY "question_display_rule_settings_partner_all" ON question_display_rule_settings
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  question_display_settings_id IN (
    SELECT qds.id
    FROM question_display_settings qds
    JOIN review_questions rq ON qds.review_question_id = rq.id
    JOIN review_forms rf ON rq.review_fome_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  question_display_settings_id IN (
    SELECT qds.id
    FROM question_display_settings qds
    JOIN review_questions rq ON qds.review_question_id = rq.id
    JOIN review_forms rf ON rq.review_fome_id = rf.id
    JOIN company_review_forms crf ON rf.id = crf.review_form_id
    WHERE crf.company_id IN (
      SELECT companies_id
      FROM partner_affiliate_companies
      WHERE partner_company_id IN (
        SELECT partner_company_id
        FROM partner_memberships
        WHERE business_users_id = auth.uid()
      )
    )
  )
);

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON POLICY "companies_partner_update" ON companies IS
  'Allows partner company members to update companies affiliated with their partner company';

COMMENT ON POLICY "companies_partner_delete" ON companies IS
  'Allows partner company members to delete companies affiliated with their partner company';

COMMENT ON POLICY "company_memberships_partner_select" ON company_memberships IS
  'Allows partner company members to view memberships of affiliated companies';

COMMENT ON POLICY "stores_partner_select" ON stores IS
  'Allows partner company members to view stores of affiliated companies';

COMMENT ON POLICY "company_review_forms_partner_select" ON company_review_forms IS
  'Allows partner company members to view review forms of affiliated companies';

COMMENT ON POLICY "review_forms_partner_select" ON review_forms IS
  'Allows partner company members to view review forms of affiliated companies';

-- ============================================================================
-- Summary
-- ============================================================================

-- This migration adds comprehensive partner access to ALL tables that company members can access.
-- Partner users now have the same permissions as company members for affiliated companies.
--
-- Access chain: partner_memberships → partner_affiliate_companies → companies → all related data
--
-- Tables updated (27 tables total):
-- 1. companies (UPDATE, DELETE)
-- 2. company_memberships (SELECT)
-- 3. stores (ALL)
-- 4. store_invitations (ALL)
-- 5. store_memberships (ALL)
-- 6. company_review_forms (ALL)
-- 7. store_review_forms (ALL)
-- 8. review_forms (ALL)
-- 9. review_form_pages (ALL)
-- 10. review_form_settings (ALL)
-- 11. review_form_submissions (ALL)
-- 12. review_questions (ALL)
-- 13. question_option_choices (ALL)
-- 14. question_option_linear_scale (ALL)
-- 15. completion_screen_settings (ALL)
-- 16. login_screen_settings (ALL)
-- 17. question_screen_settings (ALL)
-- 18. review_question_answers (ALL)
-- 19. question_answer_option_choices (ALL)
-- 20. question_answer_option_linear_scale (ALL)
-- 21. question_answer_texts (ALL)
-- 22. question_display_settings (ALL)
-- 23. question_display_rule_settings (ALL)
