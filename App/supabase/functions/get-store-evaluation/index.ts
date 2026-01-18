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
        score: Math.round(avgScore * 100) / 100, // 小数点2桁
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

    // Quality（料理・ドリンク）詳細項目のラベル
    const qualityLabels = [
      '料理の味',
      '料理の見た目',
      '料理の量/ボリューム',
      'ドリンクの味',
      'ドリンクの温度',
      '食べたい料理があったか',
      '飲みたいドリンクがあったか',
      'メニューの種類',
      '料理・ドリンクの温度',
      '特徴や独自性'
    ]

    // Service（接客・対応）詳細項目のラベル
    const serviceLabels = [
      '入店時の挨拶',
      '席への案内',
      '注文時の対応',
      'メニュー説明・提案',
      '提供スピード',
      '注文・提供の正確さ',
      'スタッフの気配り',
      'スタッフの笑顔・感じの良さ',
      'スタッフの言葉遣い',
      '特に良かったスタッフ'
    ]

    // Cleanliness（清潔さ・衛生）詳細項目のラベル
    const cleanlinessLabels = [
      '店舗外観・入口',
      'テーブル',
      '椅子・ソファ',
      '床',
      '食器・カトラリー',
      'メニュー表・卓上備品',
      'トイレ',
      '店内の空気や匂い',
      '店内の整理整頓',
      'スタッフの身だしなみ'
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
