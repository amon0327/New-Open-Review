-- Add foreign key constraint for partner_user_invitations -> partner_company
-- This is needed for Supabase queries with table joins

-- First, check if the constraint already exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'partner_user_invitations_partner_company_id_fkey'
  ) THEN
    ALTER TABLE partner_user_invitations
    DROP CONSTRAINT partner_user_invitations_partner_company_id_fkey;
  END IF;
END $$;

-- Add the foreign key constraint
ALTER TABLE partner_user_invitations
ADD CONSTRAINT partner_user_invitations_partner_company_id_fkey
FOREIGN KEY (partner_company_id)
REFERENCES partner_company(id)
ON DELETE CASCADE;

-- Add index on foreign key for better performance
CREATE INDEX IF NOT EXISTS idx_partner_user_invitations_partner_company_id
ON partner_user_invitations(partner_company_id);
