-- Add DELETE policies for store_memberships and store_invitations
-- This enables member and invitation deletion in the Store Detail Page

-- ============================================================================
-- Create SECURITY DEFINER function to get user's stores
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_stores(user_id uuid)
RETURNS TABLE (store_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT store_id
  FROM store_memberships
  WHERE business_user_id = user_id;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_stores(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stores(uuid) TO anon;

-- ============================================================================
-- Add DELETE policy for store_memberships
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "store_memberships_authenticated_delete" ON store_memberships;

-- Store members can delete other memberships in their stores
CREATE POLICY "store_memberships_authenticated_delete" ON store_memberships
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  store_id IN (
    SELECT store_id FROM get_user_stores(auth.uid())
  )
);

-- ============================================================================
-- Add DELETE policy for store_invitations
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "store_invitations_authenticated_delete" ON store_invitations;

-- Store members can delete invitations for their stores
CREATE POLICY "store_invitations_authenticated_delete" ON store_invitations
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  store_id IN (
    SELECT store_id FROM get_user_stores(auth.uid())
  )
);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON FUNCTION get_user_stores(uuid) IS
  'Returns store IDs that a user has membership in. Uses SECURITY DEFINER to avoid RLS recursion.';

COMMENT ON POLICY "store_memberships_authenticated_delete" ON store_memberships IS
  'Allows store members to delete memberships in their stores.';

COMMENT ON POLICY "store_invitations_authenticated_delete" ON store_invitations IS
  'Allows store members to delete invitations for their stores.';
