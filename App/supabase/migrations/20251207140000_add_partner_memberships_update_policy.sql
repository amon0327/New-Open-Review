-- Add UPDATE policy for partner_memberships to allow members to deactivate other members
-- This enables the member deletion feature in the Partner Dashboard

-- ============================================================================
-- Add UPDATE policy for partner_memberships
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "partner_memberships_authenticated_update" ON partner_memberships;

-- Partner members can update memberships in their partner company (for deactivation)
CREATE POLICY "partner_memberships_authenticated_update" ON partner_memberships
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  partner_company_id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid()
      AND is_active = true
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  partner_company_id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid()
      AND is_active = true
  )
);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON POLICY "partner_memberships_authenticated_update" ON partner_memberships IS
  'Allows partner members to update memberships in their partner company (e.g., deactivate members)';
