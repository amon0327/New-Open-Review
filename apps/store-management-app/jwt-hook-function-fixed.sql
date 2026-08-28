-- JWT Custom Access Token Hook 修正版
-- スキーマエラーを解決し、正しい形式でカスタムクレームを返す

-- 既存の関数を削除
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- 修正されたJWTカスタムクレーム用の関数
-- SupabaseのJWT Hook仕様に準拠
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  store_ids text[];
  store_roles jsonb;
  default_store_id text;
  store_count integer;
BEGIN
  -- eventからuser_idを取得
  user_id := (event->>'user_id')::uuid;
  
  -- デバッグ用ログ
  RAISE LOG 'JWT Hook: Processing user_id: %', user_id;
  
  -- ユーザーのすべての店舗情報を取得
  -- 店舗に紐付いていない場合は空の配列になる
  SELECT 
    COALESCE(array_agg(sm.store_id::text) FILTER (WHERE sm.store_id IS NOT NULL), ARRAY[]::text[]),
    COALESCE(jsonb_object_agg(sm.store_id::text, sm.role) FILTER (WHERE sm.store_id IS NOT NULL), '{}'::jsonb),
    (array_agg(sm.store_id::text) FILTER (WHERE sm.store_id IS NOT NULL))[1], -- 最初の店舗をデフォルトに
    COUNT(sm.store_id) FILTER (WHERE sm.store_id IS NOT NULL)
  FROM business_users bu
  LEFT JOIN store_memberships sm ON bu.id = sm.business_user_id
  WHERE bu.id = user_id
  INTO store_ids, store_roles, default_store_id, store_count;
  
  -- business_usersテーブルにユーザーが存在しない場合の処理
  IF NOT FOUND THEN
    RAISE LOG 'JWT Hook: User not found in business_users table: %', user_id;
    store_ids := ARRAY[]::text[];
    store_roles := '{}'::jsonb;
    default_store_id := NULL;
    store_count := 0;
  END IF;
  
  -- デバッグ用ログ
  RAISE LOG 'JWT Hook: Found % stores for user %', store_count, user_id;
  
  -- SupabaseのJWT Hook仕様に準拠した形式で返す
  -- event のすべての元データを保持し、app_metadataのみを追加/更新
  RETURN jsonb_build_object(
    'aud', event->>'aud',
    'exp', (event->>'exp')::bigint,
    'iat', (event->>'iat')::bigint,
    'sub', event->>'sub',
    'email', event->>'email',
    'phone', event->>'phone',
    'role', event->>'role',
    'aal', event->>'aal',
    'session_id', event->>'session_id',
    'is_anonymous', (event->>'is_anonymous')::boolean,
    'app_metadata', COALESCE(event->'app_metadata', '{}'::jsonb) || jsonb_build_object(
      'store_ids', store_ids,
      'store_roles', store_roles,
      'default_store_id', default_store_id,
      'has_store_access', store_count > 0,
      'store_count', store_count,
      'user_type', CASE 
        WHEN store_count > 0 THEN 'store_user'
        ELSE 'no_store_user'
      END
    ),
    'user_metadata', COALESCE(event->'user_metadata', '{}'::jsonb)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生した場合は元のeventをそのまま返す（カスタムクレームなし）
    RAISE LOG 'JWT Hook: Error occurred for user %: %', user_id, SQLERRM;
    RETURN event;
END;
$$;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- テスト用のサンプルクエリ（実際のeventデータ形式をシミュレート）
/*
SELECT public.custom_access_token_hook(
  jsonb_build_object(
    'user_id', 'あなたの実際のuser_id',
    'aud', 'authenticated',
    'exp', extract(epoch from now() + interval '1 hour')::bigint,
    'iat', extract(epoch from now())::bigint,
    'sub', 'あなたの実際のuser_id',
    'email', 'test@example.com',
    'phone', '',
    'role', 'authenticated',
    'aal', 'aal1',
    'session_id', 'sample-session-id',
    'is_anonymous', false,
    'app_metadata', '{}',
    'user_metadata', '{}'
  )
);
*/