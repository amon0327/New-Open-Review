const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkLinearScaleTableStructure() {
  console.log('🔍 question_option_linear_scale と question_answer_option_linear_scale の構造分析\n');

  try {
    // 1. question_option_linear_scale テーブル構造確認
    console.log('📋 question_option_linear_scale テーブル:');
    console.log('   目的: 質問の設定（最小・最大ラベル、ロイヤルティフラグ）を保存');
    
    const { data: scaleSettings, error: settingsError } = await supabase
      .from('question_option_linear_scale')
      .select('*')
      .limit(1);

    if (settingsError) {
      console.log(`   エラー: ${settingsError.message}`);
    } else if (scaleSettings && scaleSettings.length > 0) {
      console.log(`   カラム: ${Object.keys(scaleSettings[0]).join(', ')}`);
      console.log('   サンプルデータ:');
      Object.entries(scaleSettings[0]).forEach(([key, value]) => {
        console.log(`      ${key}: ${value}`);
      });
    } else {
      console.log('   データなし');
    }

    // 2. question_answer_option_linear_scale テーブル構造確認
    console.log('\n📊 question_answer_option_linear_scale テーブル:');
    console.log('   目的: ユーザーの実際の回答値を保存');
    
    const { data: answerData, error: answerError } = await supabase
      .from('question_answer_option_linear_scale')
      .select('*')
      .limit(1);

    if (answerError) {
      console.log(`   エラー: ${answerError.message}`);
    } else if (answerData && answerData.length > 0) {
      console.log(`   カラム: ${Object.keys(answerData[0]).join(', ')}`);
      console.log('   サンプルデータ:');
      Object.entries(answerData[0]).forEach(([key, value]) => {
        console.log(`      ${key}: ${value}`);
      });
    } else {
      console.log('   データなし');
    }

    // 3. 両テーブルのデータ数確認
    console.log('\n📊 データ数確認:');
    
    const { count: settingsCount } = await supabase
      .from('question_option_linear_scale')
      .select('*', { count: 'exact', head: true });
    
    const { count: answersCount } = await supabase
      .from('question_answer_option_linear_scale')
      .select('*', { count: 'exact', head: true });

    console.log(`   question_option_linear_scale: ${settingsCount}件`);
    console.log(`   question_answer_option_linear_scale: ${answersCount}件`);

    // 4. 実際の質問設定データを確認
    console.log('\n🔍 実際のリニアスケール設定データ:');
    
    const { data: allSettings, error: allSettingsError } = await supabase
      .from('question_option_linear_scale')
      .select('*, review_questions!inner(question_text, question_types_id)')
      .limit(5);

    if (allSettingsError) {
      console.log(`   エラー: ${allSettingsError.message}`);
    } else if (allSettings && allSettings.length > 0) {
      allSettings.forEach(setting => {
        console.log(`   質問: "${setting.review_questions.question_text}"`);
        console.log(`   タイプ: ${setting.review_questions.question_types_id}`);
        console.log(`   最小ラベル: "${setting.min_text}"`);
        console.log(`   最大ラベル: "${setting.max_text}"`);
        console.log(`   ロイヤルティフラグ: ${setting.loyalty_score_flags}`);
        console.log('');
      });
    }

    // 5. コードと実際のテーブル構造の対比
    console.log('🔧 コードで期待されている構造 vs 実際の構造:');
    
    console.log('\n📝 Edge Function (lottery/index.ts) での保存処理:');
    console.log('   テーブル: question_answer_option_linear_scale');
    console.log('   期待カラム: review_question_answers_id, scale_value');
    
    console.log('\n📝 Client (supabase.js) での保存処理:');
    console.log('   テーブル: question_answer_option_linear_scale');
    console.log('   期待カラム: review_question_answers_id, answer_number');

    // 6. 一時的にテーブル構造を確認するため空のインサートを試行
    console.log('\n🧪 テーブル構造確認（エラーメッセージから推定）:');
    
    try {
      await supabase
        .from('question_answer_option_linear_scale')
        .insert([{}]);
    } catch (insertError) {
      console.log('   インサートエラー（構造推定用）:', insertError.message);
    }

  } catch (error) {
    console.error('分析エラー:', error);
  }
}

checkLinearScaleTableStructure().then(() => {
  console.log('\n✅ 構造分析完了');
  process.exit(0);
});