import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 月グループを判定する関数
// groupA: 1,4,7,10月 → 0
// groupB: 2,5,8,11月 → 1
// groupC: 3,6,9,12月 → 2
function getMonthGroup(month: number): 'A' | 'B' | 'C' {
  const groupIndex = (month - 1) % 3
  return ['A', 'B', 'C'][groupIndex] as 'A' | 'B' | 'C'
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
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // 2. 今月のロック設定を確認
    const { data: monthLock } = await supabaseAdmin
      .from('company_qsc_monthly_locks')
      .select('locked_form_id, locked_qsc_type')
      .eq('company_id', companyId)
      .eq('target_year', currentYear)
      .eq('target_month', currentMonth)
      .maybeSingle()

    let formId: string | null = null
    let qscType: string | null = null

    if (monthLock) {
      // ロックがある場合はロックされたフォームを使用
      formId = monthLock.locked_form_id
      qscType = monthLock.locked_qsc_type
    } else {
      // 3. ロックがない場合はローテーション設定から今月のQSCを判定
      const { data: rotationSettings } = await supabaseAdmin
        .from('company_qsc_rotation_settings')
        .select('group_a_type, group_b_type, group_c_type')
        .eq('company_id', companyId)
        .maybeSingle()

      // デフォルトのローテーション設定
      const groupAType = rotationSettings?.group_a_type ?? 'Quality'
      const groupBType = rotationSettings?.group_b_type ?? 'Service'
      const groupCType = rotationSettings?.group_c_type ?? 'Cleanliness'

      // 今月のグループを判定
      const monthGroup = getMonthGroup(currentMonth)

      switch (monthGroup) {
        case 'A':
          qscType = groupAType
          break
        case 'B':
          qscType = groupBType
          break
        case 'C':
          qscType = groupCType
          break
      }

      // 4. QSCフォーム設定から対応するフォームIDを取得
      const { data: formSettings } = await supabaseAdmin
        .from('company_qsc_form_settings')
        .select('quality_form_id, service_form_id, cleanliness_form_id')
        .eq('company_id', companyId)
        .maybeSingle()

      if (formSettings) {
        switch (qscType) {
          case 'Quality':
            formId = formSettings.quality_form_id
            break
          case 'Service':
            formId = formSettings.service_form_id
            break
          case 'Cleanliness':
            formId = formSettings.cleanliness_form_id
            break
        }
      }
    }

    // フォームIDが見つからない場合
    if (!formId) {
      return new Response(
        JSON.stringify({
          error: 'No form configured for this store',
          storeCode,
          companyId,
          currentMonth,
          qscType
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    // 5. リダイレクトURLを生成（store_url_codeを使用）
    const actualStoreCode = store.store_url_code || storeCode
    const redirectUrl = `https://reviewform.openreview.jp/?reviewFormId=${formId}&storeCode=${actualStoreCode}`

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl,
        storeId: store.id,
        storeName: store.name,
        formId,
        qscType,
        currentMonth,
        monthGroup: getMonthGroup(currentMonth)
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
