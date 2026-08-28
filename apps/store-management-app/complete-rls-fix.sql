-- store_memberships RLS 完全修正版
-- stores テーブルを一切参照しない方式

-- 1. 全てのRLSポリシーを削除して一旦リセット
DROP POLICY IF EXISTS "users_can_view_company_store_memberships_v1" ON public.store_memberships;

-- 他の既存ポリシーも削除
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'store_memberships'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.store_memberships';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- 2. 最もシンプルな解決策: 自分のメンバーシップのみ
CREATE POLICY "own_memberships_only" 
ON public.store_memberships
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND business_user_id = auth.uid()
);

-- 書き込み制限
CREATE POLICY "deny_memberships_write"
ON public.store_memberships
FOR INSERT, UPDATE, DELETE
USING (false);

-- 3. 段階的テスト後に適用する拡張版
-- stores テーブルを参照しない会社ベースアクセス

/*
-- この部分は上記のシンプル版で動作確認後に実行

DROP POLICY IF EXISTS "own_memberships_only" ON public.store_memberships;

-- 会社情報を事前に取得するためのマテリアライズドビューまたは関数を使用
CREATE OR REPLACE VIEW user_company_info AS
SELECT DISTINCT
  cm.business_user_id,
  cm.company_id,
  s.id as store_id
FROM company_memberships cm
INNER JOIN stores s ON s.company_id = cm.company_id;

-- この場合も循環参照になる可能性があります...
*/

-- 4. 最終的な解決策: 完全に別のアプローチ

-- 方法A: RLSを無効化してアプリケーションレベルで制御
-- ALTER TABLE public.store_memberships DISABLE ROW LEVEL SECURITY;

-- 方法B: 非常にシンプルなポリシー（現在のユーザーのメンバーシップのみ）
-- 既に上記で実装済み

-- 方法C: 関数ベースの完全な代替案
CREATE OR REPLACE FUNCTION get_user_accessible_memberships(user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  business_user_id uuid,
  store_id uuid,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- この関数内ではRLSが適用されないため、安全にJOINできる
  RETURN QUERY
  SELECT 
    sm.id,
    sm.business_user_id,
    sm.store_id,
    sm.role
  FROM store_memberships sm
  INNER JOIN stores s ON sm.store_id = s.id
  INNER JOIN company_memberships cm ON s.company_id = cm.company_id
  WHERE cm.business_user_id = user_id;
END;
$$;

-- フロントエンドでは以下のように使用:
-- SELECT * FROM get_user_accessible_memberships();

-- 5. 現在の状況確認用クエリ
SELECT 'Current RLS policies on store_memberships:' as info;

SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'store_memberships';

-- 6. テスト用クエリ
/*
-- 以下を順番に実行してテスト

-- 1. 認証状態確認
SELECT auth.uid(), auth.role();

-- 2. 自分のメンバーシップ確認（RLS適用）
SELECT * FROM store_memberships;

-- 3. 関数経由でのアクセス確認
SELECT * FROM get_user_accessible_memberships();

-- 4. エラーが出ないことを確認
SELECT COUNT(*) FROM store_memberships;
*/

-- 7. 最も安全な一時的解決策（推奨）
-- もし上記でもエラーが出る場合は、一旦RLSを完全に無効化

/*
-- 緊急時のみ実行
ALTER TABLE public.store_memberships DISABLE ROW LEVEL SECURITY;
*/