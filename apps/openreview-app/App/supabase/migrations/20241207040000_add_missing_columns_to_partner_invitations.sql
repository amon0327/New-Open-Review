-- Add missing columns to partner_user_invitations table

-- Add invited_by column
ALTER TABLE partner_user_invitations
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add other missing columns
ALTER TABLE partner_user_invitations
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS partner_company_id UUID REFERENCES partner_company(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner' CHECK (role = 'owner'),
ADD COLUMN IF NOT EXISTS token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'completed', 'expired')),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days');

-- Add primary key if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_user_invitations_pkey'
  ) THEN
    ALTER TABLE partner_user_invitations ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Add unique constraint on token if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_user_invitations_token_key'
  ) THEN
    ALTER TABLE partner_user_invitations ADD UNIQUE (token);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_partner_user_invitations_token ON partner_user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_partner_user_invitations_partner_company ON partner_user_invitations(partner_company_id);
CREATE INDEX IF NOT EXISTS idx_partner_user_invitations_status ON partner_user_invitations(status);

-- Create trigger for updated_at if not exists
DROP TRIGGER IF EXISTS update_partner_user_invitations_updated_at ON partner_user_invitations;
CREATE TRIGGER update_partner_user_invitations_updated_at
BEFORE UPDATE ON partner_user_invitations
FOR EACH ROW
EXECUTE FUNCTION update_partner_updated_at();

-- Enable Row Level Security
ALTER TABLE partner_user_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "partner_user_invitations_service_role_all" ON partner_user_invitations;
DROP POLICY IF EXISTS "partner_user_invitations_authenticated_select" ON partner_user_invitations;

-- RLS Policies
-- Service role has full access
CREATE POLICY "partner_user_invitations_service_role_all" ON partner_user_invitations
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can view invitations for their partner companies
CREATE POLICY "partner_user_invitations_authenticated_select" ON partner_user_invitations
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  partner_company_id IN (
    SELECT partner_company_id
    FROM partner_memberships
    WHERE business_users_id = auth.uid() AND is_active = TRUE
  )
);

-- Comments for documentation
COMMENT ON TABLE partner_user_invitations IS 'Invitations for partner company members';
COMMENT ON COLUMN partner_user_invitations.invited_by IS 'User who created the invitation';
COMMENT ON COLUMN partner_user_invitations.name IS 'Name of the person being invited';
COMMENT ON COLUMN partner_user_invitations.role IS 'Role for the invited user (currently only owner is supported)';
COMMENT ON COLUMN partner_user_invitations.token IS 'Unique token for the invitation URL';
COMMENT ON COLUMN partner_user_invitations.status IS 'Invitation status: invited, completed, or expired';
