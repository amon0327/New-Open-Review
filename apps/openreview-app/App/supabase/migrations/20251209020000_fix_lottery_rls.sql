-- Fix RLS policies for lottery table
-- Allow access based on review_form ownership (via company_memberships and partner_memberships)

-- Enable RLS on lottery table
ALTER TABLE lottery ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "lottery_select" ON lottery;
DROP POLICY IF EXISTS "lottery_insert" ON lottery;
DROP POLICY IF EXISTS "lottery_update" ON lottery;
DROP POLICY IF EXISTS "lottery_delete" ON lottery;

-- SELECT Policy
CREATE POLICY "lottery_select" ON lottery
FOR SELECT USING (public.user_has_review_form_access(review_form_id));

-- INSERT Policy (service_role or form owner)
CREATE POLICY "lottery_insert" ON lottery
FOR INSERT WITH CHECK (
  auth.role() = 'service_role'
  OR
  public.user_has_review_form_access(review_form_id)
);

-- UPDATE Policy
CREATE POLICY "lottery_update" ON lottery
FOR UPDATE USING (public.user_has_review_form_access(review_form_id))
WITH CHECK (public.user_has_review_form_access(review_form_id));

-- DELETE Policy
CREATE POLICY "lottery_delete" ON lottery
FOR DELETE USING (public.user_has_review_form_access(review_form_id));

-- Comments for documentation
COMMENT ON POLICY "lottery_select" ON lottery IS
  'Allows users to view lottery settings for forms they have access to';
COMMENT ON POLICY "lottery_update" ON lottery IS
  'Allows users to update lottery settings for forms they have access to';
