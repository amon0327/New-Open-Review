-- stores テーブル用の循環参照なしRLSポリシー
-- business_usersテーブルを参照せずに権限チェック

-- 1. 全てのRLSを一旦無効化（循環参照を解決）
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_memberships DISABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを全て削除
DROP POLICY IF EXISTS "users_can_view_assigned_stores" ON public.stores;
DROP POLICY IF EXISTS "users_can_view_their_assigned_stores" ON public.stores;
DROP POLICY IF EXISTS "deny_all_store_inserts" ON public.stores;
DROP POLICY IF EXISTS "deny_all_store_updates" ON public.stores;
DROP POLICY IF EXISTS "deny_all_store_deletes" ON public.stores;

-- 3. store_membershipsテーブルを直接参照するシンプルなポリシー
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_stores_simple" 
ON public.stores
FOR SELECT
USING (
  -- 認証されたユーザーのみ
  auth.role() = 'authenticated'
  AND
  -- business_usersテーブルを経由せず、直接store_membershipsをチェック
  -- これにより循環参照を回避
  EXISTS (
    SELECT 1 
    FROM store_memberships sm
    WHERE sm.business_user_id = auth.uid()  -- 直接現在のユーザーIDと比較
    AND sm.store_id = stores.id             -- この店舗への権限があるか
  )
);

-- 4. 書き込み操作を拒否（閲覧専用）
CREATE POLICY "deny_stores_write_operations"
ON public.stores
FOR ALL
USING (false)
WITH CHECK (false);

-- ただし、SELECT操作は上記のポリシーを適用
DROP POLICY IF EXISTS "deny_stores_write_operations" ON public.stores;

CREATE POLICY "deny_stores_insert"
ON public.stores
FOR INSERT
WITH CHECK (false);

CREATE POLICY "deny_stores_update"
ON public.stores
FOR UPDATE
USING (false)
WITH CHECK (false);

CREATE POLICY "deny_stores_delete"
ON public.stores
FOR DELETE
USING (false);

-- 5. 必要に応じてbusiness_usersテーブルにもシンプルなRLS
/*
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールのみ閲覧可能
CREATE POLICY "users_can_view_own_business_profile" 
ON public.business_users
FOR SELECT
USING (id = auth.uid());

-- 書き込み操作は管理者のみ（またはシステムのみ）
CREATE POLICY "system_only_business_users_write"
ON public.business_users
FOR ALL
USING (false)
WITH CHECK (false);
*/

-- 6. store_membershipsテーブル用のRLS（オプション）
/*
ALTER TABLE public.store_memberships ENABLE ROW LEVEL SECURITY;

-- 自分に関連するメンバーシップのみ閲覧可能
CREATE POLICY "users_can_view_own_memberships" 
ON public.store_memberships
FOR SELECT
USING (business_user_id = auth.uid());

-- 書き込み操作は管理者のみ
CREATE POLICY "system_only_memberships_write"
ON public.store_memberships
FOR ALL
USING (false)
WITH CHECK (false);
*/

-- 7. 動作確認用クエリ
/*
-- 現在のユーザーを確認
SELECT auth.uid() as current_user, auth.role() as role;

-- 直接store_membershipsをチェック
SELECT 
  sm.business_user_id,
  sm.store_id,
  sm.role
FROM store_memberships sm
WHERE sm.business_user_id = auth.uid();

-- RLS適用後のstores取得テスト
SELECT id, name, address FROM stores;
*/