console.log('🔍 修正後も書き込まれない原因分析\n');

console.log('📊 考えられる原因:\n');

console.log('1. 🚀 Edge Function のデプロイ状況');
console.log('   ❓ 修正したコードがSupabaseにデプロイされていない可能性');
console.log('   → ローカルの修正がリモートに反映されていない');
console.log('   → supabase functions deploy lottery が必要');
console.log('');

console.log('2. 🔐 Row Level Security (RLS) ポリシー');
console.log('   ❌ question_answer_option_linear_scale テーブルのRLSが厳しい');
console.log('   → 以前のテストでRLSポリシー違反エラーが発生');
console.log('   → サービスロールでも書き込み権限がない可能性');
console.log('');

console.log('3. 🔑 外部キー制約エラー');
console.log('   ❓ review_question_answers_id の参照先が存在しない');
console.log('   → review_question_answers テーブルへの書き込みが先に失敗');
console.log('   → その結果、参照キーが存在せずLinear Scale回答も失敗');
console.log('');

console.log('4. 🎯 質問タイプ判定の問題');
console.log('   ❓ フロントエンドから送信されるquestionTypeIdが正しくない');
console.log('   → LinearScaleQuestion.js で questionTypeId の設定確認が必要');
console.log('   → case 7, 9 に到達していない可能性');
console.log('');

console.log('5. 📝 Edge Function のエラーハンドリング');
console.log('   ❓ エラーが発生しても例外として表面化していない');
console.log('   → try-catch で捕捉されてログに出力されていない');
console.log('   → 実際のエラー内容が不明');
console.log('');

console.log('6. 🗃️ テーブル構造の再確認');
console.log('   ❓ 実際のテーブル構造が想定と異なる可能性');
console.log('   → answer_number 以外のカラム名が正しい可能性');
console.log('   → NOT NULL制約などの追加条件');
console.log('');

console.log('📋 優先度順の調査項目:\n');

console.log('🔴 最優先 - Edge Function デプロイ状況');
console.log('   supabase functions list');
console.log('   supabase functions deploy lottery');
console.log('');

console.log('🟡 中優先 - RLSポリシー確認');
console.log('   question_answer_option_linear_scale テーブルのポリシー');
console.log('   INSERT権限の確認');
console.log('');

console.log('🟡 中優先 - 実際のエラーログ確認');
console.log('   Edge Function の実行ログをSupabaseダッシュボードで確認');
console.log('   console.log でデバッグ情報を追加');
console.log('');

console.log('🟢 低優先 - フロントエンドのデータ送信確認');
console.log('   questionTypeId の値が正しく送信されているか');
console.log('   ブラウザの開発者ツールでリクエスト内容を確認');

console.log('\n💡 推定される最も可能性の高い原因:');
console.log('Edge Function の修正がSupabaseにデプロイされていない');
console.log('ローカルの修正のみで、実際の実行環境では古いコードが動作している');

console.log('\n✅ 調査分析完了');
process.exit(0);