import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== create-review-form v3.0 WITH COMPANY_ID ===')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      throw new Error('認証トークンが必要です')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      throw new Error('認証に失敗しました')
    }

    const { title, storeId, companyId: requestedCompanyId } = await req.json()
    const reviewFormTitle = title || '新規レビューフォーム'

    let companyId = null

    // ケース1: companyIdが明示的に指定されている場合
    if (requestedCompanyId) {
      console.log('Checking access for requested companyId:', requestedCompanyId)

      // 1-A: まず企業メンバーシップをチェック（company_memberships）
      const { data: directMembership, error: directMembershipError } = await supabaseAdmin
        .from('company_memberships')
        .select('company_id')
        .eq('business_user_id', user.id)
        .eq('company_id', requestedCompanyId)

      if (directMembershipError) {
        console.error('Company membership check error:', directMembershipError)
      }

      if (directMembership && directMembership.length > 0) {
        companyId = requestedCompanyId
        console.log('Direct company membership found, companyId:', companyId)
      }

      // 1-B: 企業メンバーシップがない場合、パートナーメンバーシップをチェック
      if (!companyId) {
        console.log('Checking partner access for companyId:', requestedCompanyId)

        const { data: partnerMemberships, error: membershipError } = await supabaseAdmin
          .from('partner_memberships')
          .select('partner_company_id')
          .eq('business_users_id', user.id)

        if (membershipError) {
          throw new Error(`パートナーメンバーシップ取得に失敗: ${membershipError.message}`)
        }

        if (partnerMemberships && partnerMemberships.length > 0) {
          const partnerCompanyIds = partnerMemberships.map(m => m.partner_company_id)

          const { data: affiliateCompanies, error: affiliateError } = await supabaseAdmin
            .from('partner_affiliate_companies')
            .select('companies_id')
            .eq('companies_id', requestedCompanyId)
            .in('partner_company_id', partnerCompanyIds)

          if (affiliateError) {
            throw new Error(`提携企業チェックに失敗: ${affiliateError.message}`)
          }

          if (affiliateCompanies && affiliateCompanies.length > 0) {
            companyId = requestedCompanyId
            console.log('Partner access granted for company:', companyId)
          }
        }
      }
    }

    // ケース2: companyIdが指定されていない場合、通常の会社メンバーとしてのアクセス
    if (!companyId && !requestedCompanyId) {
      console.log('No companyId requested, checking company membership for userId:', user.id)

      const { data: companyMembership, error: membershipError } = await supabaseAdmin
        .from('company_memberships')
        .select('company_id')
        .eq('business_user_id', user.id)

      console.log('Company memberships:', companyMembership)

      if (membershipError) {
        throw new Error(`会社情報の取得に失敗: ${membershipError.message}`)
      }

      if (companyMembership && companyMembership.length > 0) {
        companyId = companyMembership[0].company_id
        console.log('Company membership found, companyId:', companyId)
      }
    }

    // ケース3: パートナーメンバーシップから自動選択
    if (!companyId) {
      console.log('Checking partner membership for auto-select')

      const { data: partnerMemberships, error: partnerError } = await supabaseAdmin
        .from('partner_memberships')
        .select('partner_company_id')
        .eq('business_users_id', user.id)

      if (!partnerError && partnerMemberships && partnerMemberships.length > 0) {
        const partnerCompanyIds = partnerMemberships.map(m => m.partner_company_id)

        const { data: affiliateCompanies, error: affiliateError } = await supabaseAdmin
          .from('partner_affiliate_companies')
          .select('companies_id')
          .in('partner_company_id', partnerCompanyIds)
          .limit(1)

        if (!affiliateError && affiliateCompanies && affiliateCompanies.length > 0) {
          companyId = affiliateCompanies[0].companies_id
          console.log('Auto-selected company:', companyId)
        }
      }
    }

    if (!companyId) {
      console.error('No company access found for user:', user.id)
      throw new Error('会社に所属していないか、アクセス権限がありません')
    }

    // storeIdチェック
    if (storeId) {
      const { data: storeData, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, company_id')
        .eq('id', storeId)
        .eq('company_id', companyId)

      if (storeError) {
        throw new Error(`店舗情報の取得に失敗: ${storeError.message}`)
      }

      if (!storeData || storeData.length === 0) {
        throw new Error('指定された店舗が見つからないか、アクセス権限がありません')
      }
    }

    // レビューフォームを作成 - company_idを含める
    console.log('INSERTING review form with company_id:', companyId)

    const { data: reviewFormData, error: reviewFormError } = await supabaseAdmin
      .from('review_forms')
      .insert([
        {
          business_users: user.id,
          title: reviewFormTitle,
          is_published: false,
          is_deleted: false,
          company_id: companyId
        }
      ])
      .select('id, title, created_at, company_id')

    if (reviewFormError) {
      console.error('Review form insert error:', reviewFormError)
      throw new Error(`レビューフォームの作成に失敗: ${reviewFormError.message}`)
    }

    if (!reviewFormData || reviewFormData.length === 0) {
      throw new Error('レビューフォームデータの取得に失敗しました')
    }

    const reviewForm = reviewFormData[0]
    console.log('Created review form:', JSON.stringify(reviewForm))

    // store_review_forms作成
    if (storeId) {
      const { error: storeReviewFormError } = await supabaseAdmin
        .from('store_review_forms')
        .insert([{ store_id: storeId, review_form_id: reviewForm.id }])

      if (storeReviewFormError) {
        throw new Error(`店舗とレビューフォームの関連付けに失敗: ${storeReviewFormError.message}`)
      }
    } else {
      const { data: firstStore, error: firstStoreError } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('company_id', companyId)
        .limit(1)

      if (firstStoreError) {
        throw new Error(`デフォルト店舗の取得に失敗: ${firstStoreError.message}`)
      }

      if (!firstStore || firstStore.length === 0) {
        throw new Error('店舗が見つかりません。先に店舗を作成してください')
      }

      const { error: storeReviewFormError } = await supabaseAdmin
        .from('store_review_forms')
        .insert([{ store_id: firstStore[0].id, review_form_id: reviewForm.id }])

      if (storeReviewFormError) {
        throw new Error(`店舗とレビューフォームの関連付けに失敗: ${storeReviewFormError.message}`)
      }
    }

    // lottery作成
    const { error: lotteryError } = await supabaseAdmin
      .from('lottery')
      .insert([{
        review_form_id: reviewForm.id,
        max_wins_per_month: 1,
        win_rate_divisor: 1000,
        current_wins: 0,
        current_trials: 0
      }])

    if (lotteryError) {
      throw new Error(`抽選設定の作成に失敗: ${lotteryError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'レビューフォームが正常に作成されました',
        reviewForm: {
          id: reviewForm.id,
          title: reviewForm.title,
          created_at: reviewForm.created_at,
          company_id: reviewForm.company_id
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
