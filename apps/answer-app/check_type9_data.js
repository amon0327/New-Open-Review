const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkType9Registration() {
  console.log('🔍 質問タイプ9の詳細調査\n');

  try {
    // 1. 質問タイプ9の全質問を取得
    console.log('📝 質問タイプ9の質問一覧:');
    const { data: type9Questions, error: questionsError } = await supabase
      .from('review_questions')
      .select('*')
      .eq('question_types_id', 9)
      .order('question_number');

    if (questionsError) {
      console.error('質問取得エラー:', questionsError);
      return;
    }

    console.log(`   合計: ${type9Questions.length}件\n`);

    // 2. 各質問の詳細情報
    for (const question of type9Questions) {
      console.log(`📋 質問ID: ${question.id}`);
      console.log(`   質問番号: ${question.question_number}`);
      console.log(`   質問文: "${question.question_text}"`);
      console.log(`   詳細文: "${question.question_detail_text || 'なし'}"`);
      console.log(`   必須: ${question.is_required ? 'はい' : 'いいえ'}`);
      console.log(`   フォームID: ${question.review_fome_id}`);
      console.log(`   ページ番号: ${question.pege_number}`);

      // 3. リニアスケール設定確認
      console.log('   📊 リニアスケール設定:');
      const { data: scaleSettings, error: scaleError } = await supabase
        .from('question_option_linear_scale')
        .select('*')
        .eq('review_questions_id', question.id);

      if (scaleError) {
        console.log(`      エラー: ${scaleError.message}`);
      } else if (scaleSettings && scaleSettings.length > 0) {
        scaleSettings.forEach(scale => {
          console.log(`      ID: ${scale.id}`);
          console.log(`      最小値: ${scale.min_value || 'null'}`);
          console.log(`      最大値: ${scale.max_value || 'null'}`);
          console.log(`      最小ラベル: "${scale.min_label || 'null'}"`);
          console.log(`      最大ラベル: "${scale.max_label || 'null'}"`);
          console.log(`      ステップ: ${scale.step_value || 'null'}`);
          console.log(`      作成日: ${scale.created_at}`);
        });
      } else {
        console.log('      設定なし');
      }

      // 4. 選択肢設定も確認（念のため）
      const { data: choices, error: choiceError } = await supabase
        .from('question_option_choices')
        .select('*')
        .eq('review_questions_id', question.id);

      if (!choiceError && choices && choices.length > 0) {
        console.log('   🔘 選択肢設定（予期しない）:');
        choices.forEach(choice => {
          console.log(`      ${choice.choice_number}: "${choice.choice_name}"`);
        });
      }

      console.log('');
    }

    // 5. question_option_linear_scaleテーブルの全構造確認
    console.log('🗃️ question_option_linear_scaleテーブル構造:');
    const { data: allScales, error: allScalesError } = await supabase
      .from('question_option_linear_scale')
      .select('*')
      .limit(1);

    if (allScalesError) {
      console.log(`   エラー: ${allScalesError.message}`);
    } else if (allScales && allScales.length > 0) {
      console.log(`   カラム: ${Object.keys(allScales[0]).join(', ')}`);
      console.log('   サンプルデータ:');
      Object.entries(allScales[0]).forEach(([key, value]) => {
        console.log(`      ${key}: ${value}`);
      });
    } else {
      console.log('   データなし');
    }

    // 6. 全体統計
    console.log('\n📊 統計情報:');
    const { count: totalScales } = await supabase
      .from('question_option_linear_scale')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   リニアスケール設定総数: ${totalScales}件`);

  } catch (error) {
    console.error('調査エラー:', error);
  }
}

// 実行
checkType9Registration().then(() => {
  console.log('\n✅ 質問タイプ9調査完了');
  process.exit(0);
});