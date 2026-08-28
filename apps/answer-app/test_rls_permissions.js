const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testRLSPermissions() {
  console.log('🔐 RLS権限テスト - 各回答テーブルの書き込み権限確認\n');

  try {
    // 各テーブルに対して空のINSERTを試してRLSエラーを確認
    const tables = [
      'review_form_submissions',
      'review_question_answers', 
      'question_answer_texts',
      'question_answer_option_choices',
      'question_answer_option_linear_scale'
    ];

    console.log('📋 各テーブルのRLSポリシー確認:');
    console.log('   (空データでINSERT試行してエラーメッセージを確認)\n');

    for (const table of tables) {
      console.log(`🔍 ${table}:`);
      
      try {
        const { data, error } = await supabase
          .from(table)
          .insert([{}])
          .select();

        if (error) {
          if (error.message.includes('row-level security policy')) {
            console.log(`   ❌ RLSポリシー違反: ${error.message}`);
          } else if (error.message.includes('null value')) {
            console.log(`   ✅ RLS通過 (NULL制約エラー): ${error.message}`);
          } else if (error.message.includes('foreign key')) {
            console.log(`   ✅ RLS通過 (外部キー制約エラー): ${error.message}`);
          } else {
            console.log(`   ? その他のエラー: ${error.message}`);
          }
        } else {
          console.log(`   ✅ 挿入成功 (データあり)`);
        }
      } catch (error) {
        console.log(`   ❌ 例外: ${error.message}`);
      }
      
      console.log('');
    }

    // question_answer_option_linear_scale に特化したテスト
    console.log('🎯 question_answer_option_linear_scale 特化テスト:');
    
    // 1. 最小限のデータで挿入テスト
    console.log('\n1️⃣ 最小限データでの挿入テスト:');
    try {
      const { data, error } = await supabase
        .from('question_answer_option_linear_scale')
        .insert([{
          answer_number: 5
        }])
        .select();

      if (error) {
        console.log(`   エラー: ${error.message}`);
        if (error.code) console.log(`   コード: ${error.code}`);
        if (error.details) console.log(`   詳細: ${error.details}`);
      } else {
        console.log(`   ✅ 成功: ${JSON.stringify(data[0])}`);
      }
    } catch (error) {
      console.log(`   例外: ${error.message}`);
    }

    // 2. 完全なデータでの挿入テスト（ダミーUUID使用）
    console.log('\n2️⃣ ダミーUUIDでの挿入テスト:');
    try {
      const { data, error } = await supabase
        .from('question_answer_option_linear_scale')
        .insert([{
          review_question_answers_id: '00000000-0000-0000-0000-000000000000',
          answer_number: 7
        }])
        .select();

      if (error) {
        console.log(`   エラー: ${error.message}`);
        if (error.message.includes('row-level security')) {
          console.log('   🚨 RLSポリシーが原因!');
        } else if (error.message.includes('foreign key')) {
          console.log('   ✅ RLS通過、外部キー制約エラー（正常）');
        }
      } else {
        console.log(`   ✅ 成功: ${JSON.stringify(data[0])}`);
      }
    } catch (error) {
      console.log(`   例外: ${error.message}`);
    }

    // 3. 他のテーブルとの比較
    console.log('\n3️⃣ 他のテーブルとの比較:');
    
    console.log('question_answer_texts:');
    try {
      const { error } = await supabase
        .from('question_answer_texts')
        .insert([{
          review_questions_answers_id: '00000000-0000-0000-0000-000000000000',
          answer_text: 'test'
        }]);
      
      if (error) {
        if (error.message.includes('row-level security')) {
          console.log('   ❌ RLSポリシー違反');
        } else {
          console.log('   ✅ RLS通過');
        }
      }
    } catch (error) {
      console.log(`   例外: ${error.message}`);
    }

    console.log('question_answer_option_choices:');
    try {
      const { error } = await supabase
        .from('question_answer_option_choices')
        .insert([{
          review_question_answers_id: '00000000-0000-0000-0000-000000000000',
          question_option_choices_id: '00000000-0000-0000-0000-000000000000'
        }]);
      
      if (error) {
        if (error.message.includes('row-level security')) {
          console.log('   ❌ RLSポリシー違反');
        } else {
          console.log('   ✅ RLS通過');
        }
      }
    } catch (error) {
      console.log(`   例外: ${error.message}`);
    }

  } catch (error) {
    console.error('RLSテストエラー:', error);
  }
}

testRLSPermissions().then(() => {
  console.log('\n✅ RLS権限テスト完了');
  process.exit(0);
});