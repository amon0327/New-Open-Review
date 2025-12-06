-- Add RLS policy to allow partner companies to view their affiliated companies
-- Security fix: Allow partner company members to view companies they created via partner_affiliate_companies

-- ============================================================================
-- Add partner access policy for companies table
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "companies_partner_select" ON companies;

-- Partner company members can view companies affiliated with their partner company
CREATE POLICY "companies_partner_select" ON companies
FOR SELECT
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

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON POLICY "companies_partner_select" ON companies IS
  'Allows partner company members to view companies affiliated with their partner company via partner_affiliate_companies table. This enables partner company users to see companies they created without needing to be a member of those companies.';

-- ============================================================================
-- Security explanation
-- ============================================================================
-- This policy ensures that:
-- 1. Users can only see companies affiliated with THEIR partner company
-- 2. Users from Partner Company A cannot see companies from Partner Company B
-- 3. The policy works together with partner_affiliate_companies RLS to enforce proper data isolation
-- 4. Partner company users can manage companies they created even if they are not members of those companies
