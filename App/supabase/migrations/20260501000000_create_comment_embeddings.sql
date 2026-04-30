-- ========================================
-- コメント埋め込み (構想 #9: コメント埋め込み + クラスタリング)
-- ========================================
-- 顧客コメントを埋め込みベクトル化し、
-- 月次インサイト生成時に類似コメントをクラスタリングして
-- AI に「テーマ」として渡せるようにする。

-- pgvector 拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- comment_embeddings テーブル
CREATE TABLE IF NOT EXISTS public.comment_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.preset_question_answer_comment(id) ON DELETE CASCADE,
  store_id uuid NOT NULL,
  company_id uuid NOT NULL,
  year_month text NOT NULL,
  embedding vector(1536) NOT NULL,
  embedding_model text NOT NULL DEFAULT 'text-embedding-3-small',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, embedding_model)
);

CREATE INDEX IF NOT EXISTS comment_embeddings_store_month_idx
  ON public.comment_embeddings(store_id, year_month);

CREATE INDEX IF NOT EXISTS comment_embeddings_company_idx
  ON public.comment_embeddings(company_id);

-- コサイン類似度検索用 ivfflat インデックス
CREATE INDEX IF NOT EXISTS comment_embeddings_vector_idx
  ON public.comment_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS: service_role のみ
ALTER TABLE public.comment_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.comment_embeddings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 認証済ユーザーは自社のもののみ参照可
CREATE POLICY "company_users_select" ON public.comment_embeddings
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.business_users WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.comment_embeddings IS 'preset_question_answer_comment のコメント本文の埋め込みベクトル。月次インサイト生成時のクラスタリングに使用。';
