-- ============================================================================
-- storesテーブルのRLSを完全に再設定
-- ============================================================================

-- まずRLSを無効化してから有効化（確実に設定するため）
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 全てのポリシーを削除
DROP POLICY IF EXISTS "stores_select_policy" ON stores;
DROP POLICY IF EXISTS "stores_insert_policy" ON stores;
DROP POLICY IF EXISTS "stores_update_policy" ON stores;
DROP POLICY IF EXISTS "stores_delete_policy" ON stores;
DROP POLICY IF EXISTS "Enable read access for all users" ON stores;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON stores;
DROP POLICY IF EXISTS "Enable update for users based on company_id" ON stores;
DROP POLICY IF EXISTS "Enable delete for users based on company_id" ON stores;

-- SELECTポリシー（パートナー企業からのアクセスも含む）
CREATE POLICY "stores_select_policy" ON stores
FOR SELECT
USING (
  -- 直接の会社メンバー
  company_id IN (
    SELECT cm.company_id
    FROM company_memberships cm
    WHERE cm.business_user_id = auth.uid()
  )
  OR
  -- パートナー企業メンバー（提携先企業の店舗を閲覧可能）
  company_id IN (
    SELECT pac.companies_id
    FROM partner_affiliate_companies pac
    JOIN partner_memberships pm ON pm.partner_company_id = pac.partner_company_id
    WHERE pm.business_users_id = auth.uid()
  )
);

-- INSERTポリシー
CREATE POLICY "stores_insert_policy" ON stores
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT cm.company_id
    FROM company_memberships cm
    WHERE cm.business_user_id = auth.uid()
  )
);

-- UPDATEポリシー
CREATE POLICY "stores_update_policy" ON stores
FOR UPDATE
USING (
  company_id IN (
    SELECT cm.company_id
    FROM company_memberships cm
    WHERE cm.business_user_id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT cm.company_id
    FROM company_memberships cm
    WHERE cm.business_user_id = auth.uid()
  )
);

-- DELETEポリシー
CREATE POLICY "stores_delete_policy" ON stores
FOR DELETE
USING (
  company_id IN (
    SELECT cm.company_id
    FROM company_memberships cm
    WHERE cm.business_user_id = auth.uid()
  )
);
