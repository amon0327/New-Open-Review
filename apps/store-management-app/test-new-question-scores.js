/**
 * 新しいquestion_display_rule_settings テーブルを使用したスコア計算のテストファイル
 */

import { createClient } from '@supabase/supabase-js'
import { 
  calculateChoiceBasedNPSWithRules, 
  buildChoiceSegmentMap, 
  NPS_SEGMENT_ENUM 
} from './src/utils/npsCalculations.js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * question_display_rule_settings の設定をテスト
 */
async function testQuestionDisplayRuleSettings() {
  console.log('=== question_display_rule_settings テーブルの設定テスト ===')
  
  try {
    // 1. question_display_settings から rule_settings を含むデータを取得
    const { data: questionSettings, error } = await supabase
      .from('question_display_settings')
      .select(`
        id,
        display_name,
        review_question_id,
        review_questions!inner (
          id,
          question_text,
          question_types_id,
          question_number
        ),
        question_display_rule_settings!question_display_rule_setting_question_display_settings_id_fkey (
          id,
          question_option_choices_id,
          nps_segments,
          question_option_choices (
            id,
            choice_name,
            choice_number
          )
        )
      `)
      .not('question_display_rule_settings', 'is', null)
      .limit(5)

    if (error) {
      console.error('データ取得エラー:', error)
      return
    }

    console.log(`見つかった設定済み質問: ${questionSettings?.length || 0}件`)
    
    if (!questionSettings || questionSettings.length === 0) {
      console.log('⚠️  question_display_rule_settings が設定された質問が見つかりません')
      console.log('📋 テーブル作成後、以下のようなデータを挿入してください:')
      console.log(`
-- 1. question_display_settings にスコア質問を追加（例）
INSERT INTO question_display_settings (display_name, review_question_id)
VALUES ('雰囲気スコア', 'your-question-id');

-- 2. question_display_rule_settings で選択肢をセグメント分け（例）
INSERT INTO question_display_rule_settings 
(question_display_settings_id, question_option_choices_id, nps_segments)
VALUES 
  ('display-settings-id', 'choice-1-id', 'DETRACTOR'),
  ('display-settings-id', 'choice-2-id', 'DETRACTOR'),
  ('display-settings-id', 'choice-3-id', 'PASSIVE'),
  ('display-settings-id', 'choice-4-id', 'PASSIVE'),
  ('display-settings-id', 'choice-5-id', 'PROMOTER');
      `)
      return
    }

    // 2. 各質問設定の詳細を表示
    questionSettings.forEach((setting, index) => {
      console.log(`\n--- 質問 ${index + 1}: ${setting.display_name} ---`)
      console.log(`質問ID: ${setting.review_question_id}`)
      console.log(`質問タイプ: ${setting.review_questions.question_types_id}`)
      console.log(`質問文: ${setting.review_questions.question_text}`)
      
      if (setting.question_display_rule_settings) {
        console.log('セグメント設定:')
        setting.question_display_rule_settings.forEach(rule => {
          if (rule.question_option_choices) {
            console.log(`  選択肢 ${rule.question_option_choices.choice_number}: "${rule.question_option_choices.choice_name}" → ${rule.nps_segments}`)
          }
        })
        
        // 3. セグメントマップを構築してテスト
        const choiceSegmentMap = buildChoiceSegmentMap(setting.question_display_rule_settings)
        console.log('構築されたセグメントマップ:', choiceSegmentMap)
        
        // 4. サンプル回答でNPS計算をテスト
        const sampleAnswers = setting.question_display_rule_settings.map((rule, i) => ({
          question_option_choices_id: rule.question_option_choices_id,
          question_option_choices: rule.question_option_choices
        }))
        
        const npsResult = calculateChoiceBasedNPSWithRules(sampleAnswers, choiceSegmentMap)
        console.log('サンプルNPS計算結果:', npsResult)
      }
    })

  } catch (error) {
    console.error('テスト実行エラー:', error)
  }
}

/**
 * 実際の回答データでのスコア計算テスト
 */
async function testActualAnswerData() {
  console.log('\n=== 実際の回答データでのスコア計算テスト ===')
  
  try {
    // 今日の日付で回答データを取得
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000)

    // question_display_rule_settings が設定された質問の回答を取得
    const { data: questionSettings } = await supabase
      .from('question_display_settings')
      .select(`
        id,
        display_name,
        review_question_id,
        question_display_rule_settings!question_display_rule_setting_question_display_settings_id_fkey (
          question_option_choices_id,
          nps_segments
        )
      `)
      .not('question_display_rule_settings', 'is', null)
      .limit(1)

    if (!questionSettings || questionSettings.length === 0) {
      console.log('設定済み質問が見つかりません')
      return
    }

    const setting = questionSettings[0]
    console.log(`質問: ${setting.display_name}`)

    // 選択肢回答データを取得
    const { data: choiceAnswers, error } = await supabase
      .from('question_answer_option_choices')
      .select(`
        question_option_choices_id,
        created_at,
        question_option_choices!inner (
          id,
          choice_number,
          choice_name
        ),
        review_question_answers!inner (
          review_questions_id,
          store_id
        )
      `)
      .eq('review_question_answers.review_questions_id', setting.review_question_id)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
      .limit(10)

    if (error) {
      console.error('回答データ取得エラー:', error)
      return
    }

    console.log(`今日の回答数: ${choiceAnswers?.length || 0}件`)
    
    if (choiceAnswers && choiceAnswers.length > 0) {
      // セグメントマップを構築
      const choiceSegmentMap = buildChoiceSegmentMap(setting.question_display_rule_settings)
      
      // NPSスコアを計算
      const npsResult = calculateChoiceBasedNPSWithRules(choiceAnswers, choiceSegmentMap)
      
      console.log('実データでのNPS計算結果:')
      console.log(`  NPSスコア: ${npsResult.npsScore}`)
      console.log(`  総回答数: ${npsResult.total}`)
      console.log(`  推奨者: ${npsResult.promoters}件 (${npsResult.promoterPercentage}%)`)
      console.log(`  中立者: ${npsResult.passives}件`)
      console.log(`  批判者: ${npsResult.detractors}件 (${npsResult.detractorPercentage}%)`)
    } else {
      console.log('今日の回答データがありません')
    }

  } catch (error) {
    console.error('実データテストエラー:', error)
  }
}

/**
 * テスト実行
 */
async function runTests() {
  console.log('🚀 question_display_rule_settings テーブル対応の動作テスト開始\n')
  
  await testQuestionDisplayRuleSettings()
  await testActualAnswerData()
  
  console.log('\n✅ テスト完了')
  console.log('\n📝 次のステップ:')
  console.log('1. question_display_rule_settings テーブルにデータを挿入')
  console.log('2. question_display_settings で表示名（例: "雰囲気スコア", "入店スコア"）を設定')
  console.log('3. 選択肢ごとにDETRACTOR/PASSIVE/PROTOMERを設定')
  console.log('4. フロントエンドで動的スコアカード表示を確認')
  console.log('')
  console.log('🔧 動的スコアカード機能:')
  console.log('- question_display_settings の表示名でスコアカードが自動生成されます')
  console.log('- 固定のスコア名に依存せず、データベース設定に基づいて表示')
  console.log('- カード色は自動で割り当てられ、最大7色まで対応')
  console.log('- データがない場合は設定ガイダンスが表示されます')
}

// テスト実行
runTests().catch(console.error)