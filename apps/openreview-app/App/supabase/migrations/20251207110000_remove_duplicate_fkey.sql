-- Remove duplicate foreign key constraint on company_user_invitations
-- There are two constraints: company_user_invitations1_company_id_fkey and company_user_invitations_company_id_fkey
-- We keep company_user_invitations_company_id_fkey and remove the duplicate

DO $$
BEGIN
  -- Drop the duplicate constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_user_invitations1_company_id_fkey'
  ) THEN
    ALTER TABLE company_user_invitations
    DROP CONSTRAINT company_user_invitations1_company_id_fkey;
    RAISE NOTICE 'Dropped duplicate constraint: company_user_invitations1_company_id_fkey';
  ELSE
    RAISE NOTICE 'Constraint company_user_invitations1_company_id_fkey does not exist';
  END IF;
END $$;
