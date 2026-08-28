import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // URLからstore_codeを取得
    const url = new URL(req.url)
    const storeCode = url.searchParams.get('code')

    if (!storeCode) {
      return new Response(
        JSON.stringify({ error: 'Store code is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // セキュリティ: 8文字の英数字のみ許可（UUID等は拒否）
    if (!/^[a-z0-9]{8}$/i.test(storeCode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid store code format' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // 1. 店舗情報を取得（store_url_codeのみで検索）
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, company_id, name, store_url_code')
      .eq('store_url_code', storeCode.toLowerCase())
      .single()

    if (storeError || !store) {
      return new Response(
        JSON.stringify({ error: 'Store not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    const companyId = store.company_id

    // 2. 会社の公開フォーム設定を取得
    const { data: publicFormSettings, error: settingsError } = await supabaseAdmin
      .from('company_public_form_settings')
      .select('public_form_id')
      .eq('company_id', companyId)
      .single()

    let formId: string | null = null

    if (!settingsError && publicFormSettings) {
      // 公開フォーム設定がある場合はそれを使用
      formId = publicFormSettings.public_form_id
    } else {
      // 設定がない場合は会社の最新のレビューフォームを使用（フォールバック）
      const { data: reviewForm, error: formError } = await supabaseAdmin
        .from('review_forms')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!formError && reviewForm) {
        formId = reviewForm.id
      }
    }

    if (!formId) {
      return new Response(
        JSON.stringify({
          error: 'No review form configured for this company',
          storeCode,
          companyId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    // 3. リダイレクトURLを生成（store_url_codeを使用）
    const actualStoreCode = store.store_url_code || storeCode
    const redirectUrl = `https://reviewform.openreview.jp/?reviewFormId=${formId}&storeCode=${actualStoreCode}`

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl,
        storeId: store.id,
        storeName: store.name,
        formId: formId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Store redirect error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})