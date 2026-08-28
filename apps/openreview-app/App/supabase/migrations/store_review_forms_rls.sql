-- Store_review_forms table RLS policies
-- 店舗から会社を探して会社権限を持ったユーザーのみが閲覧・操作可能

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "store_review_forms_select_policy" ON store_review_forms;
DROP POLICY IF EXISTS "store_review_forms_insert_policy" ON store_review_forms;
DROP POLICY IF EXISTS "store_review_forms_update_policy" ON store_review_forms;
DROP POLICY IF EXISTS "store_review_forms_delete_policy" ON store_review_forms;

-- RLSを有効化
ALTER TABLE store_review_forms ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: 店舗の会社に所属するユーザーのみ閲覧可能
CREATE POLICY "store_review_forms_select_policy" ON store_review_forms
FOR SELECT
USING (
  store_id IN (
    SELECT s.id 
    FROM stores s
    JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
);

-- INSERT Policy: サービスロールまたは店舗の会社に所属するユーザーのみ挿入可能
CREATE POLICY "store_review_forms_insert_policy" ON store_review_forms
FOR INSERT
WITH CHECK (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 店舗の会社に所属するユーザーのみ
  store_id IN (
    SELECT s.id 
    FROM stores s
    JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
);

-- UPDATE Policy: 店舗の会社に所属するユーザーのみ更新可能
CREATE POLICY "store_review_forms_update_policy" ON store_review_forms
FOR UPDATE
USING (
  store_id IN (
    SELECT s.id 
    FROM stores s
    JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
)
WITH CHECK (
  store_id IN (
    SELECT s.id 
    FROM stores s
    JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
);

-- DELETE Policy: 店舗の会社に所属するユーザーのみ削除可能
CREATE POLICY "store_review_forms_delete_policy" ON store_review_forms
FOR DELETE
USING (
  store_id IN (
    SELECT s.id 
    FROM stores s
    JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
);