-- Fix infinite recursion in partner_memberships RLS policy
-- Use SECURITY DEFINER function to avoid recursive policy checks

-- First, drop the problematic policies
DROP POLICY IF EXISTS "partner_memberships_authenticated_select" ON partner_memberships;
DROP POLICY IF EXISTS "business_users_partner_members_select" ON business_users;

-- Create a SECURITY DEFINER function to get user's partner companies
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION get_user_partner_companies(user_id uuid)
RETURNS TABLE (partner_company_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT partner_company_id
  FROM partner_memberships
  WHERE business_users_id = user_id
    AND is_active = TRUE;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_partner_companies(uuid) TO authenticated;

-- Create new policy using the function (no infinite recursion)
CREATE POLICY "partner_memberships_authenticated_select" ON partner_memberships
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  partner_company_id IN (
    SELECT partner_company_id
    FROM get_user_partner_companies(auth.uid())
  )
);

-- Create a SECURITY DEFINER function to get partner company members
CREATE OR REPLACE FUNCTION get_partner_company_members(user_id uuid)
RETURNS TABLE (business_users_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT pm2.business_users_id
  FROM partner_memberships pm1
  JOIN partner_memberships pm2 ON pm1.partner_company_id = pm2.partner_company_id
  WHERE pm1.business_users_id = user_id
    AND pm1.is_active = TRUE
    AND pm2.is_active = TRUE;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_partner_company_members(uuid) TO authenticated;

-- Create business_users policy using the function
CREATE POLICY "business_users_partner_members_select" ON business_users
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Allow viewing own profile
    id = auth.uid()
    OR
    -- Allow viewing other members in the same partner company
    id IN (
      SELECT business_users_id
      FROM get_partner_company_members(auth.uid())
    )
  )
);

-- Add comments for documentation
COMMENT ON FUNCTION get_user_partner_companies(uuid) IS
  'Returns partner company IDs for a given user. Used by RLS policies to avoid infinite recursion.';

COMMENT ON FUNCTION get_partner_company_members(uuid) IS
  'Returns business_users_ids of all members in the same partner company. Used by RLS policies.';

COMMENT ON POLICY "partner_memberships_authenticated_select" ON partner_memberships IS
  'Allows users to view all members in their partner company using SECURITY DEFINER function';

COMMENT ON POLICY "business_users_partner_members_select" ON business_users IS
  'Allows users to view their own profile and profiles of members in the same partner company';
