const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkColumnMismatch() {
  console.log('🔍 question_answer_option_linear_scale テーブルのカラム名不一致確認\n');

  console.log('📋 実際のテーブル構造（DDLから）:');
  console.log('   CREATE TABLE question_answer_option_linear_scale (');
  console.log('     id uuid PRIMARY KEY,');
  console.log('     created_at timestamp,');
  console.log('     review_question_answers_id uuid,');
  console.log('     answer_number bigint,  ← 実際のカラム名');
  console.log('   );');
  console.log('');

  console.log('💻 コードで使用しているカラム名:');
  console.log('');
  
  console.log('1️⃣ Edge Function (lottery/index.ts) - 行164-168:');
  console.log('   const { error: scaleError } = await supabase');
  console.log('     .from("question_answer_option_linear_scale")');
  console.log('     .insert([{');
  console.log('       review_question_answers_id: questionAnswerId,');
  console.log('       scale_value: parseInt((answerData as any).answer)  ← ❌ 存在しないカラム');
  console.log('     }])');
  console.log('');

  console.log('2️⃣ Client (supabase.js) - 行583-587:');
  console.log('   const { error: scaleError } = await supabase');
  console.log('     .from("question_answer_option_linear_scale")');
  console.log('     .insert([{');
  console.log('       review_question_answers_id: questionAnswerId,');
  console.log('       answer_number: parseInt(answerData.answer)  ← ✅ 正しいカラム名');
  console.log('     }])');
  console.log('');

  console.log('🔍 カラム名の対比結果:');
  console.log('');
  console.log('| 場所 | 使用カラム名 | 実際のカラム名 | 状態 |');
  console.log('|------|-------------|---------------|------|');
  console.log('| Edge Function | scale_value | answer_number | ❌ 不一致 |');
  console.log('| Client側 | answer_number | answer_number | ✅ 一致 |');
  console.log('');

  console.log('📊 問題の詳細分析:');
  console.log('');
  console.log('1. Edge Function の問題:');
  console.log('   - 存在しない scale_value カラムにインサートしようとしている');
  console.log('   - PostgreSQLエラーが発生してインサートが失敗する');
  console.log('   - 質問タイプ7の回答も保存されない');
  console.log('');

  console.log('2. Client側の状況:');
  console.log('   - answer_number カラム名は正しい');
  console.log('   - ただし submitAnswersWithLottery を使用する限り Client側コードは実行されない');
  console.log('   - 実際の保存は Edge Function で行われる');
  console.log('');

  console.log('3. submitAnswersWithLottery フロー:');
  console.log('   Frontend → submitAnswersWithLottery() → Edge Function → 保存処理');
  console.log('   ※ Client側の saveReviewFormAnswers は呼ばれない');
  console.log('');

  // 実際にカラム名をテストして確認
  console.log('🧪 カラム名の実証テスト:');
  console.log('');
  
  try {
    // answer_number でのテスト
    console.log('テスト1: answer_number カラムでのインサート');
    const { error: answerNumberError } = await supabase
      .from('question_answer_option_linear_scale')
      .insert([{
        review_question_answers_id: '00000000-0000-0000-0000-000000000000',
        answer_number: 5
      }]);
    
    if (answerNumberError) {
      console.log(`   結果: ${answerNumberError.message}`);
      if (!answerNumberError.message.includes('answer_number')) {
        console.log('   ✅ answer_number カラムは存在（他の理由でエラー）');
      } else {
        console.log('   ❌ answer_number カラムが存在しない');
      }
    } else {
      console.log('   ✅ answer_number でのインサート成功');
    }

    // scale_value でのテスト  
    console.log('\nテスト2: scale_value カラムでのインサート');
    const { error: scaleValueError } = await supabase
      .from('question_answer_option_linear_scale')
      .insert([{
        review_question_answers_id: '00000000-0000-0000-0000-000000000000',
        scale_value: 5
      }]);
    
    if (scaleValueError) {
      console.log(`   結果: ${scaleValueError.message}`);
      if (scaleValueError.message.includes('scale_value') || scaleValueError.message.includes('column')) {
        console.log('   ❌ scale_value カラムは存在しない');
      } else {
        console.log('   ? scale_value カラムの存在は不明（他の理由でエラー）');
      }
    } else {
      console.log('   ✅ scale_value でのインサート成功');
    }

  } catch (error) {
    console.log(`テストエラー: ${error.message}`);
  }

  console.log('\n💡 結論:');
  console.log('');
  console.log('Edge Function で scale_value カラムを使用しているが、');
  console.log('実際のテーブルには answer_number カラムしか存在しない。');
  console.log('これにより質問タイプ7の回答も保存に失敗している。');
  console.log('');
  console.log('修正が必要な箇所:');
  console.log('📁 supabase/functions/lottery/index.ts');
  console.log('📍 行167: scale_value → answer_number に変更');
}

checkColumnMismatch().then(() => {
  console.log('\n✅ カラム名不一致確認完了');
  process.exit(0);
});