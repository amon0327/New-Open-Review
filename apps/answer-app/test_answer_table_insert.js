const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testAnswerTableInsert() {
  console.log('🧪 question_answer_option_linear_scale テーブルの構造確認テスト\n');

  try {
    // 1. 空のインサートでカラム要件を確認
    console.log('1️⃣ 空インサートテスト（必須カラム確認）:');
    try {
      await supabase
        .from('question_answer_option_linear_scale')
        .insert([{}]);
    } catch (error) {
      console.log(`   エラー: ${error.message}`);
      console.log(`   詳細: ${error.details || 'なし'}`);
      console.log(`   ヒント: ${error.hint || 'なし'}`);
    }

    // 2. Edge Functionで期待している形式でテスト
    console.log('\n2️⃣ Edge Function形式テスト (scale_value):');
    try {
      await supabase
        .from('question_answer_option_linear_scale')
        .insert([{
          review_question_answers_id: '00000000-0000-0000-0000-000000000000',
          scale_value: 5
        }]);
    } catch (error) {
      console.log(`   エラー: ${error.message}`);
      console.log(`   詳細: ${error.details || 'なし'}`);
    }

    // 3. Client側で期待している形式でテスト
    console.log('\n3️⃣ Client形式テスト (answer_number):');
    try {
      await supabase
        .from('question_answer_option_linear_scale')
        .insert([{
          review_question_answers_id: '00000000-0000-0000-0000-000000000000',
          answer_number: 5
        }]);
    } catch (error) {
      console.log(`   エラー: ${error.message}`);
      console.log(`   詳細: ${error.details || 'なし'}`);
    }

    // 4. 他の可能性のあるカラム名でテスト
    const possibleColumns = [
      'linear_scale_value',
      'value',
      'answer_value',
      'scale_answer',
      'selected_value'
    ];

    console.log('\n4️⃣ 他の可能性のあるカラム名テスト:');
    for (const column of possibleColumns) {
      try {
        await supabase
          .from('question_answer_option_linear_scale')
          .insert([{
            review_question_answers_id: '00000000-0000-0000-0000-000000000000',
            [column]: 5
          }]);
      } catch (error) {
        console.log(`   ${column}: ${error.message}`);
      }
    }

    // 5. review_question_answersテーブルの存在確認
    console.log('\n5️⃣ review_question_answers テーブル確認:');
    try {
      const { data, error } = await supabase
        .from('review_question_answers')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   エラー: ${error.message}`);
      } else {
        console.log('   ✅ テーブル存在');
        if (data && data.length > 0) {
          console.log(`   カラム: ${Object.keys(data[0]).join(', ')}`);
        } else {
          console.log('   データなし');
        }
      }
    } catch (error) {
      console.log(`   エラー: ${error.message}`);
    }

    // 6. 実際にテスト用の review_question_answers レコードを作成してテスト
    console.log('\n6️⃣ 実際のリレーション確認テスト:');
    
    // 実在する質問IDを取得
    const { data: existingQuestion } = await supabase
      .from('review_questions')
      .select('id')
      .eq('question_types_id', 9)
      .limit(1)
      .single();

    if (existingQuestion) {
      console.log(`   実在する質問ID: ${existingQuestion.id}`);
      
      // 実在するsubmissionIDを作成
      try {
        const { data: submissionData } = await supabase
          .from('review_form_submissions')
          .insert([{
            review_forms_id: 'b56f61fb-4840-4710-9f0b-0b73b22959b5',
            users: '00000000-0000-0000-0000-000000000000'
          }])
          .select()
          .single();

        if (submissionData) {
          console.log(`   テストsubmission作成: ${submissionData.id}`);
          
          // review_question_answersレコード作成
          const { data: questionAnswerData } = await supabase
            .from('review_question_answers')
            .insert([{
              review_form_submissions_id: submissionData.id,
              review_questions_id: existingQuestion.id
            }])
            .select()
            .single();

          if (questionAnswerData) {
            console.log(`   テストquestion_answer作成: ${questionAnswerData.id}`);
            
            // リニアスケール回答テスト
            try {
              const { data: scaleAnswerData } = await supabase
                .from('question_answer_option_linear_scale')
                .insert([{
                  review_question_answers_id: questionAnswerData.id,
                  scale_value: 7
                }])
                .select();
              
              console.log('   ✅ scale_value での保存成功！');
              
              // テストデータ削除
              await supabase.from('question_answer_option_linear_scale').delete().eq('id', scaleAnswerData[0].id);
              console.log('   🗑️ テストデータ削除完了');
              
            } catch (scaleError) {
              console.log(`   scale_value エラー: ${scaleError.message}`);
            }
            
            // 削除
            await supabase.from('review_question_answers').delete().eq('id', questionAnswerData.id);
          }
          
          // 削除
          await supabase.from('review_form_submissions').delete().eq('id', submissionData.id);
        }
      } catch (testError) {
        console.log(`   テスト作成エラー: ${testError.message}`);
      }
    }

  } catch (error) {
    console.error('テストエラー:', error);
  }
}

testAnswerTableInsert().then(() => {
  console.log('\n✅ テスト完了');
  process.exit(0);
});