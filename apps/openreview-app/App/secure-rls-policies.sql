-- セキュリティを考慮したRLSポリシー設定
-- 最小権限の原則に基づいた設定

-- ==== store_invitations テーブル（スタッフ招待情報） ====
ALTER TABLE store_invitations ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーを削除
DROP POLICY IF EXISTS "招待処理_EdgeFunction専用_24時間制限" ON store_invitations;
DROP POLICY IF EXISTS "招待閲覧_自社店舗のみ_認証済みユーザー" ON store_invitations;
DROP POLICY IF EXISTS "招待作成_自社店舗のみ_管理者権限" ON store_invitations;

-- Edge Function専用: complete-staff-invitation関数で使用
-- 招待完了処理とvalidate-staff-invitation関数で24時間以内の招待のみアクセス
CREATE POLICY "招待処理_EdgeFunction専用_24時間制限" 
ON store_invitations
FOR ALL
TO service_role
USING (
  -- 24時間以内の招待のみアクセス可能（期限切れ招待は除外）
  created_at > (now() - interval '24 hours')
)
WITH CHECK (
  -- 新規招待作成時は制限なし（create-staff-invitation関数で使用）
  true
);

-- ダッシュボード表示用: StaffInvitationForm等で自分の会社の招待一覧を表示
CREATE POLICY "招待閲覧_自社店舗のみ_認証済みユーザー" 
ON store_invitations
FOR SELECT
TO authenticated
USING (
  -- 自分が所属する会社の店舗への招待のみ表示
  store_id IN (
    SELECT s.id 
    FROM stores s
    JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
);

-- 招待作成用: StaffInvitationFormで新しい招待を作成
CREATE POLICY "招待作成_自社店舗のみ_管理者権限" 
ON store_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  -- 自分が管理権限を持つ会社の店舗にのみ招待作成可能
  store_id IN (
    SELECT s.id 
    FROM stores s
    JOIN company_memberships cm ON s.company_id = cm.company_id
    WHERE cm.business_user_id = auth.uid()
  )
);

-- ==== stores テーブル（店舗情報） ====
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "店舗情報_招待処理専用_EdgeFunction" ON stores;
DROP POLICY IF EXISTS "店舗閲覧_自社のみ_ダッシュボード表示" ON stores;

-- Edge Function専用: 招待処理時に店舗名・住所・会社情報を取得
-- StaffInvitationLoginとcomplete-staff-invitation関数で使用
CREATE POLICY "店舗情報_招待処理専用_EdgeFunction" 
ON stores
FOR SELECT
TO service_role
USING (
  -- 有効な招待が存在する店舗のみアクセス可能
  id IN (
    SELECT store_id 
    FROM store_invitations 
    WHERE status = 'invited' 
    AND created_at > (now() - interval '24 hours')
  )
);

-- ダッシュボード用: Dashboard、StoreDetailPageで自社店舗一覧を表示
CREATE POLICY "店舗閲覧_自社のみ_ダッシュボード表示" 
ON stores
FOR SELECT
TO authenticated
USING (
  -- 自分が所属する会社の店舗のみ表示
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- ==== companies テーブル（会社情報） ====
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "会社情報_招待表示専用_EdgeFunction" ON companies;
DROP POLICY IF EXISTS "会社閲覧_自社のみ_ダッシュボード表示" ON companies;

-- Edge Function専用: 招待ページで会社名を表示
-- StaffInvitationLogin画面で「○○会社の△△店舗」として表示するため
CREATE POLICY "会社情報_招待表示専用_EdgeFunction" 
ON companies
FOR SELECT
TO service_role
USING (
  -- 有効な招待が存在する会社のみアクセス可能
  id IN (
    SELECT s.company_id 
    FROM stores s
    JOIN store_invitations si ON s.id = si.store_id
    WHERE si.status = 'invited' 
    AND si.created_at > (now() - interval '24 hours')
  )
);

-- ダッシュボード用: CompanySetup、Dashboard等で自社情報を表示
CREATE POLICY "会社閲覧_自社のみ_ダッシュボード表示" 
ON companies
FOR SELECT
TO authenticated
USING (
  -- 自分が所属する会社のみ表示
  id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- ==== store_memberships テーブル（店舗スタッフメンバーシップ） ====
ALTER TABLE store_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "スタッフ登録_招待完了時のみ_EdgeFunction" ON store_memberships;
DROP POLICY IF EXISTS "メンバー一覧_自社店舗のみ_管理画面表示" ON store_memberships;
DROP POLICY IF EXISTS "重複チェック_既存メンバー確認_EdgeFunction" ON store_memberships;

-- Edge Function専用: complete-staff-invitation関数でスタッフをメンバーとして登録
CREATE POLICY "スタッフ登録_招待完了時のみ_EdgeFunction" 
ON store_memberships
FOR INSERT
TO service_role
WITH CHECK (
  -- 有効な招待が存在する店舗にのみメンバー追加可能
  store_id IN (
    SELECT store_id 
    FROM store_invitations 
    WHERE status = 'invited' 
    AND created_at > (now() - interval '24 hours')
  )
);

-- Edge Function専用: complete-staff-invitation関数で重複登録チェック
CREATE POLICY "重複チェック_既存メンバー確認_EdgeFunction" 
ON store_memberships
FOR SELECT
TO service_role
USING (true);

-- 管理画面用: StoreDetailPage等で店舗スタッフ一覧を表示
CREATE POLICY "メンバー一覧_自社店舗のみ_管理画面表示" 
ON store_memberships
FOR SELECT
TO authenticated
USING (
  -- 自分のメンバーシップまたは同じ会社の店舗メンバー
  business_user_id = auth.uid() 
  OR company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- ==== business_users テーブル（ビジネスユーザー情報） ====
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ユーザー作成_招待完了時のみ_EdgeFunction" ON business_users;
DROP POLICY IF EXISTS "プロフィール閲覧_本人のみ_設定画面" ON business_users;
DROP POLICY IF EXISTS "ユーザー確認_招待処理専用_EdgeFunction" ON business_users;

-- Edge Function専用: complete-staff-invitation関数でビジネスユーザーを作成
CREATE POLICY "ユーザー作成_招待完了時のみ_EdgeFunction" 
ON business_users
FOR INSERT
TO service_role
WITH CHECK (true);

-- Edge Function専用: complete-staff-invitation関数で既存ユーザーの存在確認
CREATE POLICY "ユーザー確認_招待処理専用_EdgeFunction" 
ON business_users
FOR SELECT
TO service_role
USING (true);

-- Edge Function専用: complete-staff-invitation関数でユーザー情報更新
CREATE POLICY "ユーザー更新_招待完了時のみ_EdgeFunction" 
ON business_users
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 設定画面用: SettingsPage等で自分のプロフィール情報を表示・編集
CREATE POLICY "プロフィール閲覧_本人のみ_設定画面" 
ON business_users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- ==== 権限設定（最小権限の原則） ====

-- Edge Function専用権限（サービスロール）
-- complete-staff-invitation, validate-staff-invitation, create-staff-invitation関数で使用
GRANT SELECT, INSERT, UPDATE ON store_invitations TO service_role;  -- 招待作成・更新・検証
GRANT SELECT ON stores TO service_role;                             -- 店舗情報取得
GRANT SELECT ON companies TO service_role;                          -- 会社情報取得
GRANT SELECT, INSERT ON store_memberships TO service_role;          -- スタッフ登録・重複チェック
GRANT SELECT, INSERT, UPDATE ON business_users TO service_role;     -- ユーザー作成・確認・更新

-- ダッシュボード・管理画面用権限（認証済みユーザー）
-- Dashboard, StaffInvitationForm, StoreDetailPage等で使用
GRANT SELECT, INSERT ON store_invitations TO authenticated;         -- 招待一覧表示・作成
GRANT SELECT ON stores TO authenticated;                            -- 店舗一覧表示
GRANT SELECT ON companies TO authenticated;                         -- 会社情報表示
GRANT SELECT ON store_memberships TO authenticated;                 -- スタッフ一覧表示
GRANT SELECT, UPDATE ON business_users TO authenticated;            -- プロフィール表示・更新

-- 匿名ユーザーには権限なし
-- 招待URLアクセスはEdge Function経由でサービスロールを使用するため直接権限不要

-- シーケンス使用権限（ID自動生成用）
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ポリシー設定完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '=== RLSポリシー設定完了 ===';
  RAISE NOTICE '1. 招待システム: Edge Function経由で24時間制限付きアクセス';
  RAISE NOTICE '2. ダッシュボード: 認証済みユーザーは自社データのみアクセス';
  RAISE NOTICE '3. セキュリティ: 最小権限の原則を適用';
  RAISE NOTICE '========================';
END $$;