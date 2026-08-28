-- Add RLS policies for company_user_invitations and company_memberships
-- This enables company member invitation and management features

-- ============================================================================
-- Company User Invitations RLS Policies
-- ============================================================================

-- Enable RLS on company_user_invitations
ALTER TABLE company_user_invitations ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "company_user_invitations_service_role_all" ON company_user_invitations
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can view invitations for their companies
CREATE POLICY "company_user_invitations_authenticated_select" ON company_user_invitations
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
);

-- Authenticated users can insert invitations for their companies
CREATE POLICY "company_user_invitations_authenticated_insert" ON company_user_invitations
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
);

-- Authenticated users can delete invitations for their companies
CREATE POLICY "company_user_invitations_authenticated_delete" ON company_user_invitations
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
);

-- Authenticated users can update invitations for their companies
CREATE POLICY "company_user_invitations_authenticated_update" ON company_user_invitations
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
);

-- ============================================================================
-- Company Memberships RLS Policies
-- ============================================================================

-- Enable RLS on company_memberships
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "company_memberships_service_role_all" ON company_memberships;

-- Service role has full access
CREATE POLICY "company_memberships_service_role_all" ON company_memberships
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create SECURITY DEFINER function to get user's companies (avoid infinite recursion)
CREATE OR REPLACE FUNCTION get_user_companies(user_id uuid)
RETURNS TABLE (company_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT company_id
  FROM company_memberships
  WHERE business_user_id = user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_companies(uuid) TO authenticated;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "company_memberships_authenticated_select" ON company_memberships;

-- Authenticated users can view all members in their companies
CREATE POLICY "company_memberships_authenticated_select" ON company_memberships
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT company_id
    FROM get_user_companies(auth.uid())
  )
);

-- Create SECURITY DEFINER function to get company members
CREATE OR REPLACE FUNCTION get_company_members(user_id uuid)
RETURNS TABLE (business_user_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT cm2.business_user_id
  FROM company_memberships cm1
  JOIN company_memberships cm2 ON cm1.company_id = cm2.company_id
  WHERE cm1.business_user_id = user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_company_members(uuid) TO authenticated;

-- Update business_users policy to allow viewing company members
DROP POLICY IF EXISTS "business_users_company_members_select" ON business_users;

CREATE POLICY "business_users_company_members_select" ON business_users
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Allow viewing own profile
    id = auth.uid()
    OR
    -- Allow viewing members in the same partner company (existing policy)
    id IN (
      SELECT business_users_id
      FROM get_partner_company_members(auth.uid())
    )
    OR
    -- Allow viewing members in the same company (new policy)
    id IN (
      SELECT business_user_id
      FROM get_company_members(auth.uid())
    )
  )
);

-- Add foreign key constraint for company_user_invitations -> companies
-- This is needed for Supabase queries with table joins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_user_invitations_company_id_fkey'
  ) THEN
    ALTER TABLE company_user_invitations
    ADD CONSTRAINT company_user_invitations_company_id_fkey
    FOREIGN KEY (company_id)
    REFERENCES companies(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add index on foreign key for better performance
CREATE INDEX IF NOT EXISTS idx_company_user_invitations_company_id
ON company_user_invitations(company_id);

CREATE INDEX IF NOT EXISTS idx_company_user_invitations_token
ON company_user_invitations(token);

CREATE INDEX IF NOT EXISTS idx_company_user_invitations_status
ON company_user_invitations(status);

-- Add indexes for company_memberships
CREATE INDEX IF NOT EXISTS idx_company_memberships_user
ON company_memberships(business_user_id);

CREATE INDEX IF NOT EXISTS idx_company_memberships_company
ON company_memberships(company_id);

-- Add comments for documentation
COMMENT ON FUNCTION get_user_companies(uuid) IS
  'Returns company IDs for a given user. Used by RLS policies to avoid infinite recursion.';

COMMENT ON FUNCTION get_company_members(uuid) IS
  'Returns business_user_ids of all members in the same company. Used by RLS policies.';

COMMENT ON POLICY "company_user_invitations_authenticated_select" ON company_user_invitations IS
  'Allows users to view invitations for their companies';

COMMENT ON POLICY "company_memberships_authenticated_select" ON company_memberships IS
  'Allows users to view all members in their companies using SECURITY DEFINER function';

COMMENT ON POLICY "business_users_company_members_select" ON business_users IS
  'Allows users to view their own profile, partner company members, and company members';
