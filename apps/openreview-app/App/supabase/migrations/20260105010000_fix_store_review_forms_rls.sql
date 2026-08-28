-- store_review_formsテーブルのRLSポリシーを修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view store_review_forms for their company" ON store_review_forms;
DROP POLICY IF EXISTS "Users can insert store_review_forms for their company" ON store_review_forms;
DROP POLICY IF EXISTS "Users can update store_review_forms for their company" ON store_review_forms;
DROP POLICY IF EXISTS "Users can delete store_review_forms for their company" ON store_review_forms;

-- より包括的なSELECTポリシー: 会社メンバーシップまたはパートナーメンバーシップ経由でアクセス可能
CREATE POLICY "Users can view store_review_forms"
ON store_review_forms
FOR SELECT
USING (
  store_id IN (
    -- 会社メンバーシップ経由
    SELECT s.id 
    FROM stores s
    INNER JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.user_id = auth.uid()
    
    UNION
    
    -- パートナーメンバーシップ経由
    SELECT s.id
    FROM stores s
    INNER JOIN partner_company_associations pca ON s.company_id = pca.company_id
    INNER JOIN partner_memberships pm ON pca.partner_id = pm.partner_id
    WHERE pm.user_id = auth.uid()
  )
);

-- より包括的なINSERTポリシー
CREATE POLICY "Users can insert store_review_forms"
ON store_review_forms
FOR INSERT
WITH CHECK (
  store_id IN (
    -- 会社メンバーシップ経由
    SELECT s.id 
    FROM stores s
    INNER JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.user_id = auth.uid()
    
    UNION
    
    -- パートナーメンバーシップ経由
    SELECT s.id
    FROM stores s
    INNER JOIN partner_company_associations pca ON s.company_id = pca.company_id
    INNER JOIN partner_memberships pm ON pca.partner_id = pm.partner_id
    WHERE pm.user_id = auth.uid()
  )
);

-- より包括的なUPDATEポリシー
CREATE POLICY "Users can update store_review_forms"
ON store_review_forms
FOR UPDATE
USING (
  store_id IN (
    -- 会社メンバーシップ経由
    SELECT s.id 
    FROM stores s
    INNER JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.user_id = auth.uid()
    
    UNION
    
    -- パートナーメンバーシップ経由
    SELECT s.id
    FROM stores s
    INNER JOIN partner_company_associations pca ON s.company_id = pca.company_id
    INNER JOIN partner_memberships pm ON pca.partner_id = pm.partner_id
    WHERE pm.user_id = auth.uid()
  )
)
WITH CHECK (
  store_id IN (
    -- 会社メンバーシップ経由
    SELECT s.id 
    FROM stores s
    INNER JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.user_id = auth.uid()
    
    UNION
    
    -- パートナーメンバーシップ経由
    SELECT s.id
    FROM stores s
    INNER JOIN partner_company_associations pca ON s.company_id = pca.company_id
    INNER JOIN partner_memberships pm ON pca.partner_id = pm.partner_id
    WHERE pm.user_id = auth.uid()
  )
);

-- より包括的なDELETEポリシー
CREATE POLICY "Users can delete store_review_forms"
ON store_review_forms
FOR DELETE
USING (
  store_id IN (
    -- 会社メンバーシップ経由
    SELECT s.id 
    FROM stores s
    INNER JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.user_id = auth.uid()
    
    UNION
    
    -- パートナーメンバーシップ経由
    SELECT s.id
    FROM stores s
    INNER JOIN partner_company_associations pca ON s.company_id = pca.company_id
    INNER JOIN partner_memberships pm ON pca.partner_id = pm.partner_id
    WHERE pm.user_id = auth.uid()
  )
);