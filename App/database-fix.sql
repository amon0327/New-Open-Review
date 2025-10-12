-- 不足しているテーブルを作成するSQLファイル
-- company_review_formsテーブルに書き込まれない問題を修正

-- 1. companiesテーブルを作成
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true
);

-- 2. company_membershipsテーブルを作成
CREATE TABLE IF NOT EXISTS company_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    business_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    is_active BOOLEAN DEFAULT true,
    UNIQUE(company_id, business_user_id)
);

-- 3. company_review_formsテーブルを作成
CREATE TABLE IF NOT EXISTS company_review_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    review_form_id UUID REFERENCES review_forms(id) ON DELETE CASCADE,
    UNIQUE(company_id, review_form_id)
);

-- 4. RLSを有効化
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_review_forms ENABLE ROW LEVEL SECURITY;

-- 5. companies テーブルのRLSポリシー
CREATE POLICY "companies_select_policy" ON companies
FOR SELECT
USING (
  id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "companies_insert_policy" ON companies
FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

CREATE POLICY "companies_update_policy" ON companies
FOR UPDATE
USING (
  id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- 6. company_memberships テーブルのRLSポリシー
CREATE POLICY "company_memberships_select_policy" ON company_memberships
FOR SELECT
USING (business_user_id = auth.uid());

CREATE POLICY "company_memberships_insert_policy" ON company_memberships
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role' OR 
  business_user_id = auth.uid()
);

CREATE POLICY "company_memberships_update_policy" ON company_memberships
FOR UPDATE
USING (business_user_id = auth.uid());

-- 7. company_review_forms テーブルのRLSポリシー
CREATE POLICY "company_review_forms_select_policy" ON company_review_forms
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "company_review_forms_insert_policy" ON company_review_forms
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role' OR
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "company_review_forms_update_policy" ON company_review_forms
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

CREATE POLICY "company_review_forms_delete_policy" ON company_review_forms
FOR DELETE
USING (
  company_id IN (
    SELECT company_id 
    FROM company_memberships 
    WHERE business_user_id = auth.uid()
  )
);

-- 8. インデックスを作成してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_company_memberships_business_user_id ON company_memberships(business_user_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_company_id ON company_memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_company_review_forms_company_id ON company_review_forms(company_id);
CREATE INDEX IF NOT EXISTS idx_company_review_forms_review_form_id ON company_review_forms(review_form_id);