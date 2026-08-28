-- Add DELETE policy for company_memberships to allow members to remove other members
-- This enables the member deletion feature in the Company Admin Page

-- ============================================================================
-- Add DELETE policy for company_memberships
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "company_memberships_authenticated_delete" ON company_memberships;

-- Company members can delete memberships in their company
-- Uses get_user_companies SECURITY DEFINER function to avoid infinite recursion
CREATE POLICY "company_memberships_authenticated_delete" ON company_memberships
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    -- Direct company membership
    company_id IN (
      SELECT company_id FROM get_user_companies(auth.uid())
    )
    OR
    -- Partner-affiliated companies
    company_id IN (
      SELECT company_id FROM get_partner_affiliated_companies(auth.uid())
    )
  )
);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON POLICY "company_memberships_authenticated_delete" ON company_memberships IS
  'Allows company members or partner members to delete memberships in their company using SECURITY DEFINER functions to avoid recursion.';
