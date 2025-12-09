import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // バージョン確認用ログ（この行が表示されれば最新版）
  console.log('=== create-review-form v2.1 - company_id support ===')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // サービスロール用のSupabaseクライアントを作成
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 認証用のSupabaseクライアント（JWTトークン検証用）
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // JWTトークンからユーザー情報を取得
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      throw new Error('認証トークンが必要です')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      throw new Error('認証に失敗しました')
    }

    // リクエストボディから必要な情報を取得
    const { title, storeId, companyId: requestedCompanyId } = await req.json()

    // タイトルが指定されていない場合はデフォルトを使用
    const reviewFormTitle = title || '新規レビューフォーム'

    let companyId = null

    // ケース1: companyIdが明示的に指定されている場合（パートナーユーザー用）
    if (requestedCompanyId) {
      console.log('Checking partner access for companyId:', requestedCompanyId, 'userId:', user.id)

      // まずユーザーのパートナー企業IDを取得
      const { data: partnerMemberships, error: membershipError } = await supabaseAdmin
        .from('partner_memberships')
        .select('partner_company_id')
        .eq('business_users_id', user.id)

      console.log('Partner memberships:', partnerMemberships, 'error:', membershipError)

      if (membershipError) {
        throw new Error(`パートナーメンバーシップ取得に失敗: ${membershipError.message}`)
      }

      // パートナー企業IDのリストを作成
      if (partnerMemberships && partnerMemberships.length > 0) {
        const partnerCompanyIds = partnerMemberships.map(m => m.partner_company_id)
        console.log('Partner company IDs:', partnerCompanyIds)

        // そのパートナー企業が指定された会社にアクセスできるかチェック
        const { data: affiliateCompanies, error: affiliateError } = await supabaseAdmin
          .from('partner_affiliate_companies')
          .select('companies_id')
          .eq('companies_id', requestedCompanyId)
          .in('partner_company_id', partnerCompanyIds)

        console.log('Affiliate companies:', affiliateCompanies, 'error:', affiliateError)

        if (affiliateError) {
          throw new Error(`提携企業チェックに失敗: ${affiliateError.message}`)
        }

        if (affiliateCompanies && affiliateCompanies.length > 0) {
          console.log('Partner access granted for company:', requestedCompanyId)
          companyId = requestedCompanyId
        }
      }
    }

    // ケース2: 通常の会社メンバーとしてのアクセス
    if (!companyId) {
      console.log('Checking company membership for userId:', user.id)

      const { data: companyMembership, error: membershipError } = await supabaseAdmin
        .from('company_memberships')
        .select('company_id')
        .eq('business_user_id', user.id)

      console.log('Company memberships:', companyMembership, 'error:', membershipError)

      if (membershipError) {
        throw new Error(`会社情報の取得に失敗: ${membershipError.message}`)
      }

      if (companyMembership && companyMembership.length > 0) {
        companyId = companyMembership[0].company_id
        console.log('Company membership found, companyId:', companyId)
      }
    }

    // ケース3: パートナーメンバーシップのユーザーがcompanyIdを指定せずにフォーム作成
    // パートナーが管理する最初の企業を自動選択
    if (!companyId) {
      console.log('Checking partner membership for auto-select company, userId:', user.id)

      const { data: partnerMemberships, error: partnerError } = await supabaseAdmin
        .from('partner_memberships')
        .select('partner_company_id')
        .eq('business_users_id', user.id)

      console.log('Partner memberships for auto-select:', partnerMemberships, 'error:', partnerError)

      if (!partnerError && partnerMemberships && partnerMemberships.length > 0) {
        const partnerCompanyIds = partnerMemberships.map(m => m.partner_company_id)

        // パートナー企業が管理する企業を取得
        const { data: affiliateCompanies, error: affiliateError } = await supabaseAdmin
          .from('partner_affiliate_companies')
          .select('companies_id')
          .in('partner_company_id', partnerCompanyIds)
          .limit(1)

        console.log('Affiliate companies for auto-select:', affiliateCompanies, 'error:', affiliateError)

        if (!affiliateError && affiliateCompanies && affiliateCompanies.length > 0) {
          companyId = affiliateCompanies[0].companies_id
          console.log('Auto-selected company from partner affiliation:', companyId)
        }
      }
    }

    // どちらの方法でも会社が見つからない場合
    if (!companyId) {
      console.error('No company access found for user:', user.id, 'requestedCompanyId:', requestedCompanyId)
      throw new Error('会社に所属していないか、アクセス権限がありません')
    }

    // storeIdが指定されている場合、そのstoreが会社に属するかチェック
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

    // レビューフォームを作成（サービスロールで）
    // company_idを含めて作成することで、同じ会社のメンバーやパートナーがアクセス可能になる
    console.log('Creating review form with company_id:', companyId, 'user_id:', user.id)

    const insertData = {
      business_users: user.id,
      title: reviewFormTitle,
      is_published: false,
      is_deleted: false,
      company_id: companyId
    }
    console.log('Insert data:', JSON.stringify(insertData))

    const { data: reviewFormData, error: reviewFormError } = await supabaseAdmin
      .from('review_forms')
      .insert([insertData])
      .select('id, title, created_at, company_id')

    if (reviewFormError) {
      console.error('Review form creation error:', reviewFormError)
      throw new Error(`レビューフォームの作成に失敗: ${reviewFormError.message}`)
    }

    console.log('Review form created successfully:', JSON.stringify(reviewFormData))

    if (!reviewFormData || reviewFormData.length === 0) {
      throw new Error('レビューフォームデータの取得に失敗しました')
    }

    const reviewForm = reviewFormData[0]
    console.log('Created review form:', JSON.stringify(reviewForm))

    // 作成されたフォームのcompany_idを検証
    if (reviewForm.company_id !== companyId) {
      console.error('WARNING: company_id mismatch! Expected:', companyId, 'Got:', reviewForm.company_id)
    } else {
      console.log('SUCCESS: company_id correctly saved:', reviewForm.company_id)
    }

    // store_review_formsテーブルに関連付けを作成（サービスロールで）
    if (storeId) {
      const { data: storeReviewFormData, error: storeReviewFormError } = await supabaseAdmin
        .from('store_review_forms')
        .insert([
          {
            store_id: storeId,
            review_form_id: reviewForm.id
          }
        ])
        .select('id')

      if (storeReviewFormError) {
        throw new Error(`店舗とレビューフォームの関連付けに失敗: ${storeReviewFormError.message}`)
      }
    } else {
      // storeIdが指定されていない場合は、会社の最初の店舗を使用
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

      const { data: storeReviewFormData, error: storeReviewFormError } = await supabaseAdmin
        .from('store_review_forms')
        .insert([
          {
            store_id: firstStore[0].id,
            review_form_id: reviewForm.id
          }
        ])
        .select('id')

      if (storeReviewFormError) {
        throw new Error(`店舗とレビューフォームの関連付けに失敗: ${storeReviewFormError.message}`)
      }
    }

    const { data: lotteryData, error: lotteryError } = await supabaseAdmin
      .from('lottery')
      .insert([
        {
          review_form_id: reviewForm.id,
          max_wins_per_month: 1,
          win_rate_divisor: 1000,
          current_wins: 0,
          current_trials: 0
        }
      ])
      .select('id')

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
          company_id: companyId
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