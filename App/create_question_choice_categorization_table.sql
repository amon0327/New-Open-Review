-- Create question_choice_categorization table for manual categorization of question choices
-- This table stores the categorization of individual question choices into promoter/passive/detractor categories

-- Create question_choice_categorization table
CREATE TABLE IF NOT EXISTS public.question_choice_categorization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    review_question_id UUID REFERENCES public.review_questions(id) ON DELETE CASCADE,
    choice_id UUID REFERENCES public.question_option_choices(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('promoter', 'passive', 'detractor'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_choice_categorization_review_question_id 
ON public.question_choice_categorization(review_question_id);

CREATE INDEX IF NOT EXISTS idx_question_choice_categorization_choice_id 
ON public.question_choice_categorization(choice_id);

-- Create unique constraint to prevent duplicate categorizations
CREATE UNIQUE INDEX IF NOT EXISTS idx_question_choice_categorization_unique 
ON public.question_choice_categorization(review_question_id, choice_id);

-- Enable Row Level Security
ALTER TABLE public.question_choice_categorization ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations on question_choice_categorization for authenticated users" 
ON public.question_choice_categorization 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.question_choice_categorization TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.question_choice_categorization IS 'Manual categorization of question choices into promoter/passive/detractor categories for advanced filtering';
COMMENT ON COLUMN public.question_choice_categorization.review_question_id IS 'Reference to the question in review_questions table';
COMMENT ON COLUMN public.question_choice_categorization.choice_id IS 'Reference to the specific choice in question_option_choices table';
COMMENT ON COLUMN public.question_choice_categorization.category IS 'Category: promoter, passive, or detractor';