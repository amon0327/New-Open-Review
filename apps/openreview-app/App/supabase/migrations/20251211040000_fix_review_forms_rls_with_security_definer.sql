-- ============================================================================
-- review_formsテーブルのRLSを修正 - SECURITY DEFINER関数を使用
-- ============================================================================

-- まず既存のポリシーを削除
DROP POLICY IF EXISTS "review_forms_select_policy" ON review_forms;
DROP POLICY IF EXISTS "review_forms_insert_policy" ON review_forms;
DROP POLICY IF EXISTS "review_forms_update_policy" ON review_forms;
DROP POLICY IF EXISTS "review_forms_delete_policy" ON review_forms;

-- ============================================================================
-- RLSポリシーを再作成（SECURITY DEFINER関数を使用）
-- ============================================================================

-- SELECTポリシー
CREATE POLICY "review_forms_select_policy" ON review_forms
FOR SELECT
USING (
  -- 自分が作成したフォーム
  business_users = auth.uid()
  OR
  -- 企業メンバーまたはパートナー経由でアクセス可能
  public.user_can_access_company(company_id)
);

-- INSERTポリシー
CREATE POLICY "review_forms_insert_policy" ON review_forms
FOR INSERT
WITH CHECK (
  -- サービスロールは制限なし
  auth.role() = 'service_role'
  OR
  -- 通常ユーザーは自分のIDでのみ作成可能
  business_users = auth.uid()
);

-- UPDATEポリシー
CREATE POLICY "review_forms_update_policy" ON review_forms
FOR UPDATE
USING (
  business_users = auth.uid()
  OR
  public.user_can_access_company(company_id)
)
WITH CHECK (
  business_users = auth.uid()
  OR
  public.user_can_access_company(company_id)
);

-- DELETEポリシー
CREATE POLICY "review_forms_delete_policy" ON review_forms
FOR DELETE
USING (
  business_users = auth.uid()
  OR
  public.user_can_access_company(company_id)
);
