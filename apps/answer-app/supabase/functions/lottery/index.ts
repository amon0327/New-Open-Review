import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LotteryResult {
  isEligible: boolean;
  isWinner: boolean;
  message: string;
  submissionId?: string;
  winnerId?: string;
  winnerToken?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const requestData = await req.json()
    const { reviewFormId, userId, answersData, storeCode, selectedAspectInfo } = requestData
    
    console.log('=== REQUEST DATA DEBUG ===')
    console.log('Full request data keys:', Object.keys(requestData))
    console.log('selectedAspectInfo from request:', selectedAspectInfo)
    console.log('=== END REQUEST DATA DEBUG ===')

    if (!reviewFormId || !userId || !answersData) {
      throw new Error('Missing required parameters')
    }

    // 0. Get company_id from review form
    const { data: formData, error: formError } = await supabase
      .from('review_forms')
      .select('company_id')
      .eq('id', reviewFormId)
      .single()

    if (formError) throw formError

    const companyId = formData.company_id

    // 1. Get store_id - first try from storeCode, then from store_review_forms
    let storeId = null

    console.log('=== STORE LOOKUP DEBUG ===')
    console.log('storeCode from request:', storeCode)
    console.log('companyId:', companyId)

    if (storeCode) {
      const { data: storeData, error: storeCodeError } = await supabase
        .from('stores')
        .select('id, store_url_code')
        .eq('store_url_code', storeCode)
        .eq('company_id', companyId)
        .single()

      console.log('Store lookup by storeCode result:', storeData)
      console.log('Store lookup by storeCode error:', storeCodeError)

      if (storeData) {
        storeId = storeData.id
        console.log('Found store_id from storeCode:', storeId)
      } else {
        console.log('No store found with store_url_code:', storeCode, 'and company_id:', companyId)
      }
    } else {
      console.log('No storeCode provided in request')
    }
    
    if (!storeId) {
      console.log('Looking for store_id from store_review_forms for reviewFormId:', reviewFormId)
      const { data: storeReviewForms, error: storeError } = await supabase
        .from('store_review_forms')
        .select('store_id')
        .eq('review_form_id', reviewFormId)
        .limit(1)

      if (storeError) {
        console.error('Store lookup error:', storeError)
        // Continue without store_id if lookup fails
        console.log('Continuing without store_id due to error')
      } else if (storeReviewForms && storeReviewForms.length > 0) {
        storeId = storeReviewForms[0].store_id
        console.log('Found store_id:', storeId)
      } else {
        console.log('No store relationship found, continuing without store_id')
      }
    }

    // 2. Check if user has answered within the last N days (店舗単位設定、1〜7、default 5)
    let cooldownDays = 5
    if (storeId) {
      const { data: storeRow } = await supabase
        .from('stores')
        .select('answer_cooldown_days')
        .eq('id', storeId)
        .maybeSingle()
      if (storeRow?.answer_cooldown_days) {
        const n = Number(storeRow.answer_cooldown_days)
        if (Number.isInteger(n) && n >= 1 && n <= 7) {
          cooldownDays = n
        }
      }
    }
    console.log('Applying cooldown days:', cooldownDays)

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - cooldownDays)

    const { data: recentSubmissions, error: recentError } = await supabase
      .from('lottery_log')
      .select('created_at')
      .eq('review_form_id', reviewFormId)
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString())
      .limit(1)

    if (recentError) throw recentError

    if (recentSubmissions && recentSubmissions.length > 0) {
      return new Response(
        JSON.stringify({
          isEligible: false,
          isWinner: false,
          message: '一定期間後に\nアンケートをお願いします'
        } as LotteryResult),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // 3. Ensure user exists in public.users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist in public.users, create them
      console.log('User not found in public.users, creating:', userId)
      
      // Get user info from auth.users
      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(userId)
      
      if (authError) {
        console.error('Failed to get auth user:', authError)
        throw new Error('User authentication error')
      }
      
      // Create user in public.users table
      const { error: createUserError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.email || `${userId}@line.local`,
          name: authUser.user_metadata?.name || authUser.user_metadata?.displayName || 'LINE User'
        })
      
      if (createUserError) {
        console.error('Failed to create user in public.users:', createUserError)
        throw createUserError
      }
      
      console.log('User created successfully in public.users')
    }

    // 4. Save the review form answers
    const submissionRecord: any = {
      review_forms_id: reviewFormId,
      users: userId
    }

    // Only include store_id if it exists
    if (storeId) {
      submissionRecord.store_id = storeId
    }
    
    console.log('Creating submission with record:', submissionRecord)
    const { data: submissionData, error: submissionError } = await supabase
      .from('review_form_submissions')
      .insert([submissionRecord])
      .select()
      .single()

    if (submissionError) throw submissionError

    const submissionId = submissionData.id

    // 4. Process each answer (similar to saveReviewFormAnswers)
    for (const [questionId, answerData] of Object.entries(answersData)) {
      // Skip preset questions (they are handled separately)
      if (questionId.startsWith('required_')) {
        continue
      }
      
      // Create question answer record
      const questionAnswerRecord = {
        review_form_submissions_id: submissionId,
        review_questions_id: questionId
      }
      
      // Only include store_id if it exists
      if (storeId) {
        questionAnswerRecord.store_id = storeId
      }
      
      const { data: questionAnswerData, error: questionAnswerError } = await supabase
        .from('review_question_answers')
        .insert([questionAnswerRecord])
        .select()
        .single()

      if (questionAnswerError) throw questionAnswerError

      const questionAnswerId = questionAnswerData.id
      const questionTypeId = (answerData as any).questionTypeId

      // Save specific answer type based on question type
      switch (questionTypeId) {
        case 1: // Short text
        case 2: // Long text
          if ((answerData as any).answer) {
            const textAnswerRecord = {
              review_questions_answers_id: questionAnswerId,
              answer_text: (answerData as any).answer
            }
            
            // Only include store_id if it exists
            if (storeId) {
              textAnswerRecord.store_id = storeId
            }
            
            const { error: textError } = await supabase
              .from('question_answer_texts')
              .insert([textAnswerRecord])
            if (textError) throw textError
          }
          break

        case 3: // Single choice
        case 8: // Pull down
          if ((answerData as any).answer) {
            // Find the choice ID based on choice number
            const { data: choiceData, error: choiceError } = await supabase
              .from('question_option_choices')
              .select('id')
              .eq('review_questions_id', questionId)
              .eq('choice_number', parseInt((answerData as any).answer))
              .single()

            if (choiceError && choiceError.code !== 'PGRST116') throw choiceError

            if (choiceData) {
              const choiceAnswerRecord = {
                review_question_answers_id: questionAnswerId,
                question_option_choices_id: choiceData.id
              }
              
              // Only include store_id if it exists
              if (storeId) {
                choiceAnswerRecord.store_id = storeId
              }
              
              const { error: choiceAnswerError } = await supabase
                .from('question_answer_option_choices')
                .insert([choiceAnswerRecord])
              if (choiceAnswerError) throw choiceAnswerError
            }
          }
          break

        case 4: // Multiple choice
        case 6: // Multiple choice matrix
          if ((answerData as any).answers && Array.isArray((answerData as any).answers)) {
            for (const choiceNumber of (answerData as any).answers) {
              const { data: choiceData, error: choiceError } = await supabase
                .from('question_option_choices')
                .select('id')
                .eq('review_questions_id', questionId)
                .eq('choice_number', parseInt(choiceNumber))
                .single()

              if (choiceError && choiceError.code !== 'PGRST116') throw choiceError

              if (choiceData) {
                const choiceAnswerRecord = {
                  review_question_answers_id: questionAnswerId,
                  question_option_choices_id: choiceData.id
                }
                
                // Always include store_id (including fallback value)
                choiceAnswerRecord.store_id = storeId
                
                const { error: choiceAnswerError } = await supabase
                  .from('question_answer_option_choices')
                  .insert([choiceAnswerRecord])
                if (choiceAnswerError) throw choiceAnswerError
              }
            }
          }
          break

        case 5: // Single choice matrix
          if ((answerData as any).answer) {
            // Find the choice ID based on choice number
            const { data: choiceData, error: choiceError } = await supabase
              .from('question_option_choices')
              .select('id')
              .eq('review_questions_id', questionId)
              .eq('choice_number', parseInt((answerData as any).answer))
              .single()

            if (choiceError && choiceError.code !== 'PGRST116') throw choiceError

            if (choiceData) {
              const choiceAnswerRecord = {
                review_question_answers_id: questionAnswerId,
                question_option_choices_id: choiceData.id
              }
              
              // Only include store_id if it exists
              if (storeId) {
                choiceAnswerRecord.store_id = storeId
              }
              
              const { error: choiceAnswerError } = await supabase
                .from('question_answer_option_choices')
                .insert([choiceAnswerRecord])
              if (choiceAnswerError) throw choiceAnswerError
            }
          }
          break

        case 7: // Linear scale
        case 9: // NPS Linear scale
          if ((answerData as any).answer) {
            const scaleAnswerRecord = {
              review_question_answers_id: questionAnswerId,
              answer_number: parseInt((answerData as any).answer)
            }
            
            // Only include store_id if it exists
            if (storeId) {
              scaleAnswerRecord.store_id = storeId
            }
            
            const { error: scaleError } = await supabase
              .from('question_answer_option_linear_scale')
              .insert([scaleAnswerRecord])
            if (scaleError) throw scaleError
          }
          break
      }
    }

    // 5. Save preset question answers if they exist
    const presetQuestionIds = ['required_1_1', 'required_1_2', 'required_1_3', 'required_1_4', 'required_1_5', 'required_1_6', 'required_2_1', 'required_2_2', 'required_2_3', 'required_2_4']
    const hasPresetAnswers = Object.keys(answersData).some(key => presetQuestionIds.includes(key))
    
    if (hasPresetAnswers) {
      try {
        // Save to preset_question_answer table
        const presetAnswers: any = {
          review_form_submission_id: submissionId,
          user_id: userId,
          company_id: companyId,
          store_id: storeId
        }

        // Page 1 mappings
        if (answersData['required_1_1']) {
          presetAnswers.p1_q1 = parseInt((answersData as any)['required_1_1'].answer)
        }
        if (answersData['required_1_2']) {
          const revisitMap: any = {
            '1': '1ヶ月以内',
            '2': '3ヶ月以内',
            '3': '6ヶ月以内',
            '4': '10ヶ月以内',
            '5': '1年以内',
            '6': '1年以上'
          }
          presetAnswers.p1_q2 = revisitMap[(answersData as any)['required_1_2'].answer]
        }
        if (answersData['required_1_3']) {
          const visitMap: any = {
            '1': '初めて',
            '2': '2回目',
            '3': '3回目',
            '4': '4回目',
            '5': '5回目',
            '6': '6回目~10回目',
            '7': '11回目以上'
          }
          presetAnswers.p1_q3 = visitMap[(answersData as any)['required_1_3'].answer]
        }
        if (answersData['required_1_4']) {
          const genderMap: any = {
            '1': '男性',
            '2': '女性',
            '3': 'その他'
          }
          presetAnswers.p1_q4 = genderMap[(answersData as any)['required_1_4'].answer]
        }
        if (answersData['required_1_5']) {
          const ageMap: any = {
            '1': '~19歳',
            '2': '20歳~24歳',
            '3': '25歳~29歳',
            '4': '30歳~34歳',
            '5': '35歳~39歳',
            '6': '40歳~44歳',
            '7': '45歳~49歳',
            '8': '50歳~54歳',
            '9': '55歳~59歳',
            '10': '60歳~69歳',
            '11': '70歳~79歳',
            '12': '80歳~'
          }
          presetAnswers.p1_q5 = ageMap[(answersData as any)['required_1_5'].answer]
        }
        if (answersData['required_1_6']) {
          const companionMap: any = {
            '1': 'お一人',
            '2': 'ご家族',
            '3': 'ご友人',
            '4': '恋人・パートナー',
            '5': '職場の同僚',
            '6': 'お取引先・ビジネス関係',
            '7': 'その他'
          }
          presetAnswers.p1_q6 = companionMap[(answersData as any)['required_1_6'].answer]
        }
        // p1_q7 (group size) is no longer collected

        // Page 2 mappings
        if (answersData['required_2_1']) {
          presetAnswers.p2_q1 = parseInt((answersData as any)['required_2_1'].answer)
        }
        if (answersData['required_2_2']) {
          presetAnswers.p2_q2 = parseInt((answersData as any)['required_2_2'].answer)
        }
        if (answersData['required_2_3']) {
          presetAnswers.p2_q3 = parseInt((answersData as any)['required_2_3'].answer)
        }
        if (answersData['required_2_4']) {
          presetAnswers.p2_q4 = (answersData as any)['required_2_4'].answer === '1'
        }

        // Insert into preset_question_answer table
        const { data: presetData, error: presetError } = await supabase
          .from('preset_question_answer')
          .insert([presetAnswers])
          .select()
          .single()

        if (presetError) throw presetError

        const presetAnswerId = presetData.id

        // Save detail answers if selectedAspectInfo exists
        console.log('=== QSC DETAIL DEBUG ===')
        console.log('selectedAspectInfo received:', JSON.stringify(selectedAspectInfo, null, 2))
        console.log('aspectType:', selectedAspectInfo?.aspectType)
        console.log('questionType:', selectedAspectInfo?.questionType)
        
        if (selectedAspectInfo && selectedAspectInfo.aspectType) {
          let tableName = ''
          const aspectType = selectedAspectInfo.aspectType
          console.log('Checking aspectType:', aspectType)
          
          switch (aspectType) {
            case 'quality':
              tableName = 'preset_quality_question_answer'
              break
            case 'service':
              tableName = 'preset_service_question_answer'
              break
            case 'cleanliness':
              tableName = 'preset_cleanliness_question_answer'
              break
            default:
              console.log('Unknown aspectType:', aspectType)
              break
          }
          
          console.log('Selected table name:', tableName)
          console.log('=== END QSC DETAIL DEBUG ===')

          if (tableName) {
            const detailRecord: any = {
              preset_question_answer_id: presetAnswerId,
              user_id: userId,
              company_id: companyId,
              store_id: storeId,
              review_form_submission_id: submissionId,
              is_positive: selectedAspectInfo.questionType === 'positive'
            }

            // Map page 3 sentiment matrix answers
            console.log('=== MATRIX MAPPING DEBUG ===')
            console.log('AspectType:', aspectType)
            console.log('Checking for required_3_1 in answersData:', 'required_3_1' in answersData)
            console.log('required_3_1 value:', answersData['required_3_1'])
            console.log('required_3_1 raw answer:', (answersData as any)['required_3_1'])
            
            if (answersData['required_3_1']) {
              try {
                // Check the structure of the answer
                const rawAnswer = (answersData as any)['required_3_1']
                console.log('Raw answer type:', typeof rawAnswer)
                console.log('Raw answer structure:', JSON.stringify(rawAnswer, null, 2))
                
                let matrixAnswers: any
                
                // Handle different answer formats
                if (typeof rawAnswer === 'string') {
                  // If it's already a string, parse it
                  matrixAnswers = JSON.parse(rawAnswer)
                } else if (rawAnswer && typeof rawAnswer === 'object' && rawAnswer.answer) {
                  // If it's an object with answer property, parse that
                  matrixAnswers = JSON.parse(rawAnswer.answer)
                } else {
                  console.error('Unexpected answer format:', rawAnswer)
                  matrixAnswers = {}
                }
                
                console.log('Matrix answers parsed:', matrixAnswers)
                console.log('Matrix answers type:', typeof matrixAnswers)
                console.log('Matrix answers keys:', Object.keys(matrixAnswers))
                console.log('Matrix answers full content:', JSON.stringify(matrixAnswers, null, 2))
                
                // Test regex pattern on actual keys
                Object.keys(matrixAnswers).forEach(key => {
                  console.log(`Testing key "${key}":`)
                  const match = key.match(/[qsc](\d+)/)
                  if (match) {
                    console.log(`  - Regex match: Yes, captured number: ${match[1]}`)
                  } else {
                    console.log(`  - Regex match: No`)
                  }
                })
                
                // Process each key directly (q1, q2, etc.)
                Object.entries(matrixAnswers).forEach(([key, value]: [string, any]) => {
                  // Extract question number from key (e.g., 'q1', 's1', 'c1' -> 1)
                  const match = key.match(/[qsc](\d+)/)
                  if (match) {
                    const qNum = parseInt(match[1])
                    if (qNum >= 1 && qNum <= 10) {
                      // The value is already a string like 'positive', 'negative', 'neutral'
                      if (typeof value === 'string') {
                        detailRecord[`q${qNum}`] = value
                        console.log(`Mapped ${key} -> q${qNum}: ${value}`)
                      } else {
                        // Fallback for numeric values
                        if (value === 1) {
                          detailRecord[`q${qNum}`] = 'positive'
                        } else if (value === -1) {
                          detailRecord[`q${qNum}`] = 'negative'
                        } else if (value === 0) {
                          detailRecord[`q${qNum}`] = 'neutral'
                        }
                        console.log(`Mapped ${key} -> q${qNum}: ${detailRecord[`q${qNum}`]} (converted from number)`)
                      }
                    } else {
                      console.log(`Warning: Question number ${qNum} is out of range (1-10)`)
                    }
                  } else {
                    console.log(`Warning: Key '${key}' does not match expected pattern /[qsc](\\d+)/`)
                  }
                })
                
                console.log('Final detailRecord q values:')
                for (let i = 1; i <= 10; i++) {
                  console.log(`  q${i}: ${detailRecord[`q${i}`] || 'undefined'}`)
                }
              } catch (e) {
                console.error('Error parsing matrix answers:', e)
                console.error('Error details:', e.message)
              }
            } else {
              console.log('No required_3_1 answer found in answersData')
            }

            // Save page 4 text answers to preset_question_answer_comment table
            const page4Questions = ['required_4_1', 'required_4_2', 'required_4_3', 'required_4_4', 'required_4_5']
            const commentInserts: any[] = []
            
            page4Questions.forEach((questionId) => {
              if (answersData[questionId] && (answersData as any)[questionId].answer) {
                // Extract question number from ID (e.g., 'required_4_1' -> 1)
                const questionNumber = parseInt(questionId.split('_').pop() || '0')
                
                // Skip question 5 for cleanliness (it only has 4 questions)
                if (aspectType === 'cleanliness' && questionNumber === 5) {
                  return
                }
                
                commentInserts.push({
                  preset_question_answer_id: presetAnswerId,
                  comment: (answersData as any)[questionId].answer,
                  selected_qsc: aspectType, // 'quality', 'service', or 'cleanliness'
                  question_number: questionNumber,
                  is_positive: selectedAspectInfo.questionType === 'positive'
                })
              }
            })
            
            // Insert comments into the new table if any exist
            if (commentInserts.length > 0) {
              const { error: commentError } = await supabase
                .from('preset_question_answer_comment')
                .insert(commentInserts)
                
              if (commentError) {
                console.error('Error saving preset comments:', commentError)
                throw commentError
              }
              
              console.log('Successfully saved page 4 comments to preset_question_answer_comment table')
            }

            console.log('=== FINAL DETAIL RECORD ===')
            console.log('Table name:', tableName)
            console.log('Detail record keys:', Object.keys(detailRecord))
            console.log('Detail record to insert:', JSON.stringify(detailRecord, null, 2))
            // Log individual q values
            for (let i = 1; i <= 10; i++) {
              console.log(`q${i}:`, detailRecord[`q${i}`] || 'null')
            }
            
            const { error: detailError } = await supabase
              .from(tableName)
              .insert([detailRecord])

            if (detailError) {
              console.error('Error inserting detail record:', detailError)
              throw detailError
            }
            
            console.log('Successfully saved detail answers to', tableName)
          }
        }

        // Save user features
        try {
          console.log('=== USER FEATURES DEBUG START ===')
          console.log('submissionId:', submissionId)
          console.log('userId:', userId)
          console.log('companyId:', companyId)
          console.log('storeId:', storeId)
          
          // Determine result_type
          let resultType = null
          const npsScore = parseInt((answersData as any)['required_1_1']?.answer || 0)
          // 再来店意向あり = 1ヶ月以内(1) または 3ヶ月以内(2)
          const revisitAnswer = (answersData as any)['required_1_2']?.answer
          const willRevisit = revisitAnswer === '1' || revisitAnswer === '2'
          const visitFrequency = (answersData as any)['required_1_3']?.answer
          const isFirstVisit = visitFrequency === '1'
          
          console.log('NPS Score:', npsScore)
          console.log('Will Revisit:', willRevisit)
          console.log('Visit Frequency:', visitFrequency)
          console.log('Is First Visit:', isFirstVisit)

          let npsCategory
          if (npsScore >= 9) {
            npsCategory = '推奨'
          } else if (npsScore >= 7) {
            npsCategory = '中立'
          } else {
            npsCategory = '批判'
          }

          // Determine result_type based on the table
          if (npsCategory === '推奨' && willRevisit && !isFirstVisit) {
            resultType = 1
          } else if (npsCategory === '推奨' && willRevisit && isFirstVisit) {
            resultType = 2
          } else if (npsCategory === '中立' && willRevisit && isFirstVisit) {
            resultType = 3
          } else if (npsCategory === '中立' && !willRevisit && !isFirstVisit) {
            resultType = 4
          } else if (npsCategory === '中立' && !willRevisit && isFirstVisit) {
            resultType = 5
          } else if (npsCategory === '批判' && willRevisit && isFirstVisit) {
            resultType = 6
          } else if (npsCategory === '批判' && !willRevisit && !isFirstVisit) {
            resultType = 7
          } else if (npsCategory === '批判' && !willRevisit && isFirstVisit) {
            resultType = 8
          } else if (npsCategory === '推奨' && !willRevisit && !isFirstVisit) {
            resultType = 9
          } else if (npsCategory === '推奨' && !willRevisit && isFirstVisit) {
            resultType = 10
          } else if (npsCategory === '中立' && willRevisit && !isFirstVisit) {
            resultType = 11
          } else if (npsCategory === '批判' && willRevisit && !isFirstVisit) {
            resultType = 12
          }

          // Determine selected_qsc (use English enum values)
          let selectedQsc = null
          if (selectedAspectInfo?.aspectType === 'quality') {
            selectedQsc = 'quality'
          } else if (selectedAspectInfo?.aspectType === 'service') {
            selectedQsc = 'service'
          } else if (selectedAspectInfo?.aspectType === 'cleanliness') {
            selectedQsc = 'cleanliness'
          }
          
          console.log('selectedAspectInfo:', selectedAspectInfo)
          console.log('selectedQsc:', selectedQsc)

          // Determine top preferences from tournament
          let topPreference = null
          let secondPreference = null

          if (answersData['required_5_1']) {
            try {
              const tournamentData = JSON.parse((answersData as any)['required_5_1'].answer)
              if (tournamentData.matches && tournamentData.matches.length >= 6) {
                const winCounts: any = {}
                tournamentData.matches.forEach((match: any) => {
                  winCounts[match.winner] = (winCounts[match.winner] || 0) + 1
                })

                const sorted = Object.entries(winCounts).sort((a: any, b: any) => b[1] - a[1])

                const preferenceMap: any = {
                  'taste': '品質',
                  'service': '接客',
                  'space': '空間',
                  'hygiene': '衛生',
                  'price': '価格感度'
                }

                if (sorted[0]) {
                  topPreference = preferenceMap[sorted[0][0]]
                }
                if (sorted[1]) {
                  secondPreference = preferenceMap[sorted[1][0]]
                }
              }
            } catch (e) {
              console.error('Error parsing tournament data:', e)
            }
          }

          // Build features record with null checks
          const featuresRecord: any = {
            review_form_submission_id: submissionId,
            user_id: userId,
            company_id: companyId,
            result_type: resultType
          }
          
          // Only add store_id if it's not the fallback value
          if (storeId && storeId !== '00000000-0000-0000-0000-000000000001') {
            featuresRecord.store_id = storeId
          }
          
          // Only add enum fields if they have valid values
          if (selectedQsc) {
            featuresRecord.selected_qsc = selectedQsc
          }
          if (topPreference) {
            featuresRecord.top_preference = topPreference
          }
          if (secondPreference) {
            featuresRecord.second_preference = secondPreference
          }

          console.log('Features record to insert:', JSON.stringify(featuresRecord, null, 2))
          console.log('Result Type:', resultType)
          console.log('Selected QSC:', selectedQsc)
          console.log('Top Preference:', topPreference)
          console.log('Second Preference:', secondPreference)
          
          const { data: featuresData, error: featuresError } = await supabase
            .from('preset_answer_user_features')
            .insert([featuresRecord])
            .select()

          if (featuresError) {
            console.error('=== USER FEATURES INSERT ERROR ===')
            console.error('Error details:', JSON.stringify(featuresError, null, 2))
            console.error('Error message:', featuresError.message)
            console.error('Error code:', featuresError.code)
            throw featuresError
          }
          
          console.log('Successfully saved user features, ID:', featuresData?.[0]?.id)
          console.log('=== USER FEATURES DEBUG END ===')
        } catch (featuresError: any) {
          console.error('=== USER FEATURES CATCH BLOCK ===')
          console.error('Error saving user features:', featuresError)
          console.error('Error type:', typeof featuresError)
          console.error('Error name:', featuresError?.name)
          console.error('Error message:', featuresError?.message)
          console.error('Error code:', featuresError?.code)
          console.error('Full error object:', JSON.stringify(featuresError, null, 2))
          // Continue even if this fails
        }
      } catch (presetError) {
        console.error('Error saving preset answers:', presetError)
        // Continue even if preset save fails
      }
    }

    // Get lottery settings
    const { data: lotteryData, error: lotteryError } = await supabase
      .from('lottery')
      .select('*')
      .eq('review_form_id', reviewFormId)
      .single()

    if (lotteryError) throw lotteryError

    // Check current month's wins and perform lottery
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    const monthStart = new Date(currentYear, currentMonth - 1, 1)
    const monthEnd = new Date(currentYear, currentMonth, 0)

    // Check current month's wins for this lottery - COUNT FROM lottery_winners, NOT lottery_log
    const { count: currentWins, error: winsError } = await supabase
      .from('lottery_winners')
      .select('lottery_log!inner(review_form_id)', { count: 'exact', head: true })
      .eq('lottery_log.review_form_id', reviewFormId)
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString())

    if (winsError) throw winsError

    let isWinner = false
    let message = 'ハズレ...'

    // Debug logging
    console.log('=== LOTTERY DEBUG ===')
    console.log('Review Form ID:', reviewFormId)
    console.log('Current Date:', currentDate.toISOString())
    console.log('Month Start:', monthStart.toISOString())
    console.log('Month End:', monthEnd.toISOString())
    console.log('Lottery Data:', lotteryData)
    console.log('Current wins this month:', currentWins)
    console.log('Max wins per month:', lotteryData.max_wins_per_month)
    console.log('Win rate divisor:', lotteryData.win_rate_divisor)

    // Check if max wins reached
    if (currentWins >= lotteryData.max_wins_per_month) {
      console.log('Max wins reached - automatic loss')
      isWinner = false
      message = 'ハズレ...'
    } else {
      // Perform lottery based on win_rate_divisor
      const randomValue = Math.random()
      const randomNumber = Math.floor(randomValue * lotteryData.win_rate_divisor) + 1
      
      console.log('Random value:', randomValue)
      console.log('Random number (1 to divisor):', randomNumber)
      console.log('Win condition: randomNumber === 1')
      
      isWinner = randomNumber === 1 // Win if random number is 1

      console.log('Is winner:', isWinner)

      if (isWinner) {
        message = 'おめでとうございます！'
        
        // Update current_wins in lottery table
        const { error: updateError } = await supabase
          .from('lottery')
          .update({ current_wins: (lotteryData.current_wins || 0) + 1 })
          .eq('id', lotteryData.id)

        if (updateError) throw updateError
        
        console.log('Winner recorded successfully')
      }
    }

    console.log('Final result - isWinner:', isWinner, 'message:', message)
    console.log('=== END LOTTERY DEBUG ===')

    // Update current_trials
    const { error: trialsError } = await supabase
      .from('lottery')
      .update({ current_trials: (lotteryData.current_trials || 0) + 1 })
      .eq('id', lotteryData.id)

    if (trialsError) throw trialsError

    // Log the lottery attempt
    const { data: logData, error: logError } = await supabase
      .from('lottery_log')
      .insert([{
        review_form_id: reviewFormId,
        user_id: userId
      }])
      .select()
      .single()

    if (logError) throw logError

    // If winner, create lottery_winners record
    let winnerId = null
    let winnerToken = null
    if (isWinner) {
      // Generate a secure winner token
      winnerToken = crypto.randomUUID()
      
      const { data: winnerData, error: winnerError } = await supabase
        .from('lottery_winners')
        .insert([{
          log_id: logData.id,
          is_received: false,
          winner_token: winnerToken
        }])
        .select()
        .single()

      if (winnerError) throw winnerError
      winnerId = winnerData.id
    }

    return new Response(
      JSON.stringify({
        isEligible: true,
        isWinner,
        message,
        submissionId,
        winnerId,
        winnerToken
      } as LotteryResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Lottery function error:', error)
    return new Response(
      JSON.stringify({ 
        isEligible: false,
        isWinner: false,
        message: 'エラーが発生しました',
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})