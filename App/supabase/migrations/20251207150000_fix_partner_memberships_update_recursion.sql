-- Fix infinite recursion in partner_memberships UPDATE policy
-- Use SECURITY DEFINER function to avoid recursion

-- ============================================================================
-- Create SECURITY DEFINER function to get user's partner company ID
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_partner_company_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT partner_company_id
  FROM partner_memberships
  WHERE business_users_id = user_id
    AND is_active = true
  LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_partner_company_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_partner_company_id(uuid) TO anon;

-- ============================================================================
-- Drop and recreate UPDATE policy using the function
-- ============================================================================

DROP POLICY IF EXISTS "partner_memberships_authenticated_update" ON partner_memberships;

-- Partner members can update memberships in their partner company (for deactivation)
CREATE POLICY "partner_memberships_authenticated_update" ON partner_memberships
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  partner_company_id = get_user_partner_company_id(auth.uid())
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  partner_company_id = get_user_partner_company_id(auth.uid())
);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON FUNCTION get_user_partner_company_id(uuid) IS
  'Returns the partner company ID for a given user. Uses SECURITY DEFINER to avoid RLS recursion.';

COMMENT ON POLICY "partner_memberships_authenticated_update" ON partner_memberships IS
  'Allows partner members to update memberships in their partner company using SECURITY DEFINER function to avoid recursion.';
