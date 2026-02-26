-- published_reports テーブル作成
-- レポートのスタッフ公開状態を管理するテーブル

CREATE TABLE published_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  store_id UUID REFERENCES stores(id),
  year_month VARCHAR(7) NOT NULL,          -- "2026-01"
  is_published BOOLEAN NOT NULL DEFAULT false,
  pdf_storage_path TEXT,                    -- Storage内のパス
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, store_id, year_month)
);

-- RLS有効化
ALTER TABLE published_reports ENABLE ROW LEVEL SECURITY;

-- 企業メンバー・パートナーがSELECT可能
CREATE POLICY "company_members_select" ON published_reports
FOR SELECT USING (
  auth.role() = 'service_role'
  OR company_id IN (
    SELECT company_id FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
  OR company_id IN (
    SELECT company_id FROM get_partner_affiliated_companies(auth.uid())
  )
);

-- 企業メンバー・パートナーがINSERT/UPDATE可能
CREATE POLICY "company_members_upsert" ON published_reports
FOR ALL USING (
  auth.role() = 'service_role'
  OR company_id IN (
    SELECT company_id FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
  OR company_id IN (
    SELECT company_id FROM get_partner_affiliated_companies(auth.uid())
  )
) WITH CHECK (
  auth.role() = 'service_role'
  OR company_id IN (
    SELECT company_id FROM company_memberships
    WHERE business_user_id = auth.uid()
  )
  OR company_id IN (
    SELECT company_id FROM get_partner_affiliated_companies(auth.uid())
  )
);

-- インデックス
CREATE INDEX idx_published_reports_company ON published_reports(company_id);
CREATE INDEX idx_published_reports_lookup ON published_reports(company_id, store_id, year_month);
