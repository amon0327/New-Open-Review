-- stores テーブル用のRLS（Row Level Security）ポリシー
-- 閲覧専用：ユーザーが紐付いている店舗のみ閲覧可能

-- 1. RLSを有効化
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを全て削除
DROP POLICY IF EXISTS "users_can_view_their_stores" ON public.stores;
DROP POLICY IF EXISTS "users_can_manage_their_stores" ON public.stores;
DROP POLICY IF EXISTS "store_managers_can_update" ON public.stores;
DROP POLICY IF EXISTS "store_admins_can_delete" ON public.stores;
DROP POLICY IF EXISTS "authorized_users_can_create_stores" ON public.stores;

-- 3. SELECT専用ポリシー：ユーザーが紐付いている店舗のみ閲覧可能
CREATE POLICY "users_can_only_view_their_stores" 
ON public.stores
FOR SELECT
USING (
  -- 認証されたユーザーのみ
  auth.role() = 'authenticated'
  AND
  -- JWTのstore_idsに含まれる店舗のみアクセス可能
  (
    -- store_idsが存在し、現在の店舗IDが含まれている場合
    auth.jwt() -> 'app_metadata' -> 'store_ids' ? id::text
    OR
    -- 文字列の配列として検索（フォールバック）
    id::text = ANY(
      SELECT jsonb_array_elements_text(
        COALESCE(auth.jwt() -> 'app_metadata' -> 'store_ids', '[]'::jsonb)
      )
    )
  )
  AND
  -- store_accessがtrueの場合のみ（追加の安全性チェック）
  COALESCE((auth.jwt() -> 'app_metadata' ->> 'has_store_access')::boolean, false) = true
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

-- 5. ポリシーの確認用クエリ
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

-- 6. テスト用クエリ（実際の使用時にコメントアウト）
/*
-- RLSポリシーのテスト
-- ログインしたユーザーで以下を実行して動作確認

-- 1. 現在のJWTクレームを確認
SELECT 
  auth.jwt() -> 'app_metadata' -> 'store_ids' AS store_ids,
  auth.jwt() -> 'app_metadata' ->> 'has_store_access' AS has_store_access;

-- 2. アクセス可能な店舗を取得（SELECTのみ可能）
SELECT id, name, address FROM public.stores;

-- 3. INSERT テスト（失敗するはず）
-- INSERT INTO public.stores (name, address) VALUES ('テスト店舗', 'テスト住所');

-- 4. UPDATE テスト（失敗するはず）
-- UPDATE public.stores SET name = '更新テスト' WHERE id = 'some-id';

-- 5. DELETE テスト（失敗するはず）  
-- DELETE FROM public.stores WHERE id = 'some-id';
*/

-- 7. 管理用：RLSを無効化する場合（緊急時のみ）
-- ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;

-- 8. 管理用：ポリシーの削除（必要な場合のみ）
-- DROP POLICY IF EXISTS "users_can_only_view_their_stores" ON public.stores;
-- DROP POLICY IF EXISTS "deny_all_inserts" ON public.stores;
-- DROP POLICY IF EXISTS "deny_all_updates" ON public.stores;
-- DROP POLICY IF EXISTS "deny_all_deletes" ON public.stores;