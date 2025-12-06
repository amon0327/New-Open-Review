// Supabase Edge Function: 企業アカウント作成エンドポイント
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
    const { name, phone_number, email } = await req.json()

    // 🔒 入力バリデーション
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('企業名は必須です')
    }

    if (name.trim().length > 100) {
      throw new Error('企業名は100文字以内で入力してください')
    }

    // メールアドレスの簡易バリデーション
    if (email && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        throw new Error('有効なメールアドレスを入力してください')
      }
    }

    // 🔒 business_usersテーブルにユーザーが存在することを確認
    const { data: businessUser, error: businessUserError } = await supabase
      .from('business_users')
      .select('id')
      .eq('id', user.id)
      .single()

    // business_usersに存在しない場合は作成
    if (businessUserError && businessUserError.code === 'PGRST116') {
      const { error: createBusinessUserError } = await supabase
        .from('business_users')
        .insert([{
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || ''
        }])

      if (createBusinessUserError) {
        throw new Error(`ビジネスユーザーの作成に失敗: ${createBusinessUserError.message}`)
      }
    } else if (businessUserError) {
      throw new Error(`ビジネスユーザーの確認に失敗: ${businessUserError.message}`)
    }

    // 🔒 同名企業のチェック
    const { data: existingCompany, error: companyCheckError } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', name.trim())
      .single()

    if (existingCompany && !companyCheckError) {
      throw new Error('同名の企業が既に存在します')
    }

    // 企業アカウントの作成
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert([
        {
          name: name.trim(),
          phone_number: phone_number?.trim() || null,
          email: email?.trim() || null
        }
      ])
      .select()
      .single()

    if (companyError) {
      throw new Error(`企業アカウントの作成に失敗: ${companyError.message}`)
    }

    // company_membershipsに関連付け
    const { error: membershipError } = await supabase
      .from('company_memberships')
      .insert([
        {
          business_user_id: user.id,
          company_id: company.id
        }
      ])

    if (membershipError) {
      // 企業作成をロールバック（手動削除）
      await supabase
        .from('companies')
        .delete()
        .eq('id', company.id)

      throw new Error(`メンバーシップの作成に失敗: ${membershipError.message}`)
    }

    // 成功レスポンス
    return new Response(
      JSON.stringify({
        success: true,
        company: company,
        message: '企業アカウントが正常に作成されました'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Company creation error:', error)

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
