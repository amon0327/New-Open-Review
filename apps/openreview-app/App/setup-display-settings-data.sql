-- Setup script for question display settings functionality
-- Run this in Supabase SQL Editor to fix RLS and add test data

-- Step 1: Temporarily disable RLS for data insertion
ALTER TABLE public.question_display_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_display_rule_settings DISABLE ROW LEVEL SECURITY;

-- Step 2: Insert some test display settings
-- First, let's get some question IDs to work with
INSERT INTO public.question_display_settings (review_question_id, display_name) 
SELECT 
    id as review_question_id,
    'アプリ表示: ' || SUBSTRING(question_text, 1, 30) || CASE WHEN LENGTH(question_text) > 30 THEN '...' ELSE '' END as display_name
FROM public.review_questions 
WHERE question_types_id IN (1, 2, 3, 5, 8) -- Include different question types
LIMIT 5
ON CONFLICT (review_question_id) DO NOTHING; -- Avoid duplicates if this is run multiple times

-- Step 3: Add some rule settings for question types that need them (3, 5, 8)
INSERT INTO public.question_display_rule_settings (question_display_settings_id, nps_segments, question_option_choices_id)
SELECT 
    qds.id as question_display_settings_id,
    CASE 
        WHEN rq.question_types_id = 8 THEN 'promoter'  -- NPS questions get promoter segment
        WHEN rq.question_types_id = 5 THEN 'passive'   -- Linear scale gets passive
        ELSE NULL
    END as nps_segments,
    qoc.id as question_option_choices_id
FROM public.question_display_settings qds
JOIN public.review_questions rq ON rq.id = qds.review_question_id
LEFT JOIN public.question_option_choices qoc ON qoc.review_questions_id = rq.id AND qoc.choice_number = 1
WHERE rq.question_types_id IN (3, 5, 8) -- Only for question types that need rules
LIMIT 3
ON CONFLICT DO NOTHING;

-- Step 4: Re-enable RLS with proper policies
ALTER TABLE public.question_display_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_display_rule_settings ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop any existing restrictive policies
DROP POLICY IF EXISTS "question_display_settings_policy" ON public.question_display_settings;
DROP POLICY IF EXISTS "question_display_rule_settings_policy" ON public.question_display_rule_settings;
DROP POLICY IF EXISTS "dev_question_display_settings_policy" ON public.question_display_settings;
DROP POLICY IF EXISTS "dev_question_display_rule_settings_policy" ON public.question_display_rule_settings;

-- Step 6: Create permissive policies for development
CREATE POLICY "dev_question_display_settings_policy" 
ON public.question_display_settings 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "dev_question_display_rule_settings_policy" 
ON public.question_display_rule_settings 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Step 7: Ensure proper grants
GRANT ALL ON public.question_display_settings TO anon, authenticated, public;
GRANT ALL ON public.question_display_rule_settings TO anon, authenticated, public;

-- Step 8: Verify the setup
SELECT 
    'Display Settings Created' as status,
    COUNT(*) as count
FROM public.question_display_settings
UNION ALL
SELECT 
    'Rule Settings Created' as status,
    COUNT(*) as count  
FROM public.question_display_rule_settings
UNION ALL
SELECT 
    'Available Questions' as status,
    COUNT(*) as count
FROM public.review_questions
UNION ALL
SELECT 
    'Available Forms' as status,
    COUNT(*) as count
FROM public.review_forms WHERE is_deleted = false;