-- Add DELETE policy for partner_user_invitations
-- Allow authenticated users to delete invitations for their partner companies

CREATE POLICY "partner_user_invitations_authenticated_delete" ON partner_user_invitations
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  partner_company_id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid()
      AND is_active = TRUE
      AND role IN ('owner', 'admin')
  )
);

-- Add UPDATE policy for partner_user_invitations (for future use)
CREATE POLICY "partner_user_invitations_authenticated_update" ON partner_user_invitations
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  partner_company_id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid()
      AND is_active = TRUE
      AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  partner_company_id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid()
      AND is_active = TRUE
      AND role IN ('owner', 'admin')
  )
);
