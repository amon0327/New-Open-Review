-- stores テーブルのRLSポリシー
-- ユーザーが所属する会社の店舗のみアクセス可能

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "stores_company_members_policy" ON stores;

-- RLSを有効化
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- ユーザーが所属する会社の店舗のみ参照可能なポリシー
CREATE POLICY "stores_company_members_policy" ON stores
  FOR ALL
  USING (
    company_id IN (
      SELECT cm.company_id 
      FROM company_memberships cm 
      WHERE cm.business_user_id = auth.uid()
    )
  );

-- store_memberships テーブルのRLSポリシー
-- ユーザーが所属する会社の店舗のスタッフのみアクセス可能

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "store_memberships_company_policy" ON store_memberships;

-- RLSを有効化
ALTER TABLE store_memberships ENABLE ROW LEVEL SECURITY;

-- ユーザーが所属する会社の店舗のスタッフのみ参照可能なポリシー
CREATE POLICY "store_memberships_company_policy" ON store_memberships
  FOR ALL
  USING (
    store_id IN (
      SELECT s.id 
      FROM stores s
      INNER JOIN company_memberships cm ON s.company_id = cm.company_id
      WHERE cm.business_user_id = auth.uid()
    )
  );

-- store_invitations テーブルのRLSポリシー
-- ユーザーが所属する会社の店舗の招待のみアクセス可能

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "store_invitations_company_policy" ON store_invitations;

-- RLSを有効化
ALTER TABLE store_invitations ENABLE ROW LEVEL SECURITY;

-- ユーザーが所属する会社の店舗の招待のみ参照可能なポリシー
CREATE POLICY "store_invitations_company_policy" ON store_invitations
  FOR ALL
  USING (
    store_id IN (
      SELECT s.id 
      FROM stores s
      INNER JOIN company_memberships cm ON s.company_id = cm.company_id
      WHERE cm.business_user_id = auth.uid()
    )
  );

-- 確認用クエリ（実行して設定を確認）
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename IN ('stores', 'store_memberships', 'store_invitations');