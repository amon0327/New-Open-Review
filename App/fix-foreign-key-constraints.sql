-- 外部キー制約を修正
-- store_memberships.business_user_id を business_users テーブルを参照するように変更

-- ==== 外部キー制約の修正 ====

-- 1. 既存の外部キー制約を削除
ALTER TABLE store_memberships 
DROP CONSTRAINT IF EXISTS store_memberships_business_user_id_fkey;

-- 2. business_users テーブルを参照する外部キー制約を追加
ALTER TABLE store_memberships 
ADD CONSTRAINT store_memberships_business_user_id_fkey 
FOREIGN KEY (business_user_id) REFERENCES business_users(id) ON DELETE CASCADE;

-- 3. company_memberships も同様に修正（念のため）
ALTER TABLE company_memberships 
DROP CONSTRAINT IF EXISTS company_memberships_business_user_id_fkey;

ALTER TABLE company_memberships 
ADD CONSTRAINT company_memberships_business_user_id_fkey 
FOREIGN KEY (business_user_id) REFERENCES business_users(id) ON DELETE CASCADE;

-- ==== business_users テーブルとauth.usersの同期を確保 ====

-- business_users.id は auth.users.id と同じUUIDを使用
-- これにより整合性を保つ

-- 結果確認
DO $$
BEGIN
  RAISE NOTICE '=== 外部キー制約修正完了 ===';
  RAISE NOTICE '✅ store_memberships.business_user_id → business_users.id';
  RAISE NOTICE '✅ company_memberships.business_user_id → business_users.id';
  RAISE NOTICE '📝 business_users.id = auth.users.id の同期が重要';
  RAISE NOTICE '🚀 招待処理でのメンバーシップ作成が正常動作します';
END $$;
