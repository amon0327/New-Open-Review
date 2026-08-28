-- Add partner access policies for stores table only

DROP POLICY IF EXISTS "stores_partner_select" ON stores;
DROP POLICY IF EXISTS "stores_partner_insert" ON stores;
DROP POLICY IF EXISTS "stores_partner_update" ON stores;
DROP POLICY IF EXISTS "stores_partner_delete" ON stores;

CREATE POLICY "stores_partner_select" ON stores
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "stores_partner_insert" ON stores
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "stores_partner_update" ON stores
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

CREATE POLICY "stores_partner_delete" ON stores
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  company_id IN (
    SELECT companies_id
    FROM partner_affiliate_companies
    WHERE partner_company_id IN (
      SELECT partner_company_id
      FROM partner_memberships
      WHERE business_users_id = auth.uid()
    )
  )
);

COMMENT ON POLICY "stores_partner_select" ON stores IS
  'Allows partner company members to view stores of affiliated companies';

COMMENT ON POLICY "stores_partner_insert" ON stores IS
  'Allows partner company members to create stores for affiliated companies';

COMMENT ON POLICY "stores_partner_update" ON stores IS
  'Allows partner company members to update stores of affiliated companies';

COMMENT ON POLICY "stores_partner_delete" ON stores IS
  'Allows partner company members to delete stores of affiliated companies';
