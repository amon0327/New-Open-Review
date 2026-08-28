const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkType9Answers() {
  console.log('🔍 質問タイプ9の回答データ確認\n');

  try {
    // 1. 質問タイプ9のIDを取得
    const { data: type9Questions, error: questionsError } = await supabase
      .from('review_questions')
      .select('id, question_text')
      .eq('question_types_id', 9);

    if (questionsError) {
      console.error('質問取得エラー:', questionsError);
      return;
    }

    console.log(`📝 質問タイプ9の質問: ${type9Questions.length}件`);
    type9Questions.forEach(q => {
      console.log(`   ID: ${q.id} - "${q.question_text}"`);
    });
    console.log('');

    // 2. 各回答テーブルでタイプ9の回答を確認
    console.log('📊 回答データ確認:');

    // question_answer_option_linear_scale テーブル
    console.log('\n🔢 Linear Scale回答 (question_answer_option_linear_scale):');
    
    for (const question of type9Questions) {
      const { data: scaleAnswers, error: scaleError, count } = await supabase
        .from('question_answer_option_linear_scale')
        .select('*', { count: 'exact' })
        .eq('review_questions_id', question.id);

      if (scaleError) {
        console.log(`   質問ID ${question.id}: エラー - ${scaleError.message}`);
      } else {
        console.log(`   質問ID ${question.id}: ${count || 0}件の回答`);
        if (scaleAnswers && scaleAnswers.length > 0) {
          console.log('   サンプル回答:');
          scaleAnswers.slice(0, 3).forEach(answer => {
            console.log(`      回答ID: ${answer.id}, 値: ${answer.scale_value}, 作成日: ${answer.created_at}`);
          });
        }
      }
    }

    // 他の回答テーブルも確認（念のため）
    console.log('\n📝 Text回答 (question_answer_texts):');
    for (const question of type9Questions) {
      const { count } = await supabase
        .from('question_answer_texts')
        .select('*', { count: 'exact', head: true })
        .eq('review_questions_id', question.id);
      
      if (count > 0) {
        console.log(`   質問ID ${question.id}: ${count}件の回答 (予期しない)`);
      }
    }

    console.log('\n🔘 Choice回答 (question_answer_option_choices):');
    for (const question of type9Questions) {
      const { count } = await supabase
        .from('question_answer_option_choices')
        .select('*', { count: 'exact', head: true })
        .eq('review_questions_id', question.id);
      
      if (count > 0) {
        console.log(`   質問ID ${question.id}: ${count}件の回答 (予期しない)`);
      }
    }

    // 3. 全体の回答統計
    console.log('\n📈 全体統計:');
    
    const { count: totalLinearAnswers } = await supabase
      .from('question_answer_option_linear_scale')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalTextAnswers } = await supabase
      .from('question_answer_texts')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalChoiceAnswers } = await supabase
      .from('question_answer_option_choices')
      .select('*', { count: 'exact', head: true });

    console.log(`   Linear Scale回答総数: ${totalLinearAnswers}件`);
    console.log(`   Text回答総数: ${totalTextAnswers}件`);
    console.log(`   Choice回答総数: ${totalChoiceAnswers}件`);

    // 4. question_answer_option_linear_scaleテーブルの構造確認
    console.log('\n🗃️ Linear Scaleテーブル構造:');
    const { data: sampleLinear, error: linearError } = await supabase
      .from('question_answer_option_linear_scale')
      .select('*')
      .limit(1);

    if (linearError) {
      console.log(`   エラー: ${linearError.message}`);
    } else if (sampleLinear && sampleLinear.length > 0) {
      console.log(`   カラム: ${Object.keys(sampleLinear[0]).join(', ')}`);
    } else {
      console.log('   データなし');
    }

    // 5. 回答セッション確認
    console.log('\n📋 回答セッション (review_form_submissions):');
    const { count: totalSubmissions } = await supabase
      .from('review_form_submissions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   回答セッション総数: ${totalSubmissions}件`);

    if (totalSubmissions > 0) {
      const { data: recentSubmissions } = await supabase
        .from('review_form_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      
      console.log('   最近の回答セッション:');
      recentSubmissions.forEach(submission => {
        console.log(`      ID: ${submission.id}, フォーム: ${submission.review_fome_id}, 作成: ${submission.created_at}`);
      });
    }

  } catch (error) {
    console.error('確認エラー:', error);
  }
}

// 実行
checkType9Answers().then(() => {
  console.log('\n✅ 質問タイプ9回答確認完了');
  process.exit(0);
});