-- 緊急対応: store_memberships の循環参照RLS修正
-- 最小限の変更で問題を解決

-- ===== 緊急対応手順 =====

-- 1. 問題のあるポリシーを特定・削除
-- store_memberships テーブルの全ポリシーを確認
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'store_memberships';

-- 循環参照の原因となっているポリシーを削除
-- （具体的なポリシー名は上記の結果から確認してください）

-- 一時的に全ポリシーを削除する場合:
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
    END LOOP;
END $$;

-- 2. シンプルで安全な代替ポリシーを設定

-- 最もシンプルな方式: 自分のメンバーシップのみ
CREATE POLICY "simple_own_memberships_only" 
ON public.store_memberships
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND business_user_id = auth.uid()
);

-- 書き込み制限
CREATE POLICY "no_write_store_memberships"
ON public.store_memberships
FOR ALL
USING (false)
WITH CHECK (false);

-- SELECT以外を無効化
ALTER POLICY "no_write_store_memberships" ON public.store_memberships RENAME TO "temp_policy";
DROP POLICY "temp_policy" ON public.store_memberships;

CREATE POLICY "deny_memberships_insert"
ON public.store_memberships
FOR INSERT
WITH CHECK (false);

CREATE POLICY "deny_memberships_update"
ON public.store_memberships
FOR UPDATE
USING (false)
WITH CHECK (false);

CREATE POLICY "deny_memberships_delete"
ON public.store_memberships
FOR DELETE
USING (false);

-- 3. 段階的に機能を復元（テスト後に実行）

-- 段階1: まず上記のシンプルなポリシーでテスト
-- 段階2: 動作確認後、会社ベースのアクセスを追加

-- 会社ベースアクセス（循環参照なし）
/*
DROP POLICY IF EXISTS "simple_own_memberships_only" ON public.store_memberships;

CREATE POLICY "company_based_memberships_safe" 
ON public.store_memberships
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND
  (
    -- 自分のメンバーシップ
    business_user_id = auth.uid()
    OR
    -- 同じ会社の店舗のメンバーシップ（循環参照回避版）
    EXISTS (
      SELECT 1 
      FROM company_memberships cm1, company_memberships cm2, stores s
      WHERE cm1.business_user_id = auth.uid()        -- 現在のユーザーの会社
      AND cm2.company_id = cm1.company_id            -- 同じ会社
      AND s.company_id = cm2.company_id              -- その会社の店舗
      AND s.id = store_memberships.store_id          -- そのメンバーシップの店舗
    )
  )
);
*/

-- 4. 最も安全な関数ベース代替案

-- ユーザーがアクセス可能な店舗メンバーシップを取得する関数
CREATE OR REPLACE FUNCTION get_accessible_store_memberships(user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  membership_id uuid,
  business_user_id uuid,
  store_id uuid,
  role text,
  store_name text,
  company_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id as membership_id,
    sm.business_user_id,
    sm.store_id,
    sm.role,
    s.name as store_name,
    s.company_id
  FROM store_memberships sm
  INNER JOIN stores s ON sm.store_id = s.id
  WHERE sm.business_user_id = user_id
     OR s.company_id IN (
       SELECT cm.company_id 
       FROM company_memberships cm 
       WHERE cm.business_user_id = user_id
     );
END;
$$;

-- この関数をフロントエンドから使用:
-- SELECT * FROM get_accessible_store_memberships();

-- 5. 動作確認用クエリ

-- 現在のRLS状態を確認
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'store_memberships';

-- 現在のポリシーを確認
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'store_memberships';

-- アクセステスト
SELECT COUNT(*) FROM store_memberships;  -- これでエラーが出なければ成功