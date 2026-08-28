const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function detailedTableAnalysis() {
  console.log('🔍 質問タイプ7,9の回答が書き込まれない問題の詳細分析\n');

  try {
    // 1. question_answer_option_linear_scale テーブルの正確な構造を確認
    console.log('📊 question_answer_option_linear_scale テーブル詳細分析:');
    
    // PostgreSQLの情報スキーマから構造を取得
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'question_answer_option_linear_scale' });

    if (tableError) {
      console.log('   RPC関数が利用できません。代替方法で確認...');
      
      // 代替：ダミーデータで構造確認
      try {
        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/question_answer_option_linear_scale?select=*&limit=0`, {
          headers: {
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
          }
        });
        
        if (response.ok) {
          console.log('   ✅ テーブル存在確認');
        } else {
          console.log(`   ❌ テーブル応答エラー: ${response.status}`);
        }
      } catch (fetchError) {
        console.log(`   ❌ テーブル確認エラー: ${fetchError.message}`);
      }
    }

    // 2. 実際にテスト用データでテーブル構造を確認
    console.log('\n🧪 テーブル構造確認（実際のインサートテスト）:');
    
    // 実在する質問を取得
    const { data: question } = await supabase
      .from('review_questions')
      .select('id, question_types_id')
      .eq('question_types_id', 9)
      .limit(1)
      .single();

    if (question) {
      console.log(`   テスト質問ID: ${question.id} (タイプ${question.question_types_id})`);
      
      // テスト用submission作成
      const { data: submission, error: subError } = await supabase
        .from('review_form_submissions')
        .insert([{
          review_forms_id: 'b56f61fb-4840-4710-9f0b-0b73b22959b5',
          users: '11111111-1111-1111-1111-111111111111'
        }])
        .select()
        .single();

      if (subError) {
        console.log(`   ❌ Submission作成エラー: ${subError.message}`);
      } else {
        console.log(`   ✅ テストSubmission作成: ${submission.id}`);
        
        // テスト用question_answer作成
        const { data: questionAnswer, error: qaError } = await supabase
          .from('review_question_answers')
          .insert([{
            review_form_submissions_id: submission.id,
            review_questions_id: question.id
          }])
          .select()
          .single();

        if (qaError) {
          console.log(`   ❌ QuestionAnswer作成エラー: ${qaError.message}`);
        } else {
          console.log(`   ✅ テストQuestionAnswer作成: ${questionAnswer.id}`);
          
          // 様々なカラム名でリニアスケール回答をテスト
          const testColumns = [
            { name: 'scale_value', value: 7 },
            { name: 'answer_number', value: 8 },
            { name: 'linear_scale_value', value: 5 },
            { name: 'value', value: 6 },
            { name: 'answer_value', value: 9 }
          ];

          for (const testCol of testColumns) {
            try {
              const insertData = {
                review_question_answers_id: questionAnswer.id,
                [testCol.name]: testCol.value
              };
              
              const { data: scaleData, error: scaleError } = await supabase
                .from('question_answer_option_linear_scale')
                .insert([insertData])
                .select();

              if (scaleError) {
                console.log(`   ❌ ${testCol.name}: ${scaleError.message}`);
              } else {
                console.log(`   ✅ ${testCol.name}: 成功！データ保存できます`);
                console.log(`      挿入されたデータ: ${JSON.stringify(scaleData[0])}`);
                
                // 成功したデータは削除
                await supabase
                  .from('question_answer_option_linear_scale')
                  .delete()
                  .eq('id', scaleData[0].id);
                
                console.log(`      🗑️ テストデータ削除完了`);
                break; // 成功したら他はテストしない
              }
            } catch (error) {
              console.log(`   ❌ ${testCol.name}: 例外 - ${error.message}`);
            }
          }
          
          // QuestionAnswer削除
          await supabase
            .from('review_question_answers')
            .delete()
            .eq('id', questionAnswer.id);
        }
        
        // Submission削除
        await supabase
          .from('review_form_submissions')
          .delete()
          .eq('id', submission.id);
        
        console.log('   🗑️ テストSubmission削除完了');
      }
    }

    // 3. 実際のコードと期待される構造の比較
    console.log('\n📋 コードと実際の構造の比較分析:');
    
    console.log('📝 Edge Function (lottery/index.ts) - 行164-168:');
    console.log('   .from("question_answer_option_linear_scale")');
    console.log('   .insert([{');
    console.log('     review_question_answers_id: questionAnswerId,');
    console.log('     scale_value: parseInt((answerData as any).answer)');  
    console.log('   }])');
    
    console.log('\n📝 Client (supabase.js) - 行583-587:');
    console.log('   .from("question_answer_option_linear_scale")');
    console.log('   .insert([{');
    console.log('     review_question_answers_id: questionAnswerId,');
    console.log('     answer_number: parseInt(answerData.answer)');
    console.log('   }])');

    // 4. 実際にテーブルが存在するか、権限があるかを確認
    console.log('\n🔐 テーブル権限・存在確認:');
    
    const { data: permissionTest, error: permError } = await supabase
      .from('question_answer_option_linear_scale')
      .select('count')
      .limit(0);

    if (permError) {
      console.log(`   ❌ テーブルアクセスエラー: ${permError.message}`);
      console.log(`   コード: ${permError.code}`);
      console.log(`   詳細: ${permError.details || 'なし'}`);
    } else {
      console.log('   ✅ テーブルへの読み取り権限あり');
    }

    // 5. 質問タイプ7の存在確認
    console.log('\n🔍 質問タイプ7の存在確認:');
    
    const { data: type7Questions, count: type7Count } = await supabase
      .from('review_questions')
      .select('*', { count: 'exact' })
      .eq('question_types_id', 7);

    console.log(`   質問タイプ7: ${type7Count}件`);
    
    if (type7Count > 0) {
      const type7Sample = type7Questions[0];
      console.log(`   サンプル: "${type7Sample.question_text}"`);
      
      // タイプ7のスケール設定確認
      const { data: type7Settings } = await supabase
        .from('question_option_linear_scale')
        .select('*')
        .eq('review_questions_id', type7Sample.id);
      
      console.log(`   スケール設定: ${type7Settings ? type7Settings.length : 0}件`);
    }

  } catch (error) {
    console.error('分析エラー:', error);
  }
}

detailedTableAnalysis().then(() => {
  console.log('\n✅ 詳細分析完了');
  process.exit(0);
});