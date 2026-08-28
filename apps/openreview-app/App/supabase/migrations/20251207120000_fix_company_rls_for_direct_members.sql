-- Fix RLS policies for company_memberships and company_user_invitations
-- to properly support direct company members (not just partner members)

-- ============================================================================
-- Update get_user_companies function to be more robust
-- ============================================================================

-- Recreate the function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION get_user_companies(user_id uuid)
RETURNS TABLE (company_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT cm.company_id
  FROM company_memberships cm
  WHERE cm.business_user_id = user_id;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_companies(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_companies(uuid) TO anon;

-- ============================================================================
-- Fix company_memberships RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "company_memberships_authenticated_select" ON company_memberships;
DROP POLICY IF EXISTS "company_memberships_service_role_all" ON company_memberships;

-- Service role has full access
CREATE POLICY "company_memberships_service_role_all" ON company_memberships
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can view all members in their companies
-- Uses SECURITY DEFINER function to avoid infinite recursion
CREATE POLICY "company_memberships_authenticated_select" ON company_memberships
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Direct membership check using SECURITY DEFINER function
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
-- Fix company_user_invitations RLS policies
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
    -- Direct company membership using SECURITY DEFINER function
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

-- INSERT: Users can create invitations for companies they have access to
CREATE POLICY "company_user_invitations_authenticated_insert" ON company_user_invitations
FOR INSERT
WITH CHECK (
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

-- DELETE: Users can delete invitations for companies they have access to
CREATE POLICY "company_user_invitations_authenticated_delete" ON company_user_invitations
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

-- UPDATE: Users can update invitations for companies they have access to
CREATE POLICY "company_user_invitations_authenticated_update" ON company_user_invitations
FOR UPDATE
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
)
WITH CHECK (
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
-- Ensure business_users can be viewed by company members
-- ============================================================================

-- Drop and recreate the policy
DROP POLICY IF EXISTS "business_users_company_members_select" ON business_users;

CREATE POLICY "business_users_company_members_select" ON business_users
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Allow viewing own profile
    id = auth.uid()
    OR
    -- Allow viewing members in the same partner company
    id IN (
      SELECT business_users_id
      FROM get_partner_company_members(auth.uid())
    )
    OR
    -- Allow viewing members in the same company
    id IN (
      SELECT business_user_id
      FROM get_company_members(auth.uid())
    )
  )
);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "company_memberships_authenticated_select" ON company_memberships IS
  'Allows users to view company memberships for their companies (direct or partner-affiliated)';

COMMENT ON POLICY "company_user_invitations_authenticated_select" ON company_user_invitations IS
  'Allows users to view invitations for their companies (direct membership or partner-affiliated)';
