-- セキュリティポリシー設定
-- 重要：これらのSQLはSupabaseの管理画面で実行してください

-- 1. companiesテーブルのRLS有効化
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. created_by_business_user_idテーブルのRLS有効化  
ALTER TABLE public.created_by_business_user_id ENABLE ROW LEVEL SECURITY;

-- 3. companiesテーブル：認証されたユーザーのみ作成可能
CREATE POLICY "Users can create companies" ON public.companies
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- 4. companiesテーブル：全員が参照可能（必要に応じて制限）
CREATE POLICY "Everyone can view companies" ON public.companies
    FOR SELECT 
    USING (true);

-- 5. created_by_business_user_idテーブル：自分のレコードのみ作成可能
CREATE POLICY "Users can create their own business associations" ON public.created_by_business_user_id
    FOR INSERT 
    WITH CHECK (auth.uid() = business_user_id);

-- 6. created_by_business_user_idテーブル：自分のレコードのみ参照可能
CREATE POLICY "Users can view their own business associations" ON public.created_by_business_user_id
    FOR SELECT 
    USING (auth.uid() = business_user_id);

-- 7. created_by_business_user_idテーブル：重複防止（1ユーザー1会社）
CREATE UNIQUE INDEX idx_unique_business_user ON public.created_by_business_user_id(business_user_id);

-- 8. 会社の重複チェック（同名会社の防止）
CREATE UNIQUE INDEX idx_unique_company_name ON public.companies(LOWER(name));

-- 9. データベーストリガー：business_user_idの整合性チェック
CREATE OR REPLACE FUNCTION validate_business_user_association()
RETURNS TRIGGER AS $$
BEGIN
  -- 🔒 セキュリティ：認証されたユーザーのIDかチェック
  IF NEW.business_user_id != auth.uid() THEN
    RAISE EXCEPTION 'セキュリティエラー: 認証されたユーザーのIDと一致しません';
  END IF;
  
  -- 🔒 セキュリティ：既存の関連付けがないかチェック
  IF EXISTS (
    SELECT 1 FROM public.created_by_business_user_id 
    WHERE business_user_id = NEW.business_user_id 
    AND id != COALESCE(NEW.id, -1)
  ) THEN
    RAISE EXCEPTION 'セキュリティエラー: ユーザーは既に会社と関連付けられています';
  END IF;
  
  -- 🔒 セキュリティ：company_idが存在するかチェック
  IF NOT EXISTS (
    SELECT 1 FROM public.companies WHERE id = NEW.company_id
  ) THEN
    RAISE EXCEPTION 'セキュリティエラー: 指定された会社が存在しません';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. トリガーの設定
CREATE TRIGGER trigger_validate_business_user_association
  BEFORE INSERT OR UPDATE ON public.created_by_business_user_id
  FOR EACH ROW EXECUTE FUNCTION validate_business_user_association();

-- 11. 会社名の正規化とバリデーション
CREATE OR REPLACE FUNCTION validate_company_data()
RETURNS TRIGGER AS $$
BEGIN
  -- 🔒 セキュリティ：会社名の正規化
  NEW.name = TRIM(NEW.name);
  
  -- 🔒 セキュリティ：会社名の長さチェック
  IF LENGTH(NEW.name) = 0 OR LENGTH(NEW.name) > 100 THEN
    RAISE EXCEPTION 'セキュリティエラー: 会社名は1-100文字である必要があります';
  END IF;
  
  -- 🔒 セキュリティ：不正文字のチェック
  IF NEW.name ~ '[<>\"''&]' THEN
    RAISE EXCEPTION 'セキュリティエラー: 会社名に不正な文字が含まれています';
  END IF;
  
  -- 電話番号の正規化（任意）
  IF NEW.phone_number IS NOT NULL THEN
    NEW.phone_number = TRIM(NEW.phone_number);
    IF LENGTH(NEW.phone_number) = 0 THEN
      NEW.phone_number = NULL;
    END IF;
  END IF;
  
  -- メールアドレスの正規化（任意）
  IF NEW.email IS NOT NULL THEN
    NEW.email = TRIM(LOWER(NEW.email));
    IF LENGTH(NEW.email) = 0 THEN
      NEW.email = NULL;
    END IF;
    -- 基本的なメール形式チェック
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'セキュリティエラー: 無効なメールアドレス形式です';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 会社データ検証トリガー
CREATE TRIGGER trigger_validate_company_data
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION validate_company_data();

-- 13. 監査ログ機能（オプション）
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  old_data JSONB,
  new_data JSONB
);

-- 14. 監査ログトリガー関数
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    table_name,
    operation,
    user_id,
    old_data,
    new_data
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. 監査ログトリガー設定
CREATE TRIGGER audit_companies_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_business_associations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.created_by_business_user_id
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();