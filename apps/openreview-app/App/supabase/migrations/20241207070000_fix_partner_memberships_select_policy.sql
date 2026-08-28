-- Fix partner_memberships SELECT policy to allow viewing all members in the same company
-- Previously only allowed viewing own membership, now allows viewing all members in the same partner company

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "partner_memberships_authenticated_select" ON partner_memberships;

-- Create new policy that allows viewing all members in the same partner company
CREATE POLICY "partner_memberships_authenticated_select" ON partner_memberships
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  partner_company_id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid()
      AND is_active = TRUE
  )
);

-- Add comment for documentation
COMMENT ON POLICY "partner_memberships_authenticated_select" ON partner_memberships IS
  'Allows users to view all members in their partner company';

-- Add SELECT policy for business_users table to allow viewing members in the same partner company
-- This is required for the foreign key join in partner_memberships
DROP POLICY IF EXISTS "business_users_partner_members_select" ON business_users;

CREATE POLICY "business_users_partner_members_select" ON business_users
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Allow viewing own profile
    id = auth.uid()
    OR
    -- Allow viewing other members in the same partner company
    id IN (
      SELECT pm2.business_users_id
      FROM partner_memberships pm1
      JOIN partner_memberships pm2 ON pm1.partner_company_id = pm2.partner_company_id
      WHERE pm1.business_users_id = auth.uid()
        AND pm1.is_active = TRUE
        AND pm2.is_active = TRUE
    )
  )
);

-- Add comment for documentation
COMMENT ON POLICY "business_users_partner_members_select" ON business_users IS
  'Allows users to view their own profile and profiles of members in the same partner company';
