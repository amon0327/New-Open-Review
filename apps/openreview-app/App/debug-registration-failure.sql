-- 登録失敗の原因を調査するためのデバッグSQL
-- Supabase SQL Editorで実行して問題を特定

-- 1. テーブルの存在確認
DO $$
BEGIN
  RAISE NOTICE '=== テーブル存在確認 ===';
  
  -- store_invitations テーブル
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'store_invitations') THEN
    RAISE NOTICE '✅ store_invitations テーブル: 存在';
  ELSE
    RAISE NOTICE '❌ store_invitations テーブル: 存在しない';
  END IF;
  
  -- stores テーブル
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') THEN
    RAISE NOTICE '✅ stores テーブル: 存在';
  ELSE
    RAISE NOTICE '❌ stores テーブル: 存在しない';
  END IF;
  
  -- store_memberships テーブル
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'store_memberships') THEN
    RAISE NOTICE '✅ store_memberships テーブル: 存在';
  ELSE
    RAISE NOTICE '❌ store_memberships テーブル: 存在しない';
  END IF;
  
  -- business_users テーブル
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_users') THEN
    RAISE NOTICE '✅ business_users テーブル: 存在';
  ELSE
    RAISE NOTICE '❌ business_users テーブル: 存在しない';
  END IF;
  
  -- companies テーブル
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies') THEN
    RAISE NOTICE '✅ companies テーブル: 存在';
  ELSE
    RAISE NOTICE '❌ companies テーブル: 存在しない';
  END IF;
END $$;

-- 2. RLSポリシーの確認
DO $$
BEGIN
  RAISE NOTICE '=== RLSポリシー確認 ===';
  
  -- store_invitations のポリシー
  RAISE NOTICE 'store_invitations のRLSポリシー:';
  FOR rec IN 
    SELECT policyname, cmd, roles, qual, with_check 
    FROM pg_policies 
    WHERE tablename = 'store_invitations'
  LOOP
    RAISE NOTICE '  - %: % (ロール: %)', rec.policyname, rec.cmd, rec.roles;
  END LOOP;
  
  -- stores のポリシー
  RAISE NOTICE 'stores のRLSポリシー:';
  FOR rec IN 
    SELECT policyname, cmd, roles, qual, with_check 
    FROM pg_policies 
    WHERE tablename = 'stores'
  LOOP
    RAISE NOTICE '  - %: % (ロール: %)', rec.policyname, rec.cmd, rec.roles;
  END LOOP;
  
  -- store_memberships のポリシー
  RAISE NOTICE 'store_memberships のRLSポリシー:';
  FOR rec IN 
    SELECT policyname, cmd, roles, qual, with_check 
    FROM pg_policies 
    WHERE tablename = 'store_memberships'
  LOOP
    RAISE NOTICE '  - %: % (ロール: %)', rec.policyname, rec.cmd, rec.roles;
  END LOOP;
END $$;

-- 3. サービスロールの権限確認
DO $$
BEGIN
  RAISE NOTICE '=== サービスロール権限確認 ===';
  
  -- store_invitations
  IF has_table_privilege('service_role', 'store_invitations', 'SELECT') THEN
    RAISE NOTICE '✅ service_role -> store_invitations: SELECT権限あり';
  ELSE
    RAISE NOTICE '❌ service_role -> store_invitations: SELECT権限なし';
  END IF;
  
  IF has_table_privilege('service_role', 'store_invitations', 'INSERT') THEN
    RAISE NOTICE '✅ service_role -> store_invitations: INSERT権限あり';
  ELSE
    RAISE NOTICE '❌ service_role -> store_invitations: INSERT権限なし';
  END IF;
  
  -- stores
  IF has_table_privilege('service_role', 'stores', 'SELECT') THEN
    RAISE NOTICE '✅ service_role -> stores: SELECT権限あり';
  ELSE
    RAISE NOTICE '❌ service_role -> stores: SELECT権限なし';
  END IF;
  
  -- store_memberships
  IF has_table_privilege('service_role', 'store_memberships', 'SELECT') THEN
    RAISE NOTICE '✅ service_role -> store_memberships: SELECT権限あり';
  ELSE
    RAISE NOTICE '❌ service_role -> store_memberships: SELECT権限なし';
  END IF;
  
  IF has_table_privilege('service_role', 'store_memberships', 'INSERT') THEN
    RAISE NOTICE '✅ service_role -> store_memberships: INSERT権限あり';
  ELSE
    RAISE NOTICE '❌ service_role -> store_memberships: INSERT権限なし';
  END IF;
END $$;

-- 4. テストデータの確認
DO $$
DECLARE
  invitation_count INTEGER;
  store_count INTEGER;
BEGIN
  RAISE NOTICE '=== テストデータ確認 ===';
  
  -- store_invitations のデータ数
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'store_invitations') THEN
    SELECT COUNT(*) INTO invitation_count FROM store_invitations;
    RAISE NOTICE 'store_invitations レコード数: %', invitation_count;
    
    -- 最新の招待を表示
    FOR rec IN 
      SELECT token, status, created_at, name 
      FROM store_invitations 
      ORDER BY created_at DESC 
      LIMIT 3
    LOOP
      RAISE NOTICE '  招待: % (状態: %, 作成: %, 名前: %)', 
        rec.token, rec.status, rec.created_at, rec.name;
    END LOOP;
  ELSE
    RAISE NOTICE 'store_invitations テーブルが存在しません';
  END IF;
  
  -- stores のデータ数
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stores') THEN
    SELECT COUNT(*) INTO store_count FROM stores;
    RAISE NOTICE 'stores レコード数: %', store_count;
  ELSE
    RAISE NOTICE 'stores テーブルが存在しません';
  END IF;
END $$;

-- 5. 招待トークンでのテストクエリ（実際の招待URLのトークンを使用）
-- 注意: c7c5b5fb-9840-4411-833e-21ae08e7a109 を実際のトークンに変更してください
DO $$
DECLARE
  test_token TEXT := 'c7c5b5fb-9840-4411-833e-21ae08e7a109';
  invitation_exists BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '=== 招待トークンテスト ===';
  RAISE NOTICE 'テスト対象トークン: %', test_token;
  
  -- store_invitations の存在確認
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'store_invitations') THEN
    SELECT EXISTS(
      SELECT 1 FROM store_invitations 
      WHERE token = test_token
    ) INTO invitation_exists;
    
    IF invitation_exists THEN
      RAISE NOTICE '✅ 招待トークンが見つかりました';
      
      -- 招待の詳細を表示
      FOR rec IN 
        SELECT token, status, created_at, name, store_id,
               EXTRACT(HOUR FROM (now() - created_at)) as hours_ago
        FROM store_invitations 
        WHERE token = test_token
      LOOP
        RAISE NOTICE '  状態: %, 作成: % (% 時間前), 名前: %, 店舗ID: %', 
          rec.status, rec.created_at, rec.hours_ago, rec.name, rec.store_id;
          
        IF rec.hours_ago > 24 THEN
          RAISE NOTICE '  ⚠️ 24時間を超過（期限切れ）';
        ELSE
          RAISE NOTICE '  ✅ 24時間以内（有効）';
        END IF;
      END LOOP;
    ELSE
      RAISE NOTICE '❌ 招待トークンが見つかりません';
    END IF;
  ELSE
    RAISE NOTICE '❌ store_invitations テーブルが存在しません';
  END IF;
END $$;