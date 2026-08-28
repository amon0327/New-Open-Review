-- Company Review Forms table RLS policies
-- company_review_formsテーブルへのアクセスをユーザーが所属する会社に制限

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "company_review_forms_select_policy" ON company_review_forms;
DROP POLICY IF EXISTS "company_review_forms_insert_policy" ON company_review_forms;
DROP POLICY IF EXISTS "company_review_forms_update_policy" ON company_review_forms;
DROP POLICY IF EXISTS "company_review_forms_delete_policy" ON company_review_forms;

-- RLSを有効化
ALTER TABLE company_review_forms ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: ユーザーが所属している会社のレビューフォームのみ表示
CREATE POLICY "company_review_forms_select_policy" ON company_review_forms
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- INSERT Policy: サービスロールまたはユーザーが所属している会社のレビューフォームのみ作成可能
CREATE POLICY "company_review_forms_insert_policy" ON company_review_forms
FOR INSERT
WITH CHECK (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 通常ユーザーは所属している会社のレビューフォームのみ
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- UPDATE Policy: ユーザーが所属している会社のレビューフォームのみ更新可能
CREATE POLICY "company_review_forms_update_policy" ON company_review_forms
FOR UPDATE
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

-- DELETE Policy: ユーザーが所属している会社のレビューフォームのみ削除可能
CREATE POLICY "company_review_forms_delete_policy" ON company_review_forms
FOR DELETE
USING (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);