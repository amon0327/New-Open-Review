-- JWT Custom Access Token Hook 代替案
-- より安全でシンプルなアプローチ（最小限のカスタムクレームのみ）

-- 既存の関数を削除
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- シンプルなJWTカスタムクレーム用の関数
-- エラーを最小化し、必須フィールドのみを返す
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
  store_count integer := 0;
  has_access boolean := false;
BEGIN
  -- eventからuser_idを取得
  user_id := (event->>'user_id')::uuid;
  
  -- 店舗アクセス権限の簡単なチェックのみ
  SELECT COUNT(*) 
  FROM business_users bu
  LEFT JOIN store_memberships sm ON bu.id = sm.business_user_id
  WHERE bu.id = user_id AND sm.store_id IS NOT NULL
  INTO store_count;
  
  has_access := store_count > 0;
  
  -- 元のJWTクレームを保持し、最小限のapp_metadataのみを追加
  RETURN jsonb_build_object(
    'aud', event->>'aud',
    'exp', (event->>'exp')::bigint,
    'iat', (event->>'iat')::bigint,
    'sub', event->>'sub',
    'email', event->>'email',
    'phone', COALESCE(event->>'phone', ''),
    'role', event->>'role',
    'aal', event->>'aal',
    'session_id', event->>'session_id',
    'is_anonymous', COALESCE((event->>'is_anonymous')::boolean, false),
    'app_metadata', COALESCE(event->'app_metadata', '{}'::jsonb) || jsonb_build_object(
      'has_store_access', has_access,
      'store_count', store_count
    ),
    'user_metadata', COALESCE(event->'user_metadata', '{}'::jsonb)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- エラーが発生した場合は元のeventをそのまま返す
    RAISE LOG 'JWT Hook Error: %', SQLERRM;
    RETURN event;
END;
$$;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- さらにシンプルな代替案（カスタムクレームなし）
/*
-- もしまだエラーが出る場合は、この最小限の関数を使用
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 元のeventをそのまま返す（何も変更しない）
  RETURN event;
END;
$$;
*/