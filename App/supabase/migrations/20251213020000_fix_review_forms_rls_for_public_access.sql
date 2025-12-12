-- ============================================================================
-- review_formsテーブルのRLSを修正 - 公開フォームは誰でも閲覧可能に
-- ============================================================================

-- まず既存のSELECTポリシーを削除
DROP POLICY IF EXISTS "review_forms_select_policy" ON review_forms;

-- ============================================================================
-- SELECTポリシーを再作成（公開フォームは誰でもアクセス可能）
-- ============================================================================

CREATE POLICY "review_forms_select_policy" ON review_forms
FOR SELECT
USING (
  -- 公開されていて削除されていないフォームは誰でも閲覧可能（回答アプリ用）
  (is_published = true AND is_deleted = false)
  OR
  -- 自分が作成したフォーム
  business_users = auth.uid()
  OR
  -- 企業メンバーまたはパートナー経由でアクセス可能
  public.user_can_access_company(company_id)
);

-- ============================================================================
-- 関連テーブルのRLSも同様に修正
-- ============================================================================

-- login_screen_settings
DROP POLICY IF EXISTS "login_screen_settings_select_policy" ON login_screen_settings;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON login_screen_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON login_screen_settings;

CREATE POLICY "login_screen_settings_select_policy" ON login_screen_settings
FOR SELECT
USING (
  -- 公開フォームの設定は誰でも閲覧可能
  EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = login_screen_settings.review_forms_id
    AND rf.is_published = true
    AND rf.is_deleted = false
  )
  OR
  -- 自分が作成したフォームの設定
  EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = login_screen_settings.review_forms_id
    AND rf.business_users = auth.uid()
  )
  OR
  -- 企業メンバーまたはパートナー経由でアクセス可能
  EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = login_screen_settings.review_forms_id
    AND public.user_can_access_company(rf.company_id)
  )
);

-- review_form_settings
DROP POLICY IF EXISTS "review_form_settings_select_policy" ON review_form_settings;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON review_form_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON review_form_settings;

CREATE POLICY "review_form_settings_select_policy" ON review_form_settings
FOR SELECT
USING (
  -- 公開フォームの設定は誰でも閲覧可能
  EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = review_form_settings.review_form_id
    AND rf.is_published = true
    AND rf.is_deleted = false
  )
  OR
  -- 自分が作成したフォームの設定
  EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = review_form_settings.review_form_id
    AND rf.business_users = auth.uid()
  )
  OR
  -- 企業メンバーまたはパートナー経由でアクセス可能
  EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = review_form_settings.review_form_id
    AND public.user_can_access_company(rf.company_id)
  )
);

-- question_screen_settings
DROP POLICY IF EXISTS "question_screen_settings_select_policy" ON question_screen_settings;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON question_screen_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON question_screen_settings;

CREATE POLICY "question_screen_settings_select_policy" ON question_screen_settings
FOR SELECT
USING (
  -- 公開フォームの設定は誰でも閲覧可能
  EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = question_screen_settings.review_forms_id
    AND rf.is_published = true
    AND rf.is_deleted = false
  )
  OR
  -- 自分が作成したフォームの設定
  EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = question_screen_settings.review_forms_id
    AND rf.business_users = auth.uid()
  )
  OR
  -- 企業メンバーまたはパートナー経由でアクセス可能
  EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = question_screen_settings.review_forms_id
    AND public.user_can_access_company(rf.company_id)
  )
);

-- completion_screen_settings
DROP POLICY IF EXISTS "completion_screen_settings_select_policy" ON completion_screen_settings;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON completion_screen_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON completion_screen_settings;

CREATE POLICY "completion_screen_settings_select_policy" ON completion_screen_settings
FOR SELECT
USING (
  -- 公開フォームの設定は誰でも閲覧可能
  EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = completion_screen_settings.review_forms_id
    AND rf.is_published = true
    AND rf.is_deleted = false
  )
  OR
  -- 自分が作成したフォームの設定
  EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = completion_screen_settings.review_forms_id
    AND rf.business_users = auth.uid()
  )
  OR
  -- 企業メンバーまたはパートナー経由でアクセス可能
  EXISTS (
    SELECT 1 FROM review_forms rf
    WHERE rf.id = completion_screen_settings.review_forms_id
    AND public.user_can_access_company(rf.company_id)
  )
);

-- ============================================================================
-- コメント
-- ============================================================================
COMMENT ON POLICY "review_forms_select_policy" ON review_forms IS
'公開フォーム(is_published=true)は誰でも閲覧可能。それ以外は作成者または企業メンバー/パートナーのみ。';
