-- Create question display settings tables for AppPage functionality
-- These tables are required for the App 表示設定 feature

-- Create question_display_settings table
CREATE TABLE IF NOT EXISTS public.question_display_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    review_question_id UUID REFERENCES public.review_questions(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Create question_display_rule_settings table for question types 3, 5, 8
CREATE TABLE IF NOT EXISTS public.question_display_rule_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    question_display_settings_id UUID REFERENCES public.question_display_settings(id) ON DELETE CASCADE,
    nps_segments TEXT, -- promoter, passive, detractor
    question_option_choices_id UUID REFERENCES public.question_option_choices(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_display_settings_review_question_id 
ON public.question_display_settings(review_question_id);

CREATE INDEX IF NOT EXISTS idx_question_display_rule_settings_display_settings_id 
ON public.question_display_rule_settings(question_display_settings_id);

-- Enable Row Level Security
ALTER TABLE public.question_display_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_display_rule_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (for now, allow all operations - can be refined later)
CREATE POLICY "Allow all operations on question_display_settings" 
ON public.question_display_settings 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on question_display_rule_settings" 
ON public.question_display_rule_settings 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.question_display_settings TO authenticated;
GRANT ALL ON public.question_display_rule_settings TO authenticated;
GRANT ALL ON public.question_display_settings TO anon;
GRANT ALL ON public.question_display_rule_settings TO anon;

-- Add comments for documentation
COMMENT ON TABLE public.question_display_settings IS 'Settings for which questions to display in the app viewer';
COMMENT ON TABLE public.question_display_rule_settings IS 'Rule settings for specific question types (3, 5, 8) that need additional filtering';

COMMENT ON COLUMN public.question_display_settings.review_question_id IS 'Reference to the question in review_questions table';
COMMENT ON COLUMN public.question_display_settings.display_name IS 'Custom display name for the question in the app';
COMMENT ON COLUMN public.question_display_settings.is_active IS 'Whether this display setting is currently active';

COMMENT ON COLUMN public.question_display_rule_settings.question_display_settings_id IS 'Reference to the parent display setting';
COMMENT ON COLUMN public.question_display_rule_settings.nps_segments IS 'NPS segment filter: promoter, passive, or detractor';
COMMENT ON COLUMN public.question_display_rule_settings.question_option_choices_id IS 'Reference to specific question option when filtering by choice';