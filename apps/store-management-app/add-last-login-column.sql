ALTER TABLE public.comment_page_view_log ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;
