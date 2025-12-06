-- Add name column to partner_user_invitations table
ALTER TABLE partner_user_invitations
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add index for name for better performance
CREATE INDEX IF NOT EXISTS idx_partner_user_invitations_name ON partner_user_invitations(name);
