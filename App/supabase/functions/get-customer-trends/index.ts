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
    // サービスロール用のSupabaseクライアントを作成（RLSバイパス）
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

    // リクエストパラメータを取得
    const url = new URL(req.url)
    const companyId = url.searchParams.get('company_id')
    const storeId = url.searchParams.get('store_id')

    if (!companyId) {
      throw new Error('company_idが必要です')
    }

    // ユーザーが企業にアクセス可能かチェック
    const { data: companyMembership } = await supabaseAdmin
      .from('company_memberships')
      .select('id')
      .eq('business_user_id', user.id)
      .eq('company_id', companyId)
      .single()

    const { data: partnerAccess } = await supabaseAdmin
      .from('partner_affiliate_companies')
      .select(`
        id,
        partner_memberships!inner (
          id,
          business_users_id
        )
      `)
      .eq('companies_id', companyId)
      .eq('partner_memberships.business_users_id', user.id)

    const hasAccess = companyMembership || (partnerAccess && partnerAccess.length > 0)

    if (!hasAccess) {
      throw new Error('この企業のデータにアクセスする権限がありません')
    }

    // 回答データを取得
    let query = supabaseAdmin
      .from('preset_question_answer')
      .select(`
        id,
        created_at,
        p1_q3,
        p1_q4,
        p1_q5,
        p1_q6,
        store_id,
        company_id
      `)
      .eq('company_id', companyId)

    if (storeId && storeId !== 'all') {
      query = query.eq('store_id', storeId)
    }

    const { data: answers, error: answersError } = await query

    if (answersError) {
      throw new Error(`データの取得に失敗しました: ${answersError.message}`)
    }

    const allAnswers = answers || []
    const totalCount = allAnswers.length

    // === 性別分布 ===
    const genderCounts: Record<string, number> = {}
    allAnswers.forEach(a => {
      if (a.p1_q4) {
        genderCounts[a.p1_q4] = (genderCounts[a.p1_q4] || 0) + 1
      }
    })
    const genderTotal = Object.values(genderCounts).reduce((a, b) => a + b, 0)
    const genderDistribution = Object.entries(genderCounts).map(([gender, count]) => ({
      name: gender,
      value: genderTotal > 0 ? Math.round((count / genderTotal) * 100) : 0,
      count: count
    }))

    // === 顧客タイプ（リピーター/新規）===
    const repeaterCount = allAnswers.filter(a => a.p1_q3 && a.p1_q3 !== '初めて').length
    const newCustomerCount = allAnswers.filter(a => a.p1_q3 === '初めて').length
    const customerTypeTotal = repeaterCount + newCustomerCount
    const customerTypeDistribution = [
      {
        name: 'リピーター',
        value: customerTypeTotal > 0 ? Math.round((repeaterCount / customerTypeTotal) * 100) : 0,
        count: repeaterCount
      },
      {
        name: '新規',
        value: customerTypeTotal > 0 ? Math.round((newCustomerCount / customerTypeTotal) * 100) : 0,
        count: newCustomerCount
      }
    ]

    // === 年齢分布 ===
    const ageGroups: Record<string, number> = {
      '20代': 0,
      '30代': 0,
      '40代': 0,
      '50代': 0,
      '60代以上': 0
    }
    allAnswers.forEach(a => {
      const age = a.p1_q5 || ''
      if (age.includes('20') || age.includes('25') || age.includes('29') || age === '20代') {
        ageGroups['20代']++
      } else if (age.includes('30') || age.includes('35') || age.includes('39') || age === '30代') {
        ageGroups['30代']++
      } else if (age.includes('40') || age.includes('45') || age.includes('49') || age === '40代') {
        ageGroups['40代']++
      } else if (age.includes('50') || age.includes('55') || age.includes('59') || age === '50代') {
        ageGroups['50代']++
      } else if (age.includes('60') || age.includes('65') || age.includes('70') || age === '60代' || age === '60代以上') {
        ageGroups['60代以上']++
      }
    })
    const ageTotal = Object.values(ageGroups).reduce((a, b) => a + b, 0)
    const ageDistribution = Object.entries(ageGroups).map(([age, count]) => ({
      name: age,
      value: ageTotal > 0 ? Math.round((count / ageTotal) * 100) : 0,
      count: count
    }))

    // === 同行者分布（来店目的の代わり）===
    const companionCounts: Record<string, number> = {}
    allAnswers.forEach(a => {
      if (a.p1_q6) {
        companionCounts[a.p1_q6] = (companionCounts[a.p1_q6] || 0) + 1
      }
    })
    const companionTotal = Object.values(companionCounts).reduce((a, b) => a + b, 0)
    const companionDistribution = Object.entries(companionCounts).map(([companion, count]) => ({
      name: companion,
      value: companionTotal > 0 ? Math.round((count / companionTotal) * 100) : 0,
      count: count
    }))

    // === リピーターと新規の傾向比較 ===
    const repeaterAnswers = allAnswers.filter(a => a.p1_q3 && a.p1_q3 !== '初めて')
    const newCustomerAnswers = allAnswers.filter(a => a.p1_q3 === '初めて')

    // リピーターの年齢分布
    const repeaterAgeGroups: Record<string, number> = { '20代': 0, '30代': 0, '40代': 0, '50代': 0, '60代以上': 0 }
    repeaterAnswers.forEach(a => {
      const age = a.p1_q5 || ''
      if (age.includes('20') || age.includes('25') || age.includes('29') || age === '20代') repeaterAgeGroups['20代']++
      else if (age.includes('30') || age.includes('35') || age.includes('39') || age === '30代') repeaterAgeGroups['30代']++
      else if (age.includes('40') || age.includes('45') || age.includes('49') || age === '40代') repeaterAgeGroups['40代']++
      else if (age.includes('50') || age.includes('55') || age.includes('59') || age === '50代') repeaterAgeGroups['50代']++
      else if (age.includes('60') || age.includes('65') || age.includes('70') || age === '60代' || age === '60代以上') repeaterAgeGroups['60代以上']++
    })

    // 新規の年齢分布
    const newCustomerAgeGroups: Record<string, number> = { '20代': 0, '30代': 0, '40代': 0, '50代': 0, '60代以上': 0 }
    newCustomerAnswers.forEach(a => {
      const age = a.p1_q5 || ''
      if (age.includes('20') || age.includes('25') || age.includes('29') || age === '20代') newCustomerAgeGroups['20代']++
      else if (age.includes('30') || age.includes('35') || age.includes('39') || age === '30代') newCustomerAgeGroups['30代']++
      else if (age.includes('40') || age.includes('45') || age.includes('49') || age === '40代') newCustomerAgeGroups['40代']++
      else if (age.includes('50') || age.includes('55') || age.includes('59') || age === '50代') newCustomerAgeGroups['50代']++
      else if (age.includes('60') || age.includes('65') || age.includes('70') || age === '60代' || age === '60代以上') newCustomerAgeGroups['60代以上']++
    })

    const repeaterAgeTotal = Object.values(repeaterAgeGroups).reduce((a, b) => a + b, 0)
    const newCustomerAgeTotal = Object.values(newCustomerAgeGroups).reduce((a, b) => a + b, 0)

    // レーダーチャート用データ（年齢層別）
    const radarData = Object.keys(ageGroups).map(age => ({
      category: age,
      total: ageTotal > 0 ? Math.round((ageGroups[age] / ageTotal) * 100) : 0,
      repeater: repeaterAgeTotal > 0 ? Math.round((repeaterAgeGroups[age] / repeaterAgeTotal) * 100) : 0,
      newCustomer: newCustomerAgeTotal > 0 ? Math.round((newCustomerAgeGroups[age] / newCustomerAgeTotal) * 100) : 0
    }))

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          totalResponses: totalCount,
          genderDistribution,
          customerTypeDistribution,
          ageDistribution,
          companionDistribution,
          radarData
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Get customer trends error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
