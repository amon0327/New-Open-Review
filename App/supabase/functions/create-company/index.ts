// Supabase Edge Function: 安全な会社作成エンドポイント
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
      throw new Error('会社名は必須です')
    }

    if (name.trim().length > 100) {
      throw new Error('会社名は100文字以内で入力してください')
    }

    // 🔒 既存の関連付けチェック（重複防止）
    const { data: existingRelation, error: checkError } = await supabase
      .from('company_memberships')
      .select('id')
      .eq('business_user_id', user.id)
      .single()

    if (existingRelation && !checkError) {
      throw new Error('既に会社情報が登録されています')
    }

    // 🔒 同名会社のチェック
    const { data: existingCompany, error: companyCheckError } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', name.trim())
      .single()

    if (existingCompany && !companyCheckError) {
      throw new Error('同名の会社が既に存在します')
    }

    // トランザクション開始（会社作成と関連付け）
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
      throw new Error(`会社情報の保存に失敗: ${companyError.message}`)
    }

    // ユーザーと会社の関連付け
    const { error: relationError } = await supabase
      .from('company_memberships')
      .insert([
        {
          business_user_id: user.id, // 🔒 認証されたユーザーIDのみ使用
          company_id: company.id
        }
      ])

    if (relationError) {
      // 会社作成をロールバック（手動削除）
      await supabase
        .from('companies')
        .delete()
        .eq('id', company.id)
      
      throw new Error(`関連付けに失敗: ${relationError.message}`)
    }

    // 成功レスポンス
    return new Response(
      JSON.stringify({ 
        success: true, 
        company: company,
        message: '会社情報が正常に登録されました' 
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