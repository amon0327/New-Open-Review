-- Fix RLS policies for question_display_settings tables
-- Allow broader access for development/testing

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow all operations on question_display_settings" ON public.question_display_settings;
DROP POLICY IF EXISTS "Allow all operations on question_display_rule_settings" ON public.question_display_rule_settings;

-- Create more permissive policies for development
-- Note: In production, these should be more restrictive based on user authentication

-- Policy for question_display_settings
CREATE POLICY "question_display_settings_policy" 
ON public.question_display_settings 
FOR ALL 
TO public
USING (true) 
WITH CHECK (true);

-- Policy for question_display_rule_settings  
CREATE POLICY "question_display_rule_settings_policy" 
ON public.question_display_rule_settings 
FOR ALL 
TO public
USING (true) 
WITH CHECK (true);

-- Ensure proper grants are in place
GRANT ALL ON public.question_display_settings TO anon;
GRANT ALL ON public.question_display_settings TO authenticated;
GRANT ALL ON public.question_display_rule_settings TO anon;
GRANT ALL ON public.question_display_rule_settings TO authenticated;

-- Grant usage on sequences (if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;