import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LotteryRequest {
  reviewFormId: string
  userId: string
  answersData: Record<string, any>
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

    const { reviewFormId, userId, answersData }: LotteryRequest = await req.json()

    if (!reviewFormId || !userId) {
      throw new Error('reviewFormId and userId are required')
    }

    // 1. レビューフォームからcompany_idを取得
    const { data: reviewForm, error: formError } = await supabaseAdmin
      .from('review_forms')
      .select('id, company_id')
      .eq('id', reviewFormId)
      .single()

    if (formError || !reviewForm) {
      throw new Error('Review form not found')
    }

    const companyId = reviewForm.company_id

    // 2. 企業の抽選設定を取得
    const { data: lotterySettings, error: settingsError } = await supabaseAdmin
      .from('company_lottery_settings')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle()

    // 抽選設定がない場合はデフォルト値を使用
    const winRateDivisor = lotterySettings?.win_rate_divisor ?? 1000
    const maxWinsPerMonth = lotterySettings?.max_wins_per_month ?? 1
    const isEnabled = lotterySettings?.is_enabled ?? true

    // 3. store_idを取得
    const { data: storeReviewForm, error: storeError } = await supabaseAdmin
      .from('store_review_forms')
      .select('store_id')
      .eq('review_form_id', reviewFormId)
      .maybeSingle()

    // store_idがない場合はフォールバック
    const storeId = storeReviewForm?.store_id ?? '00000000-0000-0000-0000-000000000001'

    // 4. 回答を保存（review_form_submissions）
    const { data: submissionData, error: submissionError } = await supabaseAdmin
      .from('review_form_submissions')
      .insert([{
        review_forms_id: reviewFormId,
        users: userId,
        store_id: storeId
      }])
      .select()
      .single()

    if (submissionError) {
      throw new Error(`Failed to create submission: ${submissionError.message}`)
    }

    const submissionId = submissionData.id

    // 5. 各質問の回答を保存
    for (const [questionId, answerData] of Object.entries(answersData)) {
      const { data: questionAnswerData, error: questionAnswerError } = await supabaseAdmin
        .from('review_question_answers')
        .insert([{
          review_form_submissions_id: submissionId,
          review_questions_id: questionId,
          store_id: storeId
        }])
        .select()
        .single()

      if (questionAnswerError) {
        console.error('Question answer error:', questionAnswerError)
        continue
      }

      const questionAnswerId = questionAnswerData.id
      const questionTypeId = (answerData as any).questionTypeId

      // 回答タイプに応じて保存
      switch (questionTypeId) {
        case 1: // Short text
        case 2: // Long text
          if ((answerData as any).answer) {
            await supabaseAdmin
              .from('question_answer_texts')
              .insert([{
                review_questions_answers_id: questionAnswerId,
                answer_text: (answerData as any).answer,
                store_id: storeId
              }])
          }
          break

        case 3: // Single choice
        case 8: // Pull down
          if ((answerData as any).answer) {
            const { data: choiceData } = await supabaseAdmin
              .from('question_option_choices')
              .select('id')
              .eq('review_questions_id', questionId)
              .eq('choice_number', parseInt((answerData as any).answer))
              .single()

            if (choiceData) {
              await supabaseAdmin
                .from('question_answer_option_choices')
                .insert([{
                  review_question_answers_id: questionAnswerId,
                  question_option_choices_id: choiceData.id,
                  store_id: storeId
                }])
            }
          }
          break

        case 4: // Multiple choice
        case 5: // Single choice matrix
        case 6: // Multiple choice matrix
          if ((answerData as any).answers && Array.isArray((answerData as any).answers)) {
            for (const choiceNumber of (answerData as any).answers) {
              const { data: choiceData } = await supabaseAdmin
                .from('question_option_choices')
                .select('id')
                .eq('review_questions_id', questionId)
                .eq('choice_number', parseInt(choiceNumber))
                .single()

              if (choiceData) {
                await supabaseAdmin
                  .from('question_answer_option_choices')
                  .insert([{
                    review_question_answers_id: questionAnswerId,
                    question_option_choices_id: choiceData.id,
                    store_id: storeId
                  }])
              }
            }
          }
          break

        case 7: // Linear scale
          if ((answerData as any).answer) {
            await supabaseAdmin
              .from('question_answer_option_linear_scale')
              .insert([{
                review_question_answers_id: questionAnswerId,
                answer_number: parseInt((answerData as any).answer),
                store_id: storeId
              }])
          }
          break
      }
    }

    // 6. 抽選が無効の場合はここで終了（ログは記録しない）
    if (!isEnabled) {
      return new Response(
        JSON.stringify({
          success: true,
          submissionId,
          isWinner: false,
          isEligible: true, // 回答は有効（抽選が無効なだけ）
          winnerId: null,
          message: 'Lottery is disabled'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // 7. 今月の当選数を集計（ログテーブルから取得）
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const monthStart = new Date(currentYear, currentMonth - 1, 1).toISOString()
    const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999).toISOString()

    const { count: currentMonthWins } = await supabaseAdmin
      .from('company_lottery_logs')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_winner', true)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    const totalWinsThisMonth = currentMonthWins ?? 0

    // 8. 当選判定
    let isWinner = false
    let winnerToken: string | null = null

    // 月間上限を超えていなければ抽選実行
    if (totalWinsThisMonth < maxWinsPerMonth) {
      // 1/N の確率で当選
      const randomValue = Math.floor(Math.random() * winRateDivisor)
      isWinner = randomValue === 0

      if (isWinner) {
        // ユニークなトークンを生成
        winnerToken = crypto.randomUUID()
      }
    }

    // 9. 抽選ログを記録
    const { error: logError } = await supabaseAdmin
      .from('company_lottery_logs')
      .insert([{
        company_id: companyId,
        review_form_id: reviewFormId,
        submission_id: submissionId,
        user_id: userId,
        is_winner: isWinner,
        win_rate_divisor: winRateDivisor,
        max_wins_per_month: maxWinsPerMonth,
        winner_token: winnerToken
      }])

    if (logError) {
      console.error('Failed to insert lottery log:', logError)
    }

    // 10. 当選の場合はlottery_winnersにも記録（後方互換性）
    if (isWinner && winnerToken) {
      try {
        await supabaseAdmin
          .from('lottery_winners')
          .insert([{
            company_id: companyId,
            review_form_id: reviewFormId,
            submission_id: submissionId,
            user_id: userId,
            token: winnerToken,
            won_at: new Date().toISOString(),
            is_claimed: false
          }])
      } catch (e) {
        console.log('lottery_winners table may not exist:', e)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        isWinner,
        isEligible: true, // 回答は有効
        winnerId: winnerToken, // 回答アプリはwinnerIdを期待
        winnerToken, // 後方互換性のため
        message: isWinner ? 'Congratulations! You won!' : 'Better luck next time'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Lottery error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
