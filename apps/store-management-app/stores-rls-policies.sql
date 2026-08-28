-- stores テーブル用のRLS（Row Level Security）ポリシー
-- ユーザーが紐付いている店舗のみアクセス可能

-- 1. RLSを有効化
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを削除（必要に応じて）
DROP POLICY IF EXISTS "users_can_view_their_stores" ON public.stores;
DROP POLICY IF EXISTS "users_can_manage_their_stores" ON public.stores;
DROP POLICY IF EXISTS "store_managers_can_update" ON public.stores;
DROP POLICY IF EXISTS "store_admins_can_delete" ON public.stores;

-- 3. SELECT用ポリシー：ユーザーが紐付いている店舗のみ閲覧可能
CREATE POLICY "users_can_view_their_stores" 
ON public.stores
FOR SELECT
USING (
  -- 認証されたユーザーのみ
  auth.role() = 'authenticated'
  AND
  -- JWTのstore_idsに含まれる店舗のみアクセス可能
  id::text = ANY(
    COALESCE(
      (auth.jwt() -> 'app_metadata' -> 'store_ids')::text[],
      ARRAY[]::text[]
    )
  )
  AND
  -- store_accessがtrueの場合のみ（追加の安全性チェック）
  COALESCE((auth.jwt() -> 'app_metadata' ->> 'has_store_access')::boolean, false) = true
);

-- 4. INSERT用ポリシー：システム管理者またはcompany_idが一致する管理者のみ
CREATE POLICY "authorized_users_can_create_stores"
ON public.stores
FOR INSERT
WITH CHECK (
  -- 認証されたユーザーのみ
  auth.role() = 'authenticated'
  AND
  -- JWTに店舗アクセス権限がある
  COALESCE((auth.jwt() -> 'app_metadata' ->> 'has_store_access')::boolean, false) = true
  AND
  -- 少なくとも1つの店舗で管理者権限を持っている
  EXISTS (
    SELECT 1 
    FROM jsonb_each_text((auth.jwt() -> 'app_metadata' -> 'store_roles')::jsonb) AS roles(store_id, role)
    WHERE roles.role IN ('admin', 'manager')
  )
);

-- 5. UPDATE用ポリシー：対象店舗の管理者権限を持つユーザーのみ
CREATE POLICY "store_managers_can_update"
ON public.stores
FOR UPDATE
USING (
  -- 認証されたユーザーのみ
  auth.role() = 'authenticated'
  AND
  -- 対象店舗にアクセス権限がある
  id::text = ANY(
    COALESCE(
      (auth.jwt() -> 'app_metadata' -> 'store_ids')::text[],
      ARRAY[]::text[]
    )
  )
  AND
  -- 対象店舗で管理者権限を持っている
  COALESCE(
    (auth.jwt() -> 'app_metadata' -> 'store_roles' ->> id::text),
    ''
  ) IN ('admin', 'manager')
)
WITH CHECK (
  -- UPDATEの条件と同じ
  auth.role() = 'authenticated'
  AND
  id::text = ANY(
    COALESCE(
      (auth.jwt() -> 'app_metadata' -> 'store_ids')::text[],
      ARRAY[]::text[]
    )
  )
  AND
  COALESCE(
    (auth.jwt() -> 'app_metadata' -> 'store_roles' ->> id::text),
    ''
  ) IN ('admin', 'manager')
);

-- 6. DELETE用ポリシー：対象店舗の管理者権限を持つユーザーのみ
CREATE POLICY "store_admins_can_delete"
ON public.stores
FOR DELETE
USING (
  -- 認証されたユーザーのみ
  auth.role() = 'authenticated'
  AND
  -- 対象店舗にアクセス権限がある
  id::text = ANY(
    COALESCE(
      (auth.jwt() -> 'app_metadata' -> 'store_ids')::text[],
      ARRAY[]::text[]
    )
  )
  AND
  -- 対象店舗でadmin権限を持っている（削除はadminのみ）
  COALESCE(
    (auth.jwt() -> 'app_metadata' -> 'store_roles' ->> id::text),
    ''
  ) = 'admin'
);

-- 7. テスト用クエリ（実際の使用時にコメントアウト）
/*
-- RLSポリシーのテスト
-- ログインしたユーザーで以下を実行して動作確認

-- 1. 現在のJWTクレームを確認
SELECT 
  auth.jwt() -> 'app_metadata' -> 'store_ids' AS store_ids,
  auth.jwt() -> 'app_metadata' -> 'store_roles' AS store_roles,
  auth.jwt() -> 'app_metadata' ->> 'has_store_access' AS has_store_access;

-- 2. アクセス可能な店舗を取得
SELECT id, name, address FROM public.stores;

-- 3. 特定の店舗への権限確認
SELECT 
  id,
  name,
  id::text = ANY(
    COALESCE(
      (auth.jwt() -> 'app_metadata' -> 'store_ids')::text[],
      ARRAY[]::text[]
    )
  ) AS has_access,
  COALESCE(
    (auth.jwt() -> 'app_metadata' -> 'store_roles' ->> id::text),
    'no_role'
  ) AS user_role
FROM public.stores;
*/

-- 8. 管理用：RLSポリシーの確認
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'stores' AND schemaname = 'public';

-- 9. 管理用：RLSを無効化する場合（緊急時のみ）
-- ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;