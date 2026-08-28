-- Company_memberships table RLS policies
-- 自分のIDのものだけを見れるJWTトークンを使ったRLS

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "company_memberships_select_policy" ON company_memberships;
DROP POLICY IF EXISTS "company_memberships_insert_policy" ON company_memberships;
DROP POLICY IF EXISTS "company_memberships_update_policy" ON company_memberships;
DROP POLICY IF EXISTS "company_memberships_delete_policy" ON company_memberships;

-- RLSを有効化
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: 自分のbusiness_user_idと一致するレコードのみ表示
CREATE POLICY "company_memberships_select_policy" ON company_memberships
FOR SELECT
USING (business_user_id = auth.uid());

-- INSERT Policy: サービスロールまたは自分のbusiness_user_idのレコードのみ挿入可能
CREATE POLICY "company_memberships_insert_policy" ON company_memberships
FOR INSERT
WITH CHECK (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 通常ユーザーは自分のbusiness_user_idのレコードのみ
  business_user_id = auth.uid()
);

-- UPDATE Policy: 自分のbusiness_user_idと一致するレコードのみ更新可能
CREATE POLICY "company_memberships_update_policy" ON company_memberships
FOR UPDATE
USING (business_user_id = auth.uid())
WITH CHECK (business_user_id = auth.uid());

-- DELETE Policy: 自分のbusiness_user_idと一致するレコードのみ削除可能
CREATE POLICY "company_memberships_delete_policy" ON company_memberships
FOR DELETE
USING (business_user_id = auth.uid());