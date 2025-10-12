-- Review Forms table RLS policies
-- review_formsテーブルへのアクセスをユーザーが作成したフォームまたは所属会社のフォームに制限

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "review_forms_select_policy" ON review_forms;
DROP POLICY IF EXISTS "review_forms_insert_policy" ON review_forms;
DROP POLICY IF EXISTS "review_forms_update_policy" ON review_forms;
DROP POLICY IF EXISTS "review_forms_delete_policy" ON review_forms;

-- RLSを有効化
ALTER TABLE review_forms ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: 自分が作成したフォームまたは所属会社のフォームのみ表示
CREATE POLICY "review_forms_select_policy" ON review_forms
FOR SELECT
USING (
  -- 自分が作成したフォーム
  business_users = auth.uid() OR
  -- 所属会社のフォーム
  id IN (
    SELECT review_form_id 
    FROM company_review_forms crf
    JOIN company_memberships cm ON crf.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
);

-- INSERT Policy: サービスロールまたは認証されたユーザーのみフォーム作成可能
CREATE POLICY "review_forms_insert_policy" ON review_forms
FOR INSERT
WITH CHECK (
  -- サービスロールは制限なし
  auth.role() = 'service_role' OR
  -- 通常ユーザーは自分のIDでのみ作成可能
  business_users = auth.uid()
);

-- UPDATE Policy: 自分が作成したフォームまたは所属会社のフォームのみ更新可能
CREATE POLICY "review_forms_update_policy" ON review_forms
FOR UPDATE
USING (
  -- 自分が作成したフォーム
  business_users = auth.uid() OR
  -- 所属会社のフォーム
  id IN (
    SELECT review_form_id 
    FROM company_review_forms crf
    JOIN company_memberships cm ON crf.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
)
WITH CHECK (
  -- 自分が作成したフォーム
  business_users = auth.uid() OR
  -- 所属会社のフォーム
  id IN (
    SELECT review_form_id 
    FROM company_review_forms crf
    JOIN company_memberships cm ON crf.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
);

-- DELETE Policy: 自分が作成したフォームまたは所属会社のフォームのみ削除可能
CREATE POLICY "review_forms_delete_policy" ON review_forms
FOR DELETE
USING (
  -- 自分が作成したフォーム
  business_users = auth.uid() OR
  -- 所属会社のフォーム
  id IN (
    SELECT review_form_id 
    FROM company_review_forms crf
    JOIN company_memberships cm ON crf.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
);