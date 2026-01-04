-- Drop existing foreign key constraints
ALTER TABLE public.lottery 
DROP CONSTRAINT IF EXISTS lottery_review_form_id_fkey;

ALTER TABLE public.store_review_forms 
DROP CONSTRAINT IF EXISTS store_review_forms_review_form_id_fkey;

-- Recreate foreign key constraints with ON DELETE CASCADE
ALTER TABLE public.lottery 
ADD CONSTRAINT lottery_review_form_id_fkey 
FOREIGN KEY (review_form_id) 
REFERENCES public.review_forms(id) 
ON DELETE CASCADE;

ALTER TABLE public.store_review_forms 
ADD CONSTRAINT store_review_forms_review_form_id_fkey 
FOREIGN KEY (review_form_id) 
REFERENCES public.review_forms(id) 
ON DELETE CASCADE;

-- Add comment explaining the CASCADE behavior
COMMENT ON CONSTRAINT lottery_review_form_id_fkey ON public.lottery IS 'Automatically deletes lottery records when the associated review form is deleted';
COMMENT ON CONSTRAINT store_review_forms_review_form_id_fkey ON public.store_review_forms IS 'Automatically deletes store-review form associations when the review form is deleted';