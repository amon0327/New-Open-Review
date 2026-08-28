const { createClient } = require('@supabase/supabase-js');

// Supabase設定（.envから読み込み）
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('環境変数が設定されていません: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuestionTypes() {
  console.log('=== 質問タイプごとのデータ構造調査 ===\n');

  try {
    // 1. 質問タイプ一覧を取得
    const { data: questions, error: questionsError } = await supabase
      .from('review_questions')
      .select('*')
      .order('question_types_id');

    if (questionsError) {
      console.error('質問データ取得エラー:', questionsError);
      return;
    }

    // 質問タイプごとにグループ化
    const questionsByType = {};
    questions.forEach(q => {
      if (!questionsByType[q.question_types_id]) {
        questionsByType[q.question_types_id] = [];
      }
      questionsByType[q.question_types_id].push(q);
    });

    // 各質問タイプについて詳細調査
    for (const [type, typeQuestions] of Object.entries(questionsByType)) {
      console.log(`📝 質問タイプ ${type}:`);
      console.log(`   件数: ${typeQuestions.length}件`);
      
      // サンプル質問を1つ表示
      const sample = typeQuestions[0];
      console.log(`   サンプル質問: "${sample.question_text}"`);
      console.log(`   詳細: "${sample.question_detail_text || 'なし'}"`);
      console.log(`   必須: ${sample.is_required ? 'はい' : 'いいえ'}`);
      
      // 質問タイプ別の関連データを調査
      await checkQuestionTypeData(type, sample.id);
      console.log('');
    }

    // 回答データの構造も調査
    await checkAnswerDataStructure();

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

async function checkQuestionTypeData(questionType, sampleQuestionId) {
  switch (parseInt(questionType)) {
    case 1: // ショートテキスト
    case 2: // ロングテキスト
      console.log('   📄 テキスト質問 - 追加設定なし');
      break;
      
    case 3: // 単一選択
    case 4: // 複数選択
    case 5: // 単一選択マトリクス
    case 6: // 複数選択マトリクス
    case 8: // プルダウン
      await checkChoiceOptions(sampleQuestionId);
      break;
      
    case 7: // リニアスケール
      await checkLinearScaleOptions(sampleQuestionId);
      break;
  }
}

async function checkChoiceOptions(questionId) {
  const { data: choices, error } = await supabase
    .from('question_option_choices')
    .select('*')
    .eq('question_id', questionId)
    .order('choice_order');

  if (error) {
    console.log('   ⚠️ 選択肢データ取得エラー');
    return;
  }

  console.log(`   🔘 選択肢数: ${choices.length}個`);
  if (choices.length > 0) {
    console.log(`   例: "${choices[0].choice_text}", "${choices[1]?.choice_text || '(2個目なし)'}"`);
  }
}

async function checkLinearScaleOptions(questionId) {
  const { data: scale, error } = await supabase
    .from('question_option_linear_scale')
    .select('*')
    .eq('question_id', questionId)
    .single();

  if (error) {
    console.log('   ⚠️ スケール設定取得エラー');
    return;
  }

  if (scale) {
    console.log(`   📊 スケール範囲: ${scale.min_value} - ${scale.max_value}`);
    console.log(`   ラベル: "${scale.min_label}" → "${scale.max_label}"`);
  }
}

async function checkAnswerDataStructure() {
  console.log('=== 回答データ構造 ===\n');

  // 各回答テーブルのサンプルデータを調査
  const answerTables = [
    { name: 'question_answer_texts', description: 'テキスト回答' },
    { name: 'question_answer_option_choices', description: '選択肢回答' },
    { name: 'question_answer_option_linear_scale', description: 'スケール回答' }
  ];

  for (const table of answerTables) {
    console.log(`📊 ${table.description} (${table.name}):`);
    
    const { data, error } = await supabase
      .from(table.name)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`   ⚠️ データ取得エラー: ${error.message}`);
    } else if (data && data.length > 0) {
      const sample = data[0];
      console.log('   カラム:', Object.keys(sample).join(', '));
      
      // 重要なカラムの値を表示
      if (sample.answer_text) console.log(`   回答例: "${sample.answer_text.substring(0, 50)}..."`);
      if (sample.selected_choice_ids) console.log(`   選択肢ID: [${sample.selected_choice_ids}]`);
      if (sample.scale_value !== undefined) console.log(`   スケール値: ${sample.scale_value}`);
    } else {
      console.log('   データなし');
    }
    console.log('');
  }
}

// スクリプト実行
checkQuestionTypes().then(() => {
  console.log('調査完了');
  process.exit(0);
});