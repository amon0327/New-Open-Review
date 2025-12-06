import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
      // パートナー企業経由でのアクセス権限を確認
      const { data: partnerAccess, error: partnerError } = await supabaseAdmin
        .from('partner_affiliate_companies')
        .select('companies_id')
        .eq('companies_id', requestedCompanyId)
        .in('partner_company_id',
          supabaseAdmin
            .from('partner_memberships')
            .select('partner_company_id')
            .eq('business_users_id', user.id)
        )

      if (partnerError) {
        throw new Error(`パートナーアクセス確認に失敗: ${partnerError.message}`)
      }

      if (partnerAccess && partnerAccess.length > 0) {
        companyId = requestedCompanyId
      }
    }

    // ケース2: 通常の会社メンバーとしてのアクセス
    if (!companyId) {
      const { data: companyMembership, error: membershipError } = await supabaseAdmin
        .from('company_memberships')
        .select('company_id')
        .eq('business_user_id', user.id)

      if (membershipError) {
        throw new Error(`会社情報の取得に失敗: ${membershipError.message}`)
      }

      if (companyMembership && companyMembership.length > 0) {
        companyId = companyMembership[0].company_id
      }
    }

    // どちらの方法でも会社が見つからない場合
    if (!companyId) {
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
    const { data: reviewFormData, error: reviewFormError } = await supabaseAdmin
      .from('review_forms')
      .insert([
        {
          business_users: user.id,
          title: reviewFormTitle,
          is_published: false,
          is_deleted: false
        }
      ])
      .select('id, title, created_at')

    if (reviewFormError) {
      throw new Error(`レビューフォームの作成に失敗: ${reviewFormError.message}`)
    }

    if (!reviewFormData || reviewFormData.length === 0) {
      throw new Error('レビューフォームデータの取得に失敗しました')
    }

    const reviewForm = reviewFormData[0]

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