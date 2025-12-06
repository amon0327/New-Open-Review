-- Update Partner Company tables to add missing columns
-- This migration adds columns and features to existing partner tables

-- ============================================================================
-- Add missing columns to partner_company (if they don't exist)
-- ============================================================================
DO $$
BEGIN
  -- Add updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'partner_company'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE partner_company ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add description column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'partner_company'
      AND column_name = 'description'
  ) THEN
    ALTER TABLE partner_company ADD COLUMN description TEXT;
  END IF;

  -- Add logo_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'partner_company'
      AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE partner_company ADD COLUMN logo_url TEXT;
  END IF;

  -- Add address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'partner_company'
      AND column_name = 'address'
  ) THEN
    ALTER TABLE partner_company ADD COLUMN address TEXT;
  END IF;

  -- Add is_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'partner_company'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE partner_company ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ============================================================================
-- Add missing columns to partner_memberships (if they don't exist)
-- ============================================================================
DO $$
BEGIN
  -- Add updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'partner_memberships'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE partner_memberships ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add role column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'partner_memberships'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE partner_memberships ADD COLUMN role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member'));
  END IF;

  -- Add is_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'partner_memberships'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE partner_memberships ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ============================================================================
-- Create Indexes (if they don't exist)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_partner_company_name ON partner_company(company_name);
CREATE INDEX IF NOT EXISTS idx_partner_company_active ON partner_company(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_partner_memberships_user ON partner_memberships(business_users_id);
CREATE INDEX IF NOT EXISTS idx_partner_memberships_company ON partner_memberships(partner_company_id);
CREATE INDEX IF NOT EXISTS idx_partner_memberships_active ON partner_memberships(is_active) WHERE is_active = true;

-- ============================================================================
-- Update RLS Policies
-- ============================================================================
-- Drop and recreate policies for partner_company
DROP POLICY IF EXISTS "partner_company_select_policy" ON partner_company;
DROP POLICY IF EXISTS "partner_company_insert_policy" ON partner_company;
DROP POLICY IF EXISTS "partner_company_update_policy" ON partner_company;
DROP POLICY IF EXISTS "partner_company_delete_policy" ON partner_company;

CREATE POLICY "partner_company_select_policy" ON partner_company
FOR SELECT
USING (
  auth.role() = 'service_role' OR
  id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "partner_company_insert_policy" ON partner_company
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "partner_company_update_policy" ON partner_company
FOR UPDATE
USING (
  auth.role() = 'service_role' OR
  id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  auth.role() = 'service_role' OR
  id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "partner_company_delete_policy" ON partner_company
FOR DELETE
USING (auth.role() = 'service_role');

-- Drop and recreate policies for partner_memberships
DROP POLICY IF EXISTS "partner_memberships_select_policy" ON partner_memberships;
DROP POLICY IF EXISTS "partner_memberships_insert_policy" ON partner_memberships;
DROP POLICY IF EXISTS "partner_memberships_update_policy" ON partner_memberships;
DROP POLICY IF EXISTS "partner_memberships_delete_policy" ON partner_memberships;

CREATE POLICY "partner_memberships_select_policy" ON partner_memberships
FOR SELECT
USING (
  auth.role() = 'service_role' OR
  business_users_id = auth.uid() OR
  partner_company_id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "partner_memberships_insert_policy" ON partner_memberships
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "partner_memberships_update_policy" ON partner_memberships
FOR UPDATE
USING (
  auth.role() = 'service_role' OR
  business_users_id = auth.uid() OR
  partner_company_id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  auth.role() = 'service_role' OR
  business_users_id = auth.uid() OR
  partner_company_id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "partner_memberships_delete_policy" ON partner_memberships
FOR DELETE
USING (auth.role() = 'service_role');

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_partner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_partner_company_updated_at ON partner_company;
CREATE TRIGGER update_partner_company_updated_at
  BEFORE UPDATE ON partner_company
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_updated_at();

DROP TRIGGER IF EXISTS update_partner_memberships_updated_at ON partner_memberships;
CREATE TRIGGER update_partner_memberships_updated_at
  BEFORE UPDATE ON partner_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_updated_at();

-- ============================================================================
-- Add comments for documentation
-- ============================================================================
COMMENT ON TABLE partner_company IS 'Stores information about partner companies in the system';
COMMENT ON TABLE partner_memberships IS 'Links business users to partner companies with role-based access';

COMMENT ON COLUMN partner_company.company_name IS 'Name of the partner company';
COMMENT ON COLUMN partner_company.is_active IS 'Soft delete flag - false means company is deactivated';
COMMENT ON COLUMN partner_memberships.business_users_id IS 'Reference to auth.users.id';
COMMENT ON COLUMN partner_memberships.role IS 'User role in partner company (owner, admin, member)';
COMMENT ON COLUMN partner_memberships.is_active IS 'Soft delete flag - false means membership is deactivated';
