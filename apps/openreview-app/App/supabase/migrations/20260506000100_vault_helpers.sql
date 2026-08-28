-- service_role 限定で Vault にアクセスする RPC ラッパー
CREATE OR REPLACE FUNCTION public.vault_create_secret_named(p_value text, p_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_id uuid;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND current_user <> 'service_role' THEN
    RAISE EXCEPTION 'service_role only';
  END IF;
  SELECT vault.create_secret(p_value, p_name) INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.vault_update_secret(p_id uuid, p_value text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND current_user <> 'service_role' THEN
    RAISE EXCEPTION 'service_role only';
  END IF;
  PERFORM vault.update_secret(p_id, p_value);
END;
$$;

CREATE OR REPLACE FUNCTION public.vault_get_decrypted_secret(p_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_secret text;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND current_user <> 'service_role' THEN
    RAISE EXCEPTION 'service_role only';
  END IF;
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE id = p_id;
  RETURN v_secret;
END;
$$;

REVOKE ALL ON FUNCTION public.vault_create_secret_named(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vault_update_secret(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vault_get_decrypted_secret(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vault_create_secret_named(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.vault_update_secret(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.vault_get_decrypted_secret(uuid) TO service_role;
