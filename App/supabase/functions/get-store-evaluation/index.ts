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

    // ========================================
    // QSCスコア取得（preset_question_answer）
    // p2_q1: Quality, p2_q2: Service, p2_q3: Cleanliness
    // 1-7の評価を5段階に正規化
    // ========================================
    let qscQuery = supabaseAdmin
      .from('preset_question_answer')
      .select('id, p2_q1, p2_q2, p2_q3, store_id, company_id')
      .eq('company_id', companyId)

    if (storeId && storeId !== 'all') {
      qscQuery = qscQuery.eq('store_id', storeId)
    }

    const { data: qscAnswers, error: qscError } = await qscQuery

    if (qscError) {
      throw new Error(`QSCデータの取得に失敗しました: ${qscError.message}`)
    }

    const allQscAnswers = qscAnswers || []

    // QSCスコア計算（1-7を1-5に正規化）
    const normalizeScore = (score: number) => {
      // 1-7 を 1-5 に変換: (score - 1) / 6 * 4 + 1
      return ((score - 1) / 6) * 4 + 1
    }

    const calculateQscScore = (answers: any[], field: string) => {
      const validAnswers = answers.filter(a => a[field] !== null && a[field] !== undefined)
      if (validAnswers.length === 0) return { score: 0, count: 0, trend: 0 }

      const sum = validAnswers.reduce((acc, a) => acc + normalizeScore(Number(a[field])), 0)
      const avgScore = sum / validAnswers.length

      return {
        score: Math.round(avgScore * 10) / 10, // 小数点1桁
        count: validAnswers.length,
        trend: 0 // TODO: 前月比較で計算
      }
    }

    const qscScores = {
      Q: {
        ...calculateQscScore(allQscAnswers, 'p2_q1'),
        label: 'クオリティ',
        color: 'violet'
      },
      S: {
        ...calculateQscScore(allQscAnswers, 'p2_q2'),
        label: 'サービス',
        color: 'blue'
      },
      C: {
        ...calculateQscScore(allQscAnswers, 'p2_q3'),
        label: 'クレンリネス',
        color: 'emerald'
      }
    }

    // ========================================
    // QSC項目別評価取得
    // emotion型: positive, negative, neutral
    // ========================================

    // Quality詳細項目のラベル
    const qualityLabels = [
      '商品の鮮度',
      '味の一貫性',
      '温度管理',
      '見た目・盛り付け',
      '分量の適切さ',
      '食材の品質',
      'メニューの豊富さ',
      '季節商品の魅力',
      '価格と品質のバランス',
      '特別メニューの満足度'
    ]

    // Service詳細項目のラベル
    const serviceLabels = [
      '接客態度',
      '注文の正確性',
      '待ち時間',
      'スタッフの知識',
      '問題解決能力',
      'レジ対応の速さ',
      '笑顔・親切さ',
      '特別な要望への対応',
      'スタッフの清潔感',
      'チームワーク'
    ]

    // Cleanliness詳細項目のラベル
    const cleanlinessLabels = [
      '店内の清潔さ',
      'テーブルの清潔さ',
      'トイレの清潔さ',
      '床の清潔さ',
      '窓・ガラスの清潔さ',
      '厨房の衛生管理',
      'ゴミ箱周辺の管理',
      '換気・空気の質',
      '備品の整理整頓',
      '外観・入口の清潔さ'
    ]

    // 詳細データ取得関数
    const getDetailedData = async (tableName: string, labels: string[]) => {
      let detailQuery = supabaseAdmin
        .from(tableName)
        .select('q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, is_positive, company_id, store_id')
        .eq('company_id', companyId)

      if (storeId && storeId !== 'all') {
        detailQuery = detailQuery.eq('store_id', storeId)
      }

      const { data, error } = await detailQuery

      if (error) {
        console.error(`${tableName} fetch error:`, error)
        return { items: [], positiveCount: 0, negativeCount: 0, neutralCount: 0 }
      }

      const answers = data || []

      // is_positiveでカウント
      const positiveCount = answers.filter(a => a.is_positive === true).length
      const negativeCount = answers.filter(a => a.is_positive === false).length
      const neutralCount = answers.filter(a => a.is_positive === null).length

      // 各項目（q1-q10）のポジティブ/ネガティブ/ニュートラル割合を計算
      const items = labels.map((label, index) => {
        const fieldName = `q${index + 1}`
        const itemAnswers = answers.filter(a => a[fieldName] !== null && a[fieldName] !== undefined)
        const total = itemAnswers.length

        if (total === 0) {
          return {
            label,
            positive: 0,
            negative: 0,
            neutral: 0,
            total: 0
          }
        }

        const positiveItems = itemAnswers.filter(a => a[fieldName] === 'positive').length
        const negativeItems = itemAnswers.filter(a => a[fieldName] === 'negative').length
        const neutralItems = itemAnswers.filter(a => a[fieldName] === 'neutral').length

        return {
          label,
          positive: Math.round((positiveItems / total) * 100),
          negative: Math.round((negativeItems / total) * 100),
          neutral: Math.round((neutralItems / total) * 100),
          total
        }
      })

      return {
        items,
        positiveCount,
        negativeCount,
        neutralCount,
        totalResponses: answers.length
      }
    }

    // 各カテゴリの詳細データを取得
    const [qualityData, serviceData, cleanlinessData] = await Promise.all([
      getDetailedData('preset_quality_question_answer', qualityLabels),
      getDetailedData('preset_service_question_answer', serviceLabels),
      getDetailedData('preset_cleanliness_question_answer', cleanlinessLabels)
    ])

    const qscDetailedData = {
      Q: {
        ...qualityData,
        label: 'Quality'
      },
      S: {
        ...serviceData,
        label: 'Service'
      },
      C: {
        ...cleanlinessData,
        label: 'Cleanliness'
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          qscScores,
          qscDetailedData,
          totalResponses: allQscAnswers.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Get store evaluation error:', error)

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
