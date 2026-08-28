-- ========================================
-- スタッフユーザー向けRLSポリシー追加
-- store_memberships経由でレポート関連テーブルにアクセス可能にする
-- ========================================

-- 1. monthly_analytics_summary: スタッフは自店舗データを参照可能
CREATE POLICY "Store staff can view their store analytics"
  ON monthly_analytics_summary
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_memberships
      WHERE store_memberships.store_id = monthly_analytics_summary.store_id
      AND store_memberships.business_user_id = auth.uid()
    )
  );

-- 2. monthly_analytics_ai_text: RLS有効化 + ポリシー追加
ALTER TABLE monthly_analytics_ai_text ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to ai_text"
  ON monthly_analytics_ai_text
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Company members can view ai_text"
  ON monthly_analytics_ai_text
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_memberships
      WHERE company_memberships.company_id = monthly_analytics_ai_text.company_id
      AND company_memberships.business_user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can view ai_text"
  ON monthly_analytics_ai_text
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_affiliate_companies pac
      JOIN partner_memberships pm ON pac.partner_company_id = pm.partner_company_id
      WHERE pac.companies_id = monthly_analytics_ai_text.company_id
      AND pm.business_users_id = auth.uid()
    )
  );

CREATE POLICY "Store staff can view their store ai_text"
  ON monthly_analytics_ai_text
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_memberships
      WHERE store_memberships.store_id = monthly_analytics_ai_text.store_id
      AND store_memberships.business_user_id = auth.uid()
    )
  );

-- 3. monthly_analytics_issue: RLS有効化 + ポリシー追加
ALTER TABLE monthly_analytics_issue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to issue"
  ON monthly_analytics_issue
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Company members can view issue"
  ON monthly_analytics_issue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_memberships
      WHERE company_memberships.company_id = monthly_analytics_issue.company_id
      AND company_memberships.business_user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can view issue"
  ON monthly_analytics_issue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_affiliate_companies pac
      JOIN partner_memberships pm ON pac.partner_company_id = pm.partner_company_id
      WHERE pac.companies_id = monthly_analytics_issue.company_id
      AND pm.business_users_id = auth.uid()
    )
  );

CREATE POLICY "Store staff can view their store issue"
  ON monthly_analytics_issue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_memberships
      WHERE store_memberships.store_id = monthly_analytics_issue.store_id
      AND store_memberships.business_user_id = auth.uid()
    )
  );

-- 4. stores: スタッフは自店舗を参照可能
CREATE POLICY "Store staff can view their store"
  ON stores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_memberships
      WHERE store_memberships.store_id = stores.id
      AND store_memberships.business_user_id = auth.uid()
    )
  );

-- 5. companies: スタッフは所属店舗の企業を参照可能
CREATE POLICY "Store staff can view their company"
  ON companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_memberships sm
      JOIN stores s ON s.id = sm.store_id
      WHERE s.company_id = companies.id
      AND sm.business_user_id = auth.uid()
    )
  );
