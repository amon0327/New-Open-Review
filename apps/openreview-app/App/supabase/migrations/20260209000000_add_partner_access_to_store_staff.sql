-- ============================================================================
-- store_invitations と store_memberships にパートナーアクセスを追加
-- パートナー企業のユーザーが、提携先企業のスタッフ招待・閲覧・削除を行えるようにする
-- ============================================================================

-- ============================================================================
-- store_invitations のRLSポリシーを再作成
-- store_invitations には company_id カラムがないため、store_id → stores.company_id で参照
-- ============================================================================

DROP POLICY IF EXISTS "store_invitations_company_policy" ON store_invitations;
DROP POLICY IF EXISTS "store_invitations_select_policy" ON store_invitations;
DROP POLICY IF EXISTS "store_invitations_insert_policy" ON store_invitations;
DROP POLICY IF EXISTS "store_invitations_update_policy" ON store_invitations;
DROP POLICY IF EXISTS "store_invitations_delete_policy" ON store_invitations;
DROP POLICY IF EXISTS "store_invitations_authenticated_delete" ON store_invitations;
DROP POLICY IF EXISTS "緊急対応_招待処理EdgeFunction_全操作許可" ON store_invitations;

CREATE POLICY "store_invitations_select_policy" ON store_invitations
FOR SELECT
USING (
  auth.role() = 'service_role' OR
  store_id IN (
    SELECT s.id FROM stores s
    JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
  OR
  store_id IN (
    SELECT s.id FROM stores s
    WHERE s.company_id IN (
      SELECT company_id FROM get_partner_affiliated_companies(auth.uid())
    )
  )
);

CREATE POLICY "store_invitations_insert_policy" ON store_invitations
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role' OR
  store_id IN (
    SELECT s.id FROM stores s
    JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
  OR
  store_id IN (
    SELECT s.id FROM stores s
    WHERE s.company_id IN (
      SELECT company_id FROM get_partner_affiliated_companies(auth.uid())
    )
  )
);

CREATE POLICY "store_invitations_update_policy" ON store_invitations
FOR UPDATE
USING (
  auth.role() = 'service_role' OR
  store_id IN (
    SELECT s.id FROM stores s
    JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
  OR
  store_id IN (
    SELECT s.id FROM stores s
    WHERE s.company_id IN (
      SELECT company_id FROM get_partner_affiliated_companies(auth.uid())
    )
  )
);

CREATE POLICY "store_invitations_delete_policy" ON store_invitations
FOR DELETE
USING (
  auth.role() = 'service_role' OR
  store_id IN (
    SELECT s.id FROM stores s
    JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
  OR
  store_id IN (
    SELECT s.id FROM stores s
    WHERE s.company_id IN (
      SELECT company_id FROM get_partner_affiliated_companies(auth.uid())
    )
  )
);

-- ============================================================================
-- store_memberships のRLSポリシーを再作成
-- store_memberships には company_id カラムがある
-- ============================================================================

DROP POLICY IF EXISTS "company_store_memberships_access_v2" ON store_memberships;
DROP POLICY IF EXISTS "自分の所属のみ閲覧可能" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_select_policy" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_insert_policy" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_update_policy" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_delete_policy" ON store_memberships;
DROP POLICY IF EXISTS "store_memberships_authenticated_delete" ON store_memberships;
DROP POLICY IF EXISTS "緊急対応_スタッフ登録EdgeFunction_全操作許可" ON store_memberships;

CREATE POLICY "store_memberships_select_policy" ON store_memberships
FOR SELECT
USING (
  auth.role() = 'service_role' OR
  business_user_id = auth.uid() OR
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT company_id
    FROM get_partner_affiliated_companies(auth.uid())
  )
);

CREATE POLICY "store_memberships_insert_policy" ON store_memberships
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role' OR
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT company_id
    FROM get_partner_affiliated_companies(auth.uid())
  )
);

CREATE POLICY "store_memberships_update_policy" ON store_memberships
FOR UPDATE
USING (
  auth.role() = 'service_role' OR
  business_user_id = auth.uid() OR
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT company_id
    FROM get_partner_affiliated_companies(auth.uid())
  )
);

CREATE POLICY "store_memberships_delete_policy" ON store_memberships
FOR DELETE
USING (
  auth.role() = 'service_role' OR
  business_user_id = auth.uid() OR
  company_id IN (
    SELECT company_id
    FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
  OR
  company_id IN (
    SELECT company_id
    FROM get_partner_affiliated_companies(auth.uid())
  )
);
