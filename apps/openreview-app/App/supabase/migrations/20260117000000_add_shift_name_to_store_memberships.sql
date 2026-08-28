-- Add shift_name column to store_memberships table
ALTER TABLE store_memberships
ADD COLUMN IF NOT EXISTS shift_name TEXT;

-- Add index for shift_name for better performance
CREATE INDEX IF NOT EXISTS idx_store_memberships_shift_name ON store_memberships(shift_name);

-- Comment for documentation
COMMENT ON COLUMN store_memberships.shift_name IS 'シフト名（招待時に指定された名前）';
