-- Companies table RLS policies
-- ユーザーIDと紐付いているcompaniesが表示のみされる様なJWTトークンを使ったRLS

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;

-- RLSを有効化
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: ユーザーが所属している会社のみ表示
CREATE POLICY "companies_select_policy" ON companies
FOR SELECT
USING (
  id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- INSERT Policy: 認証されたユーザーのみ会社を作成可能
CREATE POLICY "companies_insert_policy" ON companies
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE Policy: ユーザーが所属している会社のみ更新可能
CREATE POLICY "companies_update_policy" ON companies
FOR UPDATE
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

-- DELETE Policy: ユーザーが所属している会社のみ削除可能
CREATE POLICY "companies_delete_policy" ON companies
FOR DELETE
USING (
  id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- company_memberships table RLS policies
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "company_memberships_select_policy" ON company_memberships;
DROP POLICY IF EXISTS "company_memberships_insert_policy" ON company_memberships;
DROP POLICY IF EXISTS "company_memberships_update_policy" ON company_memberships;
DROP POLICY IF EXISTS "company_memberships_delete_policy" ON company_memberships;

-- RLSを有効化
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: 自分のメンバーシップのみ表示
CREATE POLICY "company_memberships_select_policy" ON company_memberships
FOR SELECT
USING (business_user_id = auth.uid());

-- INSERT Policy: サービスロールまたは自分のレコードのみ挿入可能
CREATE POLICY "company_memberships_insert_policy" ON company_memberships
FOR INSERT
WITH CHECK (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 通常ユーザーは自分のレコードのみ
  business_user_id = auth.uid()
);

-- UPDATE Policy: 自分のメンバーシップのみ更新可能
CREATE POLICY "company_memberships_update_policy" ON company_memberships
FOR UPDATE
USING (business_user_id = auth.uid())
WITH CHECK (business_user_id = auth.uid());

-- DELETE Policy: 自分のメンバーシップのみ削除可能
CREATE POLICY "company_memberships_delete_policy" ON company_memberships
FOR DELETE
USING (business_user_id = auth.uid());