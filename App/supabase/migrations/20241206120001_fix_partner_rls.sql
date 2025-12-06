-- Fix Partner tables RLS policies to avoid infinite recursion

-- ============================================================================
-- Fix RLS Policies for partner_company
-- ============================================================================
DROP POLICY IF EXISTS "partner_company_select_policy" ON partner_company;
DROP POLICY IF EXISTS "partner_company_insert_policy" ON partner_company;
DROP POLICY IF EXISTS "partner_company_update_policy" ON partner_company;
DROP POLICY IF EXISTS "partner_company_delete_policy" ON partner_company;

-- SELECT: Allow service role and authenticated users to view companies
-- Users will see companies they are members of via partner_memberships table query
CREATE POLICY "partner_company_select_policy" ON partner_company
FOR SELECT
USING (
  -- Service role has unrestricted access
  auth.role() = 'service_role' OR
  -- Authenticated users can view all partner companies
  -- (membership filtering happens at application level)
  auth.uid() IS NOT NULL
);

-- INSERT: Service role only (Edge Function handles creation)
CREATE POLICY "partner_company_insert_policy" ON partner_company
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
);

-- UPDATE: Service role only for now
-- In future, can add logic to check ownership via application
CREATE POLICY "partner_company_update_policy" ON partner_company
FOR UPDATE
USING (
  auth.role() = 'service_role'
)
WITH CHECK (
  auth.role() = 'service_role'
);

-- DELETE: Service role only
CREATE POLICY "partner_company_delete_policy" ON partner_company
FOR DELETE
USING (
  auth.role() = 'service_role'
);

-- ============================================================================
-- Fix RLS Policies for partner_memberships
-- ============================================================================
DROP POLICY IF EXISTS "partner_memberships_select_policy" ON partner_memberships;
DROP POLICY IF EXISTS "partner_memberships_insert_policy" ON partner_memberships;
DROP POLICY IF EXISTS "partner_memberships_update_policy" ON partner_memberships;
DROP POLICY IF EXISTS "partner_memberships_delete_policy" ON partner_memberships;

-- SELECT: Users can view their own memberships
CREATE POLICY "partner_memberships_select_policy" ON partner_memberships
FOR SELECT
USING (
  -- Service role has unrestricted access
  auth.role() = 'service_role' OR
  -- Users can view their own memberships
  business_users_id = auth.uid()
);

-- INSERT: Service role only (Edge Function handles creation)
CREATE POLICY "partner_memberships_insert_policy" ON partner_memberships
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
);

-- UPDATE: Service role only
CREATE POLICY "partner_memberships_update_policy" ON partner_memberships
FOR UPDATE
USING (
  auth.role() = 'service_role'
)
WITH CHECK (
  auth.role() = 'service_role'
);

-- DELETE: Service role only
CREATE POLICY "partner_memberships_delete_policy" ON partner_memberships
FOR DELETE
USING (
  auth.role() = 'service_role'
);

-- ============================================================================
-- Add helpful comments
-- ============================================================================
COMMENT ON POLICY "partner_company_select_policy" ON partner_company IS
'Allows service role and all authenticated users to view partner companies. Membership filtering is handled at application level.';

COMMENT ON POLICY "partner_memberships_select_policy" ON partner_memberships IS
'Users can only view their own memberships to avoid infinite recursion with partner_company policies.';
