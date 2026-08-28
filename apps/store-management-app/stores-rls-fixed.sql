-- stores テーブル用のRLS（Row Level Security）ポリシー
-- 閲覧専用：ユーザーが紐付いている店舗のみ閲覧可能
-- JSONB配列のキャストエラーを修正

-- 1. RLSを有効化
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを全て削除
DROP POLICY IF EXISTS "users_can_view_their_stores" ON public.stores;
DROP POLICY IF EXISTS "users_can_manage_their_stores" ON public.stores;
DROP POLICY IF EXISTS "store_managers_can_update" ON public.stores;
DROP POLICY IF EXISTS "store_admins_can_delete" ON public.stores;
DROP POLICY IF EXISTS "authorized_users_can_create_stores" ON public.stores;
DROP POLICY IF EXISTS "users_can_only_view_their_stores" ON public.stores;
DROP POLICY IF EXISTS "deny_all_inserts" ON public.stores;
DROP POLICY IF EXISTS "deny_all_updates" ON public.stores;
DROP POLICY IF EXISTS "deny_all_deletes" ON public.stores;

-- 3. SELECT専用ポリシー：JSONB配列を正しく処理
CREATE POLICY "users_can_only_view_their_stores" 
ON public.stores
FOR SELECT
USING (
  -- 認証されたユーザーのみ
  auth.role() = 'authenticated'
  AND
  -- store_accessがtrueの場合のみ
  COALESCE((auth.jwt() -> 'app_metadata' ->> 'has_store_access')::boolean, false) = true
  AND
  -- JWTのstore_idsに含まれる店舗のみアクセス可能（JSONB配列を正しく処理）
  EXISTS (
    SELECT 1 
    FROM jsonb_array_elements_text(
      COALESCE(auth.jwt() -> 'app_metadata' -> 'store_ids', '[]'::jsonb)
    ) AS store_id
    WHERE store_id = id::text
  )
);

-- 4. INSERT、UPDATE、DELETE は全て拒否（閲覧専用）
-- INSERT用ポリシー：全てのINSERTを拒否
CREATE POLICY "deny_all_inserts"
ON public.stores
FOR INSERT
WITH CHECK (false);

-- UPDATE用ポリシー：全てのUPDATEを拒否
CREATE POLICY "deny_all_updates"
ON public.stores
FOR UPDATE
USING (false)
WITH CHECK (false);

-- DELETE用ポリシー：全てのDELETEを拒否
CREATE POLICY "deny_all_deletes"
ON public.stores
FOR DELETE
USING (false);

-- 5. より簡単な代替方法（上記でエラーが出る場合はこちらを使用）
/*
-- シンプルなJSONB配列チェック（コメントアウトを外して使用）
DROP POLICY IF EXISTS "users_can_only_view_their_stores" ON public.stores;

CREATE POLICY "users_can_only_view_their_stores_simple" 
ON public.stores
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  COALESCE((auth.jwt() -> 'app_metadata' ->> 'has_store_access')::boolean, false) = true
  AND
  -- JSON contains演算子を使用（より簡単な方法）
  (auth.jwt() -> 'app_metadata' -> 'store_ids')::jsonb @> to_jsonb(id::text)
);
*/

-- 6. ポリシーの確認用クエリ
/*
-- 現在適用されているポリシーを確認
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'stores' AND schemaname = 'public'
ORDER BY cmd, policyname;
*/

-- 7. テスト用クエリ（デバッグ用）
/*
-- JWTクレームの内容を確認
SELECT 
  auth.jwt() -> 'app_metadata' -> 'store_ids' AS store_ids_raw,
  auth.jwt() -> 'app_metadata' ->> 'has_store_access' AS has_store_access,
  jsonb_typeof(auth.jwt() -> 'app_metadata' -> 'store_ids') AS store_ids_type;

-- store_idsの配列要素を展開
SELECT jsonb_array_elements_text(
  COALESCE(auth.jwt() -> 'app_metadata' -> 'store_ids', '[]'::jsonb)
) AS store_id;

-- アクセス可能な店舗を取得
SELECT id, name, address FROM public.stores;
*/