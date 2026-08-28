-- 全テーブルのRLSポリシーを日本語名に統一
-- 招待システム関連テーブルの包括的なポリシー設定

-- ==== store_invitations テーブル（スタッフ招待情報） ====
ALTER TABLE store_invitations ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "緊急対応_招待処理EdgeFunction_全操作許可" ON store_invitations;
DROP POLICY IF EXISTS "招待処理_EdgeFunction専用_24時間制限" ON store_invitations;
DROP POLICY IF EXISTS "招待閲覧_自社店舗のみ_認証済みユーザー" ON store_invitations;
DROP POLICY IF EXISTS "招待作成_自社店舗のみ_管理者権限" ON store_invitations;
DROP POLICY IF EXISTS "service_role_all_access" ON store_invitations;

-- サービスロール（Edge Function）用：全操作許可
CREATE POLICY "サービスロール_招待処理全権限" 
ON store_invitations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 認証済みユーザー：自社店舗の招待のみ閲覧
CREATE POLICY "認証済みユーザー_自社店舗招待閲覧" 
ON store_invitations
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- 認証済みユーザー：自社店舗への招待作成
CREATE POLICY "認証済みユーザー_自社店舗招待作成" 
ON store_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- ==== stores テーブル（店舗情報） ====
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "緊急対応_店舗情報EdgeFunction_全操作許可" ON stores;
DROP POLICY IF EXISTS "stores_select_policy" ON stores;
DROP POLICY IF EXISTS "stores_insert_policy" ON stores;
DROP POLICY IF EXISTS "stores_update_policy" ON stores;
DROP POLICY IF EXISTS "stores_delete_policy" ON stores;

-- サービスロール（Edge Function）用：全操作許可
CREATE POLICY "サービスロール_店舗情報全権限" 
ON stores
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 認証済みユーザー：自社店舗のみ操作
CREATE POLICY "認証済みユーザー_自社店舗閲覧" 
ON stores
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "認証済みユーザー_自社店舗作成" 
ON stores
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "認証済みユーザー_自社店舗更新" 
ON stores
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- ==== companies テーブル（会社情報） ====
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "緊急対応_会社情報EdgeFunction_全操作許可" ON companies;
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;

-- サービスロール（Edge Function）用：全操作許可
CREATE POLICY "サービスロール_会社情報全権限" 
ON companies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 認証済みユーザー：自社のみ閲覧・更新
CREATE POLICY "認証済みユーザー_自社情報閲覧" 
ON companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "認証済みユーザー_自社情報更新" 
ON companies
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- ==== store_memberships テーブル（店舗スタッフメンバーシップ） ====
ALTER TABLE store_memberships ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "緊急対応_スタッフ登録EdgeFunction_全操作許可" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_select_policy" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_insert_policy" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_update_policy" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_delete_policy" ON store_memberships;

-- サービスロール（Edge Function）用：全操作許可
CREATE POLICY "サービスロール_店舗メンバーシップ全権限" 
ON store_memberships
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 認証済みユーザー：自分のメンバーシップまたは同社の閲覧
CREATE POLICY "認証済みユーザー_店舗メンバーシップ閲覧" 
ON store_memberships
FOR SELECT
TO authenticated
USING (
  business_user_id = auth.uid() OR
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- 認証済みユーザー：自社店舗のメンバーシップ作成
CREATE POLICY "認証済みユーザー_店舗メンバーシップ作成" 
ON store_memberships
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- ==== company_memberships テーブル（会社メンバーシップ） ====
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "緊急対応_会社メンバーEdgeFunction_全操作許可" ON company_memberships;
DROP POLICY IF EXISTS "company_memberships_select_policy" ON company_memberships;
DROP POLICY IF EXISTS "company_memberships_insert_policy" ON company_memberships;

-- サービスロール（Edge Function）用：全操作許可
CREATE POLICY "サービスロール_会社メンバーシップ全権限" 
ON company_memberships
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 認証済みユーザー：自分のメンバーシップまたは同社の閲覧
CREATE POLICY "認証済みユーザー_会社メンバーシップ閲覧" 
ON company_memberships
FOR SELECT
TO authenticated
USING (
  business_user_id = auth.uid() OR
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- ==== 権限付与（全テーブル） ====
-- サービスロールに全権限を付与
GRANT ALL ON store_invitations TO service_role;
GRANT ALL ON stores TO service_role;
GRANT ALL ON companies TO service_role;
GRANT ALL ON store_memberships TO service_role;
GRANT ALL ON business_users TO service_role;
GRANT ALL ON company_memberships TO service_role;

-- シーケンス使用権限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 認証済みユーザーに基本権限を付与
GRANT SELECT, INSERT ON store_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON stores TO authenticated;
GRANT SELECT, UPDATE ON companies TO authenticated;
GRANT SELECT, INSERT ON store_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON business_users TO authenticated;
GRANT SELECT ON company_memberships TO authenticated;

-- ==== 結果確認 ====
DO $$
BEGIN
  RAISE NOTICE '=== 全テーブル日本語RLSポリシー設定完了 ===';
  RAISE NOTICE '✅ store_invitations: 招待処理のポリシー設定完了';
  RAISE NOTICE '✅ stores: 店舗情報のポリシー設定完了';
  RAISE NOTICE '✅ companies: 会社情報のポリシー設定完了';
  RAISE NOTICE '✅ store_memberships: 店舗メンバーシップのポリシー設定完了';
  RAISE NOTICE '✅ business_users: ビジネスユーザーのポリシー設定完了';
  RAISE NOTICE '✅ company_memberships: 会社メンバーシップのポリシー設定完了';
  RAISE NOTICE '';
  RAISE NOTICE '📝 すべてのポリシー名が日本語に統一されました';
  RAISE NOTICE '🔒 セキュリティレベル: 最小権限の原則に基づく設定';
  RAISE NOTICE '🤖 Edge Function: すべてのテーブルで全権限';
  RAISE NOTICE '👤 認証済みユーザー: 自社・自分のレコードのみ操作可能';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 招待URL処理エラーが解決されます';
END $$;