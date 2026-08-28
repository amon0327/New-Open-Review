const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkAnswerTables() {
  console.log('🔍 回答テーブルの構造確認\n');

  // 可能性のあるテーブル名を確認
  const possibleTables = [
    'question_answer_option_linear_scale',
    'question_answer_linear_scale', 
    'linear_scale_answers',
    'review_question_answers',
    'question_answers',
    'answer_linear_scale'
  ];

  console.log('📋 テーブル存在確認:');
  for (const tableName of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!error) {
        console.log(`✅ ${tableName}: 存在`);
        if (data && data.length > 0) {
          console.log(`   カラム: ${Object.keys(data[0]).join(', ')}`);
          console.log(`   データ数: ${data.length}件以上`);
        } else {
          console.log(`   データ: なし`);
        }
      } else {
        console.log(`❌ ${tableName}: 存在しない`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: エラー - ${err.message}`);
    }
  }

  // review_form_submissions も詳しく確認
  console.log('\n📋 回答セッション詳細確認:');
  const { data: submissions, error: subError } = await supabase
    .from('review_form_submissions')
    .select('*')
    .limit(5);

  if (subError) {
    console.log(`エラー: ${subError.message}`);
  } else {
    console.log(`セッション数: ${submissions.length}件`);
    if (submissions.length > 0) {
      console.log(`カラム: ${Object.keys(submissions[0]).join(', ')}`);
      submissions.forEach(sub => {
        console.log(`ID: ${sub.id}, 作成: ${sub.created_at}, ステータス: ${sub.status || 'なし'}`);
      });
    }
  }
}

checkAnswerTables().then(() => {
  console.log('\n✅ 確認完了');
  process.exit(0);
});