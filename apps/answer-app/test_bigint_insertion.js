const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testBigintInsertion() {
  console.log('🧪 bigint型への挿入テスト\n');

  try {
    // 1. 先に必要な前提データを作成
    console.log('1️⃣ 前提データの作成:');
    
    // テスト用submission作成
    const { data: testSubmission, error: subError } = await supabase
      .from('review_form_submissions')
      .insert([{
        review_forms_id: 'b56f61fb-4840-4710-9f0b-0b73b22959b5', // 実在するフォームID
        users: '11111111-1111-1111-1111-111111111111' // テスト用UUID
      }])
      .select()
      .single();

    if (subError) {
      console.log(`   ❌ Submission作成失敗: ${subError.message}`);
      return;
    }
    console.log(`   ✅ TestSubmission作成: ${testSubmission.id}`);

    // テスト用question_answer作成
    const { data: testQuestionAnswer, error: qaError } = await supabase
      .from('review_question_answers')
      .insert([{
        review_form_submissions_id: testSubmission.id,
        review_questions_id: '847bded2-495d-49ea-a700-923e0b2b7fc4' // 実在する質問ID (タイプ9)
      }])
      .select()
      .single();

    if (qaError) {
      console.log(`   ❌ QuestionAnswer作成失敗: ${qaError.message}`);
      // Submission削除
      await supabase.from('review_form_submissions').delete().eq('id', testSubmission.id);
      return;
    }
    console.log(`   ✅ TestQuestionAnswer作成: ${testQuestionAnswer.id}`);

    // 2. 各種データ型でlinear scale挿入テスト
    console.log('\n2️⃣ 各種データ型での挿入テスト:');

    const testCases = [
      { name: 'number型 (parseInt)', value: parseInt('7') },
      { name: 'string型', value: '7' },
      { name: 'number直接', value: 7 },
      { name: 'BigInt型', value: BigInt(7) },
      { name: 'string→BigInt', value: BigInt('7') }
    ];

    for (const testCase of testCases) {
      console.log(`\n   テスト: ${testCase.name} (値: ${testCase.value}, 型: ${typeof testCase.value})`);
      
      try {
        const { data: scaleData, error: scaleError } = await supabase
          .from('question_answer_option_linear_scale')
          .insert([{
            review_question_answers_id: testQuestionAnswer.id,
            answer_number: testCase.value
          }])
          .select();

        if (scaleError) {
          console.log(`      ❌ 失敗: ${scaleError.message}`);
          if (scaleError.details) console.log(`      詳細: ${scaleError.details}`);
          if (scaleError.hint) console.log(`      ヒント: ${scaleError.hint}`);
        } else {
          console.log(`      ✅ 成功: データ挿入完了`);
          console.log(`      挿入値: ${scaleData[0].answer_number} (型: ${typeof scaleData[0].answer_number})`);
          
          // テストデータは即座に削除
          await supabase
            .from('question_answer_option_linear_scale')
            .delete()
            .eq('id', scaleData[0].id);
          console.log(`      🗑️ テストデータ削除完了`);
          
          // 成功したら他のテストは不要
          break;
        }
      } catch (error) {
        console.log(`      ❌ 例外: ${error.message}`);
      }
    }

    // 3. 実際のEdge Functionと同じ形式でテスト
    console.log('\n3️⃣ Edge Function形式テスト:');
    
    // Edge Functionで使われているのと同じ処理をシミュレート
    const answerData = { answer: '8' }; // フロントエンドから来る形式
    const edgeFunctionValue = parseInt(answerData.answer);
    
    console.log(`   Edge Function形式: parseInt("${answerData.answer}") = ${edgeFunctionValue} (型: ${typeof edgeFunctionValue})`);
    
    try {
      const { data: edgeTestData, error: edgeTestError } = await supabase
        .from('question_answer_option_linear_scale')
        .insert([{
          review_question_answers_id: testQuestionAnswer.id,
          answer_number: edgeFunctionValue
        }])
        .select();

      if (edgeTestError) {
        console.log(`      ❌ Edge Function形式失敗: ${edgeTestError.message}`);
      } else {
        console.log(`      ✅ Edge Function形式成功`);
        
        // 削除
        await supabase
          .from('question_answer_option_linear_scale')
          .delete()
          .eq('id', edgeTestData[0].id);
      }
    } catch (error) {
      console.log(`      ❌ Edge Function形式例外: ${error.message}`);
    }

    // 4. クリーンアップ
    console.log('\n4️⃣ クリーンアップ:');
    await supabase.from('review_question_answers').delete().eq('id', testQuestionAnswer.id);
    await supabase.from('review_form_submissions').delete().eq('id', testSubmission.id);
    console.log('   ✅ テストデータ全削除完了');

  } catch (error) {
    console.error('テストエラー:', error);
  }
}

testBigintInsertion().then(() => {
  console.log('\n✅ bigint挿入テスト完了');
  process.exit(0);
});