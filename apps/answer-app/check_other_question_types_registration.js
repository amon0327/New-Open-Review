const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkOtherQuestionTypesRegistration() {
  console.log('🔍 他の質問タイプ（テキスト、選択肢）の登録状況調査\n');

  try {
    // 1. 全回答テーブルのデータ数確認
    console.log('📊 各回答テーブルのデータ数:');
    
    const tables = [
      'question_answer_texts',
      'question_answer_option_choices', 
      'question_answer_option_linear_scale'
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: エラー - ${error.message}`);
      } else {
        console.log(`   📝 ${table}: ${count}件`);
      }
    }

    // 2. review_form_submissions の確認
    console.log('\n📋 回答セッション (review_form_submissions):');
    const { data: submissions, count: submissionCount } = await supabase
      .from('review_form_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`   総数: ${submissionCount}件`);
    if (submissions && submissions.length > 0) {
      console.log('   最近の回答セッション:');
      submissions.forEach(sub => {
        console.log(`      ID: ${sub.id}, 作成: ${sub.created_at}, ユーザー: ${sub.users}`);
      });
    }

    // 3. review_question_answers の確認  
    console.log('\n🔗 質問回答リンク (review_question_answers):');
    const { data: questionAnswers, count: qaCount } = await supabase
      .from('review_question_answers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`   総数: ${qaCount}件`);
    if (questionAnswers && questionAnswers.length > 0) {
      console.log('   最近の質問回答:');
      questionAnswers.forEach(qa => {
        console.log(`      ID: ${qa.id}, 質問: ${qa.review_questions_id}, セッション: ${qa.review_form_submissions_id}`);
      });
    }

    // 4. 実際の回答データを詳しく確認
    if (qaCount > 0) {
      console.log('\n📝 実際の回答データ詳細:');
      
      // テキスト回答
      const { data: textAnswers, count: textCount } = await supabase
        .from('question_answer_texts')
        .select(`
          *,
          review_question_answers!inner(
            review_questions!inner(question_text, question_types_id)
          )
        `, { count: 'exact' })
        .limit(3);

      console.log(`\n💬 テキスト回答: ${textCount}件`);
      if (textAnswers && textAnswers.length > 0) {
        textAnswers.forEach(answer => {
          const question = answer.review_question_answers?.review_questions;
          console.log(`   質問タイプ${question?.question_types_id}: "${question?.question_text}"`);
          console.log(`   回答: "${answer.answer_text}"`);
          console.log('');
        });
      }

      // 選択肢回答
      const { data: choiceAnswers, count: choiceCount } = await supabase
        .from('question_answer_option_choices')
        .select(`
          *,
          question_option_choices!inner(choice_name, choice_number),
          review_question_answers!inner(
            review_questions!inner(question_text, question_types_id)
          )
        `, { count: 'exact' })
        .limit(3);

      console.log(`🔘 選択肢回答: ${choiceCount}件`);
      if (choiceAnswers && choiceAnswers.length > 0) {
        choiceAnswers.forEach(answer => {
          const question = answer.review_question_answers?.review_questions;
          const choice = answer.question_option_choices;
          console.log(`   質問タイプ${question?.question_types_id}: "${question?.question_text}"`);
          console.log(`   選択: ${choice?.choice_number}. "${choice?.choice_name}"`);
          console.log('');
        });
      }

      // リニアスケール回答
      const { data: scaleAnswers, count: scaleCount } = await supabase
        .from('question_answer_option_linear_scale')
        .select(`
          *,
          review_question_answers!inner(
            review_questions!inner(question_text, question_types_id)
          )
        `, { count: 'exact' })
        .limit(3);

      console.log(`📊 リニアスケール回答: ${scaleCount}件`);
      if (scaleAnswers && scaleAnswers.length > 0) {
        scaleAnswers.forEach(answer => {
          const question = answer.review_question_answers?.review_questions;
          console.log(`   質問タイプ${question?.question_types_id}: "${question?.question_text}"`);
          console.log(`   回答値: ${answer.answer_number}`);
          console.log('');
        });
      }
    }

    // 5. 実際のテーブル構造確認
    console.log('\n🗃️ 実際のテーブル構造確認:');
    
    console.log('\n📝 question_answer_texts:');
    const { data: textSample } = await supabase
      .from('question_answer_texts')
      .select('*')
      .limit(1);
    if (textSample && textSample.length > 0) {
      console.log(`   カラム: ${Object.keys(textSample[0]).join(', ')}`);
    } else {
      console.log('   データなしのため構造不明');
    }

    console.log('\n🔘 question_answer_option_choices:');
    const { data: choiceSample } = await supabase
      .from('question_answer_option_choices')
      .select('*')
      .limit(1);
    if (choiceSample && choiceSample.length > 0) {
      console.log(`   カラム: ${Object.keys(choiceSample[0]).join(', ')}`);
    } else {
      console.log('   データなしのため構造不明');
    }

    // 6. Edge Function のコードと実際のテーブル構造の対比
    console.log('\n💻 Edge Function での各タイプの処理:');
    
    console.log('\n1️⃣ テキスト回答 (Type 1,2):');
    console.log('   Edge Function: question_answer_texts');
    console.log('   カラム: review_questions_answers_id, answer_text');
    console.log('   実際のテーブル: 上記参照');
    
    console.log('\n2️⃣ 選択肢回答 (Type 3,4,5,6,8):');
    console.log('   Edge Function: question_answer_option_choices');
    console.log('   カラム: review_question_answers_id, question_option_choices_id');
    console.log('   実際のテーブル: 上記参照');
    
    console.log('\n3️⃣ リニアスケール回答 (Type 7,9):');
    console.log('   Edge Function: question_answer_option_linear_scale');
    console.log('   カラム: review_question_answers_id, answer_number');
    console.log('   実際のテーブル: 上記参照');

  } catch (error) {
    console.error('調査エラー:', error);
  }
}

checkOtherQuestionTypesRegistration().then(() => {
  console.log('\n✅ 他の質問タイプ登録状況調査完了');
  process.exit(0);
});