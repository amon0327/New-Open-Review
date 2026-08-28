-- store_review_formsテーブルのRLSポリシーを設定

-- RLSを有効化
ALTER TABLE store_review_forms ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view store_review_forms for their company" ON store_review_forms;
DROP POLICY IF EXISTS "Users can insert store_review_forms for their company" ON store_review_forms;
DROP POLICY IF EXISTS "Users can update store_review_forms for their company" ON store_review_forms;
DROP POLICY IF EXISTS "Users can delete store_review_forms for their company" ON store_review_forms;

-- SELECTポリシー: 自社の店舗のデータを閲覧可能
CREATE POLICY "Users can view store_review_forms for their company"
ON store_review_forms
FOR SELECT
USING (
  store_id IN (
    SELECT s.id 
    FROM stores s
    INNER JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.user_id = auth.uid()
  )
);

-- INSERTポリシー: 自社の店舗のデータを作成可能
CREATE POLICY "Users can insert store_review_forms for their company"
ON store_review_forms
FOR INSERT
WITH CHECK (
  store_id IN (
    SELECT s.id 
    FROM stores s
    INNER JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.user_id = auth.uid()
  )
);

-- UPDATEポリシー: 自社の店舗のデータを更新可能
CREATE POLICY "Users can update store_review_forms for their company"
ON store_review_forms
FOR UPDATE
USING (
  store_id IN (
    SELECT s.id 
    FROM stores s
    INNER JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.user_id = auth.uid()
  )
)
WITH CHECK (
  store_id IN (
    SELECT s.id 
    FROM stores s
    INNER JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.user_id = auth.uid()
  )
);

-- DELETEポリシー: 自社の店舗のデータを削除可能
CREATE POLICY "Users can delete store_review_forms for their company"
ON store_review_forms
FOR DELETE
USING (
  store_id IN (
    SELECT s.id 
    FROM stores s
    INNER JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.user_id = auth.uid()
  )
);