// コメント数の問題をデバッグするスクリプト
import { supabase } from './src/lib/supabase.js'

async function debugCommentCount() {
  console.log('🔍 ==================== コメント数デバッグ開始 ====================')
  
  try {
    // Step 1: question_display_settings の登録状況を確認
    console.log('\n📋 Step 1: question_display_settings の状況確認')
    const { data: displaySettings, error: displayError } = await supabase
      .from('question_display_settings')
      .select('review_question_id, display_name')
    
    if (displayError) {
      console.error('❌ question_display_settings 取得エラー:', displayError.message)
      return
    }
    
    console.log(`📋 question_display_settings 登録数: ${displaySettings?.length || 0} 件`)
    console.log('📋 登録質問:', displaySettings?.map(s => ({
      id: s.review_question_id,
      name: s.display_name
    })))
    
    const questionIds = displaySettings?.map(s => s.review_question_id).filter(id => id !== null) || []
    
    // Step 2: 登録質問の詳細を確認
    console.log('\n📋 Step 2: 登録質問の詳細確認')
    
    // まずテーブル構造を確認
    const { data: sampleQuestion } = await supabase
      .from('review_questions')
      .select('*')
      .limit(1)
    
    if (!sampleQuestion || sampleQuestion.length === 0) {
      console.error('❌ review_questions テーブルにアクセスできません')
      return
    }
    
    const fields = Object.keys(sampleQuestion[0])
    console.log('📋 review_questions フィールド:', fields)
    
    const possibleTypeFields = ['question_types_id', 'question_type', 'type_id', 'question_type_id']
    const typeField = possibleTypeFields.find(field => fields.includes(field))
    
    if (!typeField) {
      console.error('❌ 質問タイプフィールドが見つかりません')
      return
    }
    
    console.log(`📋 使用する質問タイプフィールド: ${typeField}`)
    
    // 登録質問の詳細を取得
    const { data: questions, error: questionsError } = await supabase
      .from('review_questions')
      .select(`id, ${typeField}, question_text`)
      .in('id', questionIds)
    
    if (questionsError) {
      console.error('❌ review_questions 取得エラー:', questionsError.message)
      return
    }
    
    console.log(`📋 登録質問詳細 (${questions?.length || 0} 件):`)
    questions?.forEach(q => {
      console.log(`  - ID: ${q.id}, タイプ: ${q[typeField]}, 質問: "${q.question_text?.substring(0, 50)}..."`)
    })
    
    // Step 3: 質問タイプ別に分類
    console.log('\n📋 Step 3: 質問タイプ別分類')
    
    const questionsByType = {}
    questions?.forEach(q => {
      const type = q[typeField]
      if (!questionsByType[type]) {
        questionsByType[type] = []
      }
      questionsByType[type].push(q)
    })
    
    console.log('📋 質問タイプ別集計:')
    Object.entries(questionsByType).forEach(([type, questionList]) => {
      console.log(`  - タイプ ${type}: ${questionList.length} 件`)
    })
    
    // Step 4: コメント対象質問（タイプ3,4,5,6）を特定
    console.log('\n📋 Step 4: コメント対象質問（タイプ3,4,5,6）確認')
    
    const commentQuestions = questions?.filter(q => [3, 4, 5, 6].includes(q[typeField])) || []
    console.log(`📋 コメント対象質問: ${commentQuestions.length} 件`)
    commentQuestions.forEach(q => {
      console.log(`  - ID: ${q.id}, タイプ: ${q[typeField]}, 質問: "${q.question_text?.substring(0, 50)}..."`)
    })
    
    const commentQuestionIds = commentQuestions.map(q => q.id)
    
    // Step 5: 今日の日付でのコメント回答数を確認
    console.log('\n📋 Step 5: 今日のコメント回答数確認')
    
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
    
    console.log('📅 対象日時範囲:')
    console.log(`  - 開始: ${todayStart.toISOString()}`)
    console.log(`  - 終了: ${todayEnd.toISOString()}`)
    
    if (commentQuestionIds.length > 0) {
      const { data: todayAnswers, error: answersError } = await supabase
        .from('review_question_answers')
        .select('id, created_at, review_questions_id, store_id')
        .in('review_questions_id', commentQuestionIds)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
      
      if (answersError) {
        console.error('❌ 今日の回答取得エラー:', answersError.message)
      } else {
        console.log(`📋 今日のコメント回答数: ${todayAnswers?.length || 0} 件`)
        
        // 店舗別に集計
        const answersByStore = {}
        todayAnswers?.forEach(answer => {
          const storeId = answer.store_id
          if (!answersByStore[storeId]) {
            answersByStore[storeId] = []
          }
          answersByStore[storeId].push(answer)
        })
        
        console.log('📋 店舗別回答数:')
        Object.entries(answersByStore).forEach(([storeId, answers]) => {
          console.log(`  - 店舗 ${storeId}: ${answers.length} 件`)
        })
        
        // 質問別に集計
        const answersByQuestion = {}
        todayAnswers?.forEach(answer => {
          const questionId = answer.review_questions_id
          if (!answersByQuestion[questionId]) {
            answersByQuestion[questionId] = []
          }
          answersByQuestion[questionId].push(answer)
        })
        
        console.log('📋 質問別回答数:')
        Object.entries(answersByQuestion).forEach(([questionId, answers]) => {
          const question = commentQuestions.find(q => q.id === questionId)
          const questionText = question?.question_text?.substring(0, 30) || 'Unknown'
          console.log(`  - 質問 ${questionId} (${questionText}...): ${answers.length} 件`)
        })
      }
    } else {
      console.log('⚠️ コメント対象質問が見つかりません')
    }
    
    // Step 6: 実際のコメントテキストがあるかを確認
    console.log('\n📋 Step 6: 実際のコメントテキスト確認')
    
    if (commentQuestionIds.length > 0) {
      // question_answer_texts テーブルをチェック
      const { data: textAnswers, error: textError } = await supabase
        .from('question_answer_texts')
        .select(`
          answer_text,
          created_at,
          review_question_answers!inner (
            review_questions_id,
            store_id
          )
        `)
        .in('review_question_answers.review_questions_id', commentQuestionIds)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
        .not('answer_text', 'is', null)
        .not('answer_text', 'eq', '')
      
      if (!textError && textAnswers) {
        console.log(`📋 question_answer_texts から実際のコメント: ${textAnswers.length} 件`)
        textAnswers.slice(0, 5).forEach((text, index) => {
          console.log(`  ${index + 1}. "${text.answer_text?.substring(0, 50)}..."`)
        })
      } else {
        console.log('📋 question_answer_texts からのコメント取得失敗:', textError?.message)
      }
      
      // review_question_answers テーブルからも確認（フォールバック）
      const { data: sampleAnswerData } = await supabase
        .from('review_question_answers')
        .select('*')
        .limit(1)
      
      if (sampleAnswerData && sampleAnswerData.length > 0) {
        const answerFields = Object.keys(sampleAnswerData[0])
        const possibleTextFields = ['answer_text', 'answer', 'text', 'response_text']
        const textField = possibleTextFields.find(field => answerFields.includes(field))
        
        if (textField) {
          console.log(`📋 review_question_answers の ${textField} フィールドも確認...`)
          
          const { data: directAnswers, error: directError } = await supabase
            .from('review_question_answers')
            .select(`id, ${textField}, review_questions_id, store_id, created_at`)
            .in('review_questions_id', commentQuestionIds)
            .gte('created_at', todayStart.toISOString())
            .lte('created_at', todayEnd.toISOString())
            .not(textField, 'is', null)
            .not(textField, 'eq', '')
          
          if (!directError && directAnswers) {
            console.log(`📋 review_question_answers から実際のコメント: ${directAnswers.length} 件`)
            directAnswers.slice(0, 5).forEach((answer, index) => {
              console.log(`  ${index + 1}. "${answer[textField]?.substring(0, 50)}..."`)
            })
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ デバッグ中にエラー:', error)
  }
  
  console.log('\n🔍 ==================== コメント数デバッグ完了 ====================')
}

// 実行
debugCommentCount()