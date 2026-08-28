// Supabase Edge Function: 安全な店舗作成エンドポイント
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
    const { name, address, companyId: requestedCompanyId } = await req.json()

    // 🔒 入力バリデーション
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('店舗名は必須です')
    }

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      throw new Error('店舗住所は必須です')
    }

    if (name.trim().length > 100) {
      throw new Error('店舗名は100文字以内で入力してください')
    }

    if (address.trim().length > 500) {
      throw new Error('店舗住所は500文字以内で入力してください')
    }

    // 🔒 会社IDの取得とアクセス権限チェック
    let companyId = null

    // ケース1: companyIdが明示的に指定されている場合（パートナーユーザー用）
    if (requestedCompanyId) {
      console.log('Checking partner access for companyId:', requestedCompanyId, 'userId:', user.id)

      // まずユーザーのパートナー企業IDを取得
      const { data: partnerMemberships, error: membershipError } = await supabase
        .from('partner_memberships')
        .select('partner_company_id')
        .eq('business_users_id', user.id)

      // パートナー企業IDのリストを作成
      if (partnerMemberships && partnerMemberships.length > 0) {
        const partnerCompanyIds = partnerMemberships.map(m => m.partner_company_id)

        // そのパートナー企業が指定された会社にアクセスできるかチェック
        const { data: affiliateCompanies, error: affiliateError } = await supabase
          .from('partner_affiliate_companies')
          .select('companies_id')
          .eq('companies_id', requestedCompanyId)
          .in('partner_company_id', partnerCompanyIds)

        if (affiliateCompanies && affiliateCompanies.length > 0) {
          companyId = requestedCompanyId
          console.log('✅ Partner access granted for companyId:', companyId)
        } else {
          console.log('❌ Partner access denied - company not affiliated')
        }
      } else {
        console.log('⚠️ No partner memberships found')
      }
    }

    // ケース2: 通常の会社メンバーとしてのアクセス
    if (!companyId) {
      console.log('Checking company_memberships for userId:', user.id)
      const { data: companyRelation, error: relationError } = await supabase
        .from('company_memberships')
        .select('company_id')
        .eq('business_user_id', user.id)
        .single()

      if (relationError || !companyRelation) {
        throw new Error('ユーザーに関連付けられた会社が見つかりません')
      }

      companyId = companyRelation.company_id
      console.log('✅ Company membership found, companyId:', companyId)
    }

    if (!companyId) {
      throw new Error('会社に所属していません')
    }

    // 🔒 会社が実際に存在するかチェック
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      throw new Error('関連付けられた会社が存在しません')
    }

    // 🔒 同じ会社内での店舗名重複チェック
    const { data: existingStore, error: storeCheckError } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId)
      .ilike('name', name.trim())
      .single()

    if (existingStore && !storeCheckError) {
      throw new Error('同じ会社内に同名の店舗が既に存在します')
    }

    // 🔒 店舗作成（認証されたユーザーまたはパートナーの会社IDのみ使用）
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert([
        {
          company_id: companyId, // 🔒 認証されたユーザーまたはパートナーの会社IDのみ
          name: name.trim(),
          address: address.trim()
        }
      ])
      .select('*, companies(name)')
      .single()

    if (storeError) {
      throw new Error(`店舗の登録に失敗: ${storeError.message}`)
    }

    // 成功レスポンス
    return new Response(
      JSON.stringify({ 
        success: true, 
        store: store,
        message: '店舗が正常に登録されました' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Store creation error:', error)
    
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