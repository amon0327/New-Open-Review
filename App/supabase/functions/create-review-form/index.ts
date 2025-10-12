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
    const { title } = await req.json()
    
    // タイトルが指定されていない場合はデフォルトを使用
    const reviewFormTitle = title || '新規レビューフォーム'

    // ユーザーの会社メンバーシップを確認（サービスロールで）
    const { data: companyMembership, error: membershipError } = await supabaseAdmin
      .from('company_memberships')
      .select('company_id')
      .eq('business_user_id', user.id)

    if (membershipError) {
      throw new Error(`会社情報の取得に失敗: ${membershipError.message}`)
    }

    if (!companyMembership || companyMembership.length === 0) {
      throw new Error('会社に所属していません')
    }

    const companyId = companyMembership[0].company_id

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

    // company_review_formsテーブルに関連付けを作成（サービスロールで）
    const { data: companyReviewFormData, error: companyReviewFormError } = await supabaseAdmin
      .from('company_review_forms')
      .insert([
        {
          company_id: companyId,
          review_form_id: reviewForm.id
        }
      ])
      .select('id')

    if (companyReviewFormError) {
      throw new Error(`会社とレビューフォームの関連付けに失敗: ${companyReviewFormError.message}`)
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