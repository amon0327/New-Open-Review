-- Add shift_name column to store_invitations table
ALTER TABLE store_invitations
ADD COLUMN IF NOT EXISTS shift_name TEXT;

-- Add shift_name column to store_invitations if using old schema with 'name' column
ALTER TABLE store_invitations
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add index for shift_name for better performance
CREATE INDEX IF NOT EXISTS idx_store_invitations_shift_name ON store_invitations(shift_name);
