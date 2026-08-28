-- Add RLS policy to allow direct company members to view their company
-- This fixes the issue where company members cannot see their own company data

-- ============================================================================
-- Add direct member access policy for companies table
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "companies_direct_member_select" ON companies;

-- Company members can view their own company
CREATE POLICY "companies_direct_member_select" ON companies
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT company_id
    FROM get_user_companies(auth.uid())
  )
);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON POLICY "companies_direct_member_select" ON companies IS
  'Allows company members to view their own company. Uses get_user_companies SECURITY DEFINER function to avoid infinite recursion.';
