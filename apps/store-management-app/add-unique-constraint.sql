ALTER TABLE public.comment_page_view_log ADD CONSTRAINT unique_business_user_comment_view UNIQUE (business_user_id);
