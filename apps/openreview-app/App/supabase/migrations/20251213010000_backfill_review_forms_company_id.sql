-- ============================================================================
-- 過去に作成されたreview_formsにcompany_idを追加（バックフィル）
-- business_usersからcompany_membershipsを経由してcompany_idを特定
-- ============================================================================

-- 1. まずcompany_idがNULLのレビューフォームを確認（実行前の状態確認用）
-- SELECT rf.id, rf.title, rf.business_users, rf.company_id
-- FROM review_forms rf
-- WHERE rf.company_id IS NULL AND rf.business_users IS NOT NULL;

-- 2. business_usersが所属する企業のcompany_idをreview_formsに設定
-- company_membershipsテーブルを使って、business_user_idからcompany_idを取得
UPDATE review_forms rf
SET company_id = cm.company_id,
    updated_at = NOW()
FROM company_memberships cm
WHERE rf.business_users = cm.business_user_id
  AND rf.company_id IS NULL
  AND rf.business_users IS NOT NULL;

-- 3. 更新結果を確認するためのコメント（実行後に確認用）
-- SELECT rf.id, rf.title, rf.business_users, rf.company_id, c.name as company_name
-- FROM review_forms rf
-- LEFT JOIN companies c ON rf.company_id = c.id
-- WHERE rf.business_users IS NOT NULL;

-- ============================================================================
-- 注意事項：
-- - business_usersが複数の企業に所属している場合、最初に見つかった企業が設定されます
-- - business_usersがどの企業にも所属していない場合、company_idはNULLのままです
-- ============================================================================
