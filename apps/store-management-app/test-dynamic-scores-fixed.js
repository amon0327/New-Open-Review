// Test script to verify the dynamic score implementation with store_id fix
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

// Simulate the fixed implementation
const testDynamicScoreRetrieval = async () => {
  console.log('🚀 Testing dynamic score retrieval with store_id fix...')
  
  try {
    // Test 1: Check question_display_settings exists
    const { data: settingsData, error: settingsError } = await supabase
      .from('question_display_settings')
      .select('*')
      .limit(5)
    
    if (settingsError) {
      console.error('❌ Error fetching question_display_settings:', settingsError)
      return
    }
    
    console.log('✅ question_display_settings found:', settingsData?.length || 0, 'records')
    
    // Test 2: Check if question_display_rule_settings exists
    let ruleSettingsExists = false
    try {
      const { data: ruleData, error: ruleError } = await supabase
        .from('question_display_rule_settings')
        .select('*')
        .limit(1)
      
      if (!ruleError) {
        ruleSettingsExists = true
        console.log('✅ question_display_rule_settings table exists')
      }
    } catch (error) {
      console.log('⚠️ question_display_rule_settings table does not exist, using fallback')
    }
    
    // Test 3: Check stores table structure
    const { data: storesData, error: storesError } = await supabase
      .from('stores')
      .select('id, store_id, name')
      .limit(5)
    
    if (storesError) {
      console.error('❌ Error fetching stores:', storesError)
    } else {
      console.log('📊 Stores data sample:', storesData)
      console.log('🔍 Store ID structure:', storesData?.[0] || 'No stores found')
    }
    
    // Test 4: Check recent answer data exists
    const { data: answerData, error: answerError } = await supabase
      .from('question_answer_option_choices')
      .select(`
        created_at,
        review_question_answers!inner (
          store_id,
          review_questions_id
        )
      `)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10)
    
    if (answerError) {
      console.error('❌ Error fetching answer data:', answerError)
    } else {
      console.log('📋 Recent answer data:', answerData?.length || 0, 'records')
      if (answerData?.length > 0) {
        const storeIds = [...new Set(answerData.map(a => a.review_question_answers.store_id))]
        console.log('🏪 Store IDs in answers:', storeIds)
      }
    }
    
    console.log('✅ Dynamic score test completed')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testDynamicScoreRetrieval()