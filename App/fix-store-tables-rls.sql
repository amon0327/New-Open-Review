-- 店舗関連テーブルのRLSポリシーを修正
-- サービスロールには全アクセス許可、認証済みユーザーには制限付きアクセス

-- ==== store_invitations テーブル ====
ALTER TABLE store_invitations ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "store_invitations_service_role_policy" ON store_invitations;
DROP POLICY IF EXISTS "store_invitations_authenticated_policy" ON store_invitations;

-- サービスロール用ポリシー（全操作許可）
CREATE POLICY "store_invitations_service_role_policy" 
ON store_invitations
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 認証済みユーザー用ポリシー（制限付き）
CREATE POLICY "store_invitations_authenticated_policy" 
ON store_invitations
FOR SELECT
TO authenticated
USING (
  -- 自分の会社の店舗への招待のみ表示
  store_id IN (
    SELECT s.id 
    FROM stores s
    JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
);

-- ==== stores テーブル ====
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "stores_service_role_policy" ON stores;
DROP POLICY IF EXISTS "stores_authenticated_policy" ON stores;

-- サービスロール用ポリシー（全操作許可）
CREATE POLICY "stores_service_role_policy" 
ON stores
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 認証済みユーザー用ポリシー（制限付き）
CREATE POLICY "stores_authenticated_policy" 
ON stores
FOR SELECT
TO authenticated
USING (
  -- 自分の会社の店舗のみ表示
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- ==== store_memberships テーブル ====
ALTER TABLE store_memberships ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "store_memberships_service_role_policy" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_authenticated_policy" ON store_memberships;

-- サービスロール用ポリシー（全操作許可）
CREATE POLICY "store_memberships_service_role_policy" 
ON store_memberships
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 認証済みユーザー用ポリシー（制限付き）
CREATE POLICY "store_memberships_authenticated_policy" 
ON store_memberships
FOR SELECT
TO authenticated
USING (
  -- 自分の店舗メンバーシップまたは同じ会社の店舗のみ表示
  business_user_id = auth.uid() 
  OR company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- ==== 権限設定 ====
-- サービスロールには全権限
GRANT ALL ON store_invitations TO service_role;
GRANT ALL ON stores TO service_role;
GRANT ALL ON store_memberships TO service_role;

-- 認証済みユーザーには基本権限
GRANT SELECT ON store_invitations TO authenticated;
GRANT SELECT ON stores TO authenticated;
GRANT SELECT, INSERT, UPDATE ON store_memberships TO authenticated;

-- 匿名ユーザーには最小限の権限（招待検証用）
GRANT SELECT ON store_invitations TO anon;
GRANT SELECT ON stores TO anon;

-- シーケンスの使用権限
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;