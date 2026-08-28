-- Recreate Partner tables with correct schema
-- This migration drops existing partner tables and recreates them with the correct structure
-- Partner company registration is handled via Edge Function to bypass RLS

-- ============================================================================
-- Drop existing tables and dependencies
-- ============================================================================
DROP TRIGGER IF EXISTS update_partner_company_updated_at ON partner_company;
DROP TRIGGER IF EXISTS update_partner_memberships_updated_at ON partner_memberships;
DROP TABLE IF EXISTS partner_memberships CASCADE;
DROP TABLE IF EXISTS partner_company CASCADE;

-- ============================================================================
-- Create partner_company table
-- ============================================================================
CREATE TABLE public.partner_company (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  company_name TEXT NULL,
  website_url TEXT NULL,
  phone TEXT NULL,
  email TEXT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  description TEXT NULL,
  logo_url TEXT NULL,
  address TEXT NULL,
  is_active BOOLEAN NULL DEFAULT TRUE,
  CONSTRAINT partner_accounts_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create indexes for partner_company
CREATE INDEX IF NOT EXISTS idx_partner_company_name ON public.partner_company
USING btree (company_name) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_partner_company_active ON public.partner_company
USING btree (is_active) TABLESPACE pg_default
WHERE (is_active = TRUE);

-- ============================================================================
-- Create partner_memberships table
-- ============================================================================
CREATE TABLE public.partner_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  business_users_id UUID NULL,
  partner_company_id UUID NULL,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  role TEXT NOT NULL DEFAULT 'member'::TEXT,
  is_active BOOLEAN NULL DEFAULT TRUE,
  CONSTRAINT partner_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT partner_memberships_business_users_id_fkey FOREIGN KEY (business_users_id)
    REFERENCES business_users (id) ON DELETE CASCADE,
  CONSTRAINT partner_memberships_partner_company_id_fkey FOREIGN KEY (partner_company_id)
    REFERENCES partner_company (id) ON DELETE CASCADE,
  CONSTRAINT partner_memberships_role_check CHECK (
    (role = ANY (ARRAY['owner'::TEXT, 'admin'::TEXT, 'member'::TEXT]))
  )
) TABLESPACE pg_default;

-- Create indexes for partner_memberships
CREATE INDEX IF NOT EXISTS idx_partner_memberships_user ON public.partner_memberships
USING btree (business_users_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_partner_memberships_company ON public.partner_memberships
USING btree (partner_company_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_partner_memberships_active ON public.partner_memberships
USING btree (is_active) TABLESPACE pg_default
WHERE (is_active = TRUE);

-- ============================================================================
-- Create or replace update function
-- ============================================================================
CREATE OR REPLACE FUNCTION update_partner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_partner_company_updated_at
BEFORE UPDATE ON partner_company
FOR EACH ROW
EXECUTE FUNCTION update_partner_updated_at();

CREATE TRIGGER update_partner_memberships_updated_at
BEFORE UPDATE ON partner_memberships
FOR EACH ROW
EXECUTE FUNCTION update_partner_updated_at();

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
ALTER TABLE partner_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies - Edge Function only (Service Role)
-- ============================================================================

-- Partner Company Policies
CREATE POLICY "partner_company_service_role_all" ON partner_company
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "partner_company_authenticated_select" ON partner_company
FOR SELECT
USING (
  -- Authenticated users can view partner companies they are members of
  auth.uid() IS NOT NULL AND
  id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid() AND is_active = TRUE
  )
);

-- Partner Memberships Policies
CREATE POLICY "partner_memberships_service_role_all" ON partner_memberships
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "partner_memberships_authenticated_select" ON partner_memberships
FOR SELECT
USING (
  -- Users can view their own memberships
  auth.uid() IS NOT NULL AND
  business_users_id = auth.uid()
);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE partner_company IS 'Partner companies managed via Edge Function to bypass RLS during creation';
COMMENT ON TABLE partner_memberships IS 'Links business users to partner companies';
COMMENT ON COLUMN partner_memberships.business_users_id IS 'References business_users table (not auth.users)';
COMMENT ON COLUMN partner_memberships.role IS 'User role: owner, admin, or member';
