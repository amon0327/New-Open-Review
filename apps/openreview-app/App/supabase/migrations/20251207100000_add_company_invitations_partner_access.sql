-- Add partner access to company_user_invitations RLS policies
-- This enables partner members to view/manage invitations for affiliated companies

-- ============================================================================
-- Create SECURITY DEFINER function to get partner-affiliated companies
-- ============================================================================

-- Function to get company IDs that a user has access to via partner membership
CREATE OR REPLACE FUNCTION get_partner_affiliated_companies(user_id uuid)
RETURNS TABLE (company_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT pac.companies_id
  FROM partner_memberships pm
  JOIN partner_affiliate_companies pac ON pm.partner_company_id = pac.partner_company_id
  WHERE pm.business_users_id = user_id
    AND pm.is_active = true;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_partner_affiliated_companies(uuid) TO authenticated;

-- ============================================================================
-- Drop and recreate company_user_invitations policies with partner access
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "company_user_invitations_authenticated_select" ON company_user_invitations;
DROP POLICY IF EXISTS "company_user_invitations_authenticated_insert" ON company_user_invitations;
DROP POLICY IF EXISTS "company_user_invitations_authenticated_delete" ON company_user_invitations;
DROP POLICY IF EXISTS "company_user_invitations_authenticated_update" ON company_user_invitations;

-- SELECT: Users can view invitations for companies they are members of OR partner-affiliated with
CREATE POLICY "company_user_invitations_authenticated_select" ON company_user_invitations
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Direct company membership
    company_id IN (
      SELECT company_id
      FROM company_memberships
      WHERE business_user_id = auth.uid()
    )
    OR
    -- Partner-affiliated companies
    company_id IN (
      SELECT company_id
      FROM get_partner_affiliated_companies(auth.uid())
    )
  )
);

-- INSERT: Users can create invitations for companies they are members of OR partner-affiliated with
CREATE POLICY "company_user_invitations_authenticated_insert" ON company_user_invitations
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Direct company membership
    company_id IN (
      SELECT company_id
      FROM company_memberships
      WHERE business_user_id = auth.uid()
    )
    OR
    -- Partner-affiliated companies
    company_id IN (
      SELECT company_id
      FROM get_partner_affiliated_companies(auth.uid())
    )
  )
);

-- DELETE: Users can delete invitations for companies they are members of OR partner-affiliated with
CREATE POLICY "company_user_invitations_authenticated_delete" ON company_user_invitations
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    -- Direct company membership
    company_id IN (
      SELECT company_id
      FROM company_memberships
      WHERE business_user_id = auth.uid()
    )
    OR
    -- Partner-affiliated companies
    company_id IN (
      SELECT company_id
      FROM get_partner_affiliated_companies(auth.uid())
    )
  )
);

-- UPDATE: Users can update invitations for companies they are members of OR partner-affiliated with
CREATE POLICY "company_user_invitations_authenticated_update" ON company_user_invitations
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    -- Direct company membership
    company_id IN (
      SELECT company_id
      FROM company_memberships
      WHERE business_user_id = auth.uid()
    )
    OR
    -- Partner-affiliated companies
    company_id IN (
      SELECT company_id
      FROM get_partner_affiliated_companies(auth.uid())
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Direct company membership
    company_id IN (
      SELECT company_id
      FROM company_memberships
      WHERE business_user_id = auth.uid()
    )
    OR
    -- Partner-affiliated companies
    company_id IN (
      SELECT company_id
      FROM get_partner_affiliated_companies(auth.uid())
    )
  )
);

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON FUNCTION get_partner_affiliated_companies(uuid) IS
  'Returns company IDs that a user has access to via partner membership and partner_affiliate_companies.';

COMMENT ON POLICY "company_user_invitations_authenticated_select" ON company_user_invitations IS
  'Allows users to view invitations for their companies (direct membership or partner-affiliated)';

COMMENT ON POLICY "company_user_invitations_authenticated_insert" ON company_user_invitations IS
  'Allows users to create invitations for their companies (direct membership or partner-affiliated)';

COMMENT ON POLICY "company_user_invitations_authenticated_delete" ON company_user_invitations IS
  'Allows users to delete invitations for their companies (direct membership or partner-affiliated)';

COMMENT ON POLICY "company_user_invitations_authenticated_update" ON company_user_invitations IS
  'Allows users to update invitations for their companies (direct membership or partner-affiliated)';
