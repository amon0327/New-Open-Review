// Supabase Edge Function: 安全なパートナー企業作成エンドポイント
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 🔒 認証トークンの検証
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('認証トークンが必要です')
    }

    // Supabaseクライアント初期化（サーバーサイド）
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 🔒 JWTトークンからユーザー情報を取得
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      throw new Error('無効な認証トークンです')
    }

    // リクエストボディの取得
    const { company_name, website_url, phone, email } = await req.json()

    // 🔒 入力バリデーション
    if (!company_name || typeof company_name !== 'string' || company_name.trim().length === 0) {
      throw new Error('パートナー企業名は必須です')
    }

    if (company_name.trim().length > 100) {
      throw new Error('パートナー企業名は100文字以内で入力してください')
    }

    // 🔒 既存の関連付けチェック（重複防止）
    const { data: existingRelation, error: checkError } = await supabase
      .from('partner_memberships')
      .select('id')
      .eq('business_users_id', user.id)
      .single()

    if (existingRelation && !checkError) {
      throw new Error('既にパートナー企業情報が登録されています')
    }

    // 🔒 同名パートナー企業のチェック
    const { data: existingPartnerCompany, error: partnerCheckError } = await supabase
      .from('partner_company')
      .select('id')
      .ilike('company_name', company_name.trim())
      .single()

    if (existingPartnerCompany && !partnerCheckError) {
      throw new Error('同名のパートナー企業が既に存在します')
    }

    // トランザクション開始（パートナー企業作成と関連付け）
    const { data: partnerCompany, error: partnerCompanyError } = await supabase
      .from('partner_company')
      .insert([
        {
          company_name: company_name.trim(),
          website_url: website_url?.trim() || null,
          phone: phone?.trim() || null,
          email: email?.trim() || null
        }
      ])
      .select()
      .single()

    if (partnerCompanyError) {
      throw new Error(`パートナー企業情報の保存に失敗: ${partnerCompanyError.message}`)
    }

    // ユーザーとパートナー企業の関連付け
    const { error: relationError } = await supabase
      .from('partner_memberships')
      .insert([
        {
          business_users_id: user.id, // 🔒 認証されたユーザーIDのみ使用
          partner_company_id: partnerCompany.id
        }
      ])

    if (relationError) {
      // パートナー企業作成をロールバック（手動削除）
      await supabase
        .from('partner_company')
        .delete()
        .eq('id', partnerCompany.id)

      throw new Error(`関連付けに失敗: ${relationError.message}`)
    }

    // 成功レスポンス
    return new Response(
      JSON.stringify({
        success: true,
        partner_company: partnerCompany,
        message: 'パートナー企業情報が正常に登録されました'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Partner company creation error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
