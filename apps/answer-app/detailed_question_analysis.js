const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function analyzeQuestionStructure() {
  console.log('🔍 質問タイプごとのデータ構造詳細分析\n');

  try {
    // 1. 質問タイプマスタを取得
    const { data: questionTypes, error: typesError } = await supabase
      .from('question_types')
      .select('*')
      .order('id');

    if (typesError) {
      console.log('質問タイプマスタ取得エラー:', typesError);
    } else {
      console.log('📋 質問タイプマスタ:');
      questionTypes.forEach(type => {
        console.log(`   ID: ${type.id} - ${type.name} (${type.description || 'なし'})`);
      });
      console.log('');
    }

    // 2. 各タイプの質問を調査
    for (let typeId = 1; typeId <= 9; typeId++) {
      console.log(`\n📝 質問タイプ ${typeId} の詳細:`);
      
      // 該当する質問を取得
      const { data: questions, error: qError } = await supabase
        .from('review_questions')
        .select('*')
        .eq('question_types_id', typeId)
        .limit(3);

      if (qError) {
        console.log(`   エラー: ${qError.message}`);
        continue;
      }

      if (!questions || questions.length === 0) {
        console.log('   該当する質問なし');
        continue;
      }

      console.log(`   質問数: ${questions.length}件`);
      
      // サンプル質問表示
      const sample = questions[0];
      console.log(`   例: "${sample.question_text}"`);
      
      // 質問タイプ別の関連データ調査
      await analyzeQuestionTypeData(typeId, sample.id);
    }

    // 3. 回答データの実際の構造を調査
    await analyzeAnswerTables();

  } catch (error) {
    console.error('分析エラー:', error);
  }
}

async function analyzeQuestionTypeData(typeId, questionId) {
  // 選択肢データ確認
  const { data: choices, error: choiceError } = await supabase
    .from('question_option_choices')
    .select('*')
    .eq('review_questions_id', questionId)
    .order('choice_number');

  if (!choiceError && choices && choices.length > 0) {
    console.log(`   🔘 選択肢: ${choices.length}個`);
    choices.forEach((choice, index) => {
      if (index < 3) { // 最初の3個だけ表示
        console.log(`      ${choice.choice_number}: "${choice.choice_name}"`);
      }
    });
  }

  // リニアスケール設定確認
  const { data: scales, error: scaleError } = await supabase
    .from('question_option_linear_scale')
    .select('*')
    .eq('review_questions_id', questionId);

  if (!scaleError && scales && scales.length > 0) {
    const scale = scales[0];
    console.log(`   📊 スケール: ${scale.min_value || '?'} - ${scale.max_value || '?'}`);
    console.log(`   ラベル: "${scale.min_label || '?'}" → "${scale.max_label || '?'}"`);
  }
}

async function analyzeAnswerTables() {
  console.log('\n\n🗃️ 回答データテーブル構造:');
  
  const tables = [
    'question_answer_texts',
    'question_answer_option_choices', 
    'question_answer_option_linear_scale'
  ];

  for (const tableName of tables) {
    console.log(`\n📊 ${tableName}:`);
    
    // テーブル構造確認
    const { data: sample, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`   エラー: ${error.message}`);
    } else if (sample && sample.length > 0) {
      console.log(`   カラム: ${Object.keys(sample[0]).join(', ')}`);
      
      // データ例表示
      const record = sample[0];
      Object.entries(record).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const displayValue = typeof value === 'string' && value.length > 50 
            ? value.substring(0, 50) + '...' 
            : value;
          console.log(`   ${key}: ${displayValue}`);
        }
      });
    } else {
      console.log('   データなし');
    }
  }

  // 実際の回答データ数も確認
  console.log('\n📈 回答データ統計:');
  for (const tableName of tables) {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`   ${tableName}: ${count}件`);
    }
  }
}

// 実行
analyzeQuestionStructure().then(() => {
  console.log('\n✅ 分析完了');
  process.exit(0);
});