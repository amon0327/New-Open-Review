// 企業へのアクセス権限を判定する共通モジュール
// company_memberships (直接所属) または partner_memberships → partner_affiliate_companies (間接所属) のいずれかで許可
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type SupabaseAdminClient = ReturnType<typeof createClient>

export async function userHasCompanyAccess(
  admin: SupabaseAdminClient,
  userId: string,
  companyId: string,
): Promise<boolean> {
  // 1. 直接所属
  const { data: directMembership } = await admin
    .from('company_memberships')
    .select('id')
    .eq('company_id', companyId)
    .eq('business_user_id', userId)
    .maybeSingle()
  if (directMembership) return true

  // 2. パートナー経由の間接所属
  const { data: partnerMemberships } = await admin
    .from('partner_memberships')
    .select('partner_company_id')
    .eq('business_users_id', userId)
    .eq('is_active', true)

  if (!partnerMemberships || partnerMemberships.length === 0) return false

  const partnerCompanyIds = (partnerMemberships as Array<{ partner_company_id: string }>)
    .map(pm => pm.partner_company_id)

  const { data: affiliations } = await admin
    .from('partner_affiliate_companies')
    .select('id')
    .eq('companies_id', companyId)
    .in('partner_company_id', partnerCompanyIds)

  return !!(affiliations && affiliations.length > 0)
}
