-- Fix RLS policies for companies and company_memberships tables
-- Allow Edge Function (Service Role) to create companies

-- ============================================================================
-- Enable RLS if not already enabled
-- ============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Drop existing policies
-- ============================================================================
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;
DROP POLICY IF EXISTS "companies_service_role_all" ON companies;

DROP POLICY IF EXISTS "company_memberships_select_policy" ON company_memberships;
DROP POLICY IF EXISTS "company_memberships_insert_policy" ON company_memberships;
DROP POLICY IF EXISTS "company_memberships_update_policy" ON company_memberships;
DROP POLICY IF EXISTS "company_memberships_delete_policy" ON company_memberships;
DROP POLICY IF EXISTS "company_memberships_service_role_all" ON company_memberships;

-- ============================================================================
-- Companies table RLS policies
-- ============================================================================

-- Service Role has full access (for Edge Functions)
CREATE POLICY "companies_service_role_all" ON companies
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can view companies they are members of
CREATE POLICY "companies_authenticated_select" ON companies
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
);

-- Users can update companies they are members of
CREATE POLICY "companies_authenticated_update" ON companies
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
);

-- ============================================================================
-- Company memberships table RLS policies
-- ============================================================================

-- Service Role has full access (for Edge Functions)
CREATE POLICY "company_memberships_service_role_all" ON company_memberships
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Users can view their own memberships
CREATE POLICY "company_memberships_authenticated_select" ON company_memberships
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  business_user_id = auth.uid()
);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON POLICY "companies_service_role_all" ON companies IS
'Allows Service Role (Edge Functions) full access to companies table';

COMMENT ON POLICY "company_memberships_service_role_all" ON company_memberships IS
'Allows Service Role (Edge Functions) full access to company_memberships table';
