-- Create partner_affiliate_companies junction table
-- Links companies to partner companies

-- ============================================================================
-- Create partner_affiliate_companies table (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.partner_affiliate_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  partner_company_id uuid NULL,
  companies_id uuid NULL,
  CONSTRAINT partner_affiliate_companies_pkey PRIMARY KEY (id),
  CONSTRAINT partner_affiliate_companies_companies_id_fkey FOREIGN KEY (companies_id)
    REFERENCES companies (id) ON DELETE CASCADE,
  CONSTRAINT partner_affiliate_companies_partner_company_id_fkey FOREIGN KEY (partner_company_id)
    REFERENCES partner_company (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ============================================================================
-- Enable RLS
-- ============================================================================
ALTER TABLE partner_affiliate_companies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "partner_affiliate_companies_service_role_all" ON partner_affiliate_companies;
DROP POLICY IF EXISTS "partner_affiliate_companies_authenticated_select" ON partner_affiliate_companies;

-- Service Role has full access (for Edge Functions)
CREATE POLICY "partner_affiliate_companies_service_role_all" ON partner_affiliate_companies
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can view affiliations for their partner company
CREATE POLICY "partner_affiliate_companies_authenticated_select" ON partner_affiliate_companies
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  partner_company_id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid()
  )
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_partner_affiliate_companies_partner_company_id
  ON partner_affiliate_companies(partner_company_id);

CREATE INDEX IF NOT EXISTS idx_partner_affiliate_companies_companies_id
  ON partner_affiliate_companies(companies_id);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE partner_affiliate_companies IS
  'Junction table linking companies to partner companies';

COMMENT ON POLICY "partner_affiliate_companies_service_role_all" ON partner_affiliate_companies IS
  'Allows Service Role (Edge Functions) full access to partner_affiliate_companies table';

COMMENT ON POLICY "partner_affiliate_companies_authenticated_select" ON partner_affiliate_companies IS
  'Allows authenticated users to view affiliations for their partner company';
