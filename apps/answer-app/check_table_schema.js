const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkTableSchema() {
  console.log('🔍 回答テーブルの正確なスキーマ確認\n');

  // 1. question_answer_option_linear_scale の構造確認
  console.log('📊 question_answer_option_linear_scale:');
  try {
    const { data: insertData, error: insertError } = await supabase
      .from('question_answer_option_linear_scale')
      .insert([{
        review_questions_id: '847bded2-495d-49ea-a700-923e0b2b7fc4',
        scale_value: 5
      }])
      .select();

    if (insertError) {
      console.log('   挿入エラーからカラム推定:', insertError.message);
      
      // 別のカラム名を試す
      const possibleColumns = [
        'question_id',
        'review_question_id', 
        'question_answer_id',
        'linear_scale_value',
        'value'
      ];

      for (const col of possibleColumns) {
        try {
          const testData = { [col]: '847bded2-495d-49ea-a700-923e0b2b7fc4', scale_value: 5 };
          const { error: testError } = await supabase
            .from('question_answer_option_linear_scale')
            .insert([testData])
            .select();
          
          if (!testError) {
            console.log(`   ✅ 正しいカラム名: ${col}`);
            break;
          }
        } catch (e) {
          // 無視
        }
      }
    } else {
      console.log('   ✅ 挿入成功 - カラム構造:');
      console.log(`   ${Object.keys(insertData[0]).join(', ')}`);
      
      // 削除
      await supabase
        .from('question_answer_option_linear_scale')
        .delete()
        .eq('id', insertData[0].id);
    }
  } catch (error) {
    console.log('   エラー:', error.message);
  }

  // 2. review_question_answers の構造確認
  console.log('\n📝 review_question_answers:');
  try {
    const { data: insertData2, error: insertError2 } = await supabase
      .from('review_question_answers')
      .insert([{
        review_questions_id: '847bded2-495d-49ea-a700-923e0b2b7fc4',
        answer_text: 'test'
      }])
      .select();

    if (insertError2) {
      console.log('   挿入エラーからカラム推定:', insertError2.message);
    } else {
      console.log('   ✅ 挿入成功 - カラム構造:');
      console.log(`   ${Object.keys(insertData2[0]).join(', ')}`);
      
      // 削除
      await supabase
        .from('review_question_answers')
        .delete()
        .eq('id', insertData2[0].id);
    }
  } catch (error) {
    console.log('   エラー:', error.message);
  }

  // 3. 実際に回答データがあるかもう一度確認
  console.log('\n📈 実データ確認:');
  
  const answerTables = [
    'question_answer_option_linear_scale',
    'review_question_answers',
    'question_answer_texts',
    'question_answer_option_choices'
  ];

  for (const table of answerTables) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      console.log(`   ${table}: ${count}件`);
      
      if (count > 0) {
        const { data } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (data && data.length > 0) {
          console.log(`     サンプルカラム: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (error) {
      console.log(`   ${table}: エラー - ${error.message}`);
    }
  }
}

checkTableSchema().then(() => {
  console.log('\n✅ スキーマ確認完了');
  process.exit(0);
});