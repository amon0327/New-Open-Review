console.log('🔍 質問タイプ7,9だけが保存されない問題の詳細分析\n');

console.log('📊 新しい状況認識:');
console.log('   ✅ テキスト回答: 正常に保存される');
console.log('   ✅ 選択肢回答: 正常に保存される');
console.log('   ❌ リニアスケール回答 (タイプ7,9): 保存されない');
console.log('');

console.log('💡 これにより問題が大幅に絞り込まれました:\n');

console.log('🎯 考えられる原因:\n');

console.log('1. 🔐 question_answer_option_linear_scale テーブル特有のRLSポリシー');
console.log('   - 他のテーブルは書き込み可能');
console.log('   - このテーブルだけ厳しい制限がある可能性');
console.log('   - サービスロールでも制限されている');
console.log('');

console.log('2. 📊 データ型の問題 (bigint vs integer)');
console.log('   - Edge Function: parseInt((answerData as any).answer)');
console.log('   - テーブル: answer_number bigint');
console.log('   - parseInt() は number を返すが、bigint 型に適合しない可能性');
console.log('');

console.log('3. 🚀 Edge Function デプロイの部分的な問題');
console.log('   - 他の部分は古いコードで動作');
console.log('   - case 7, 9 の部分だけ新しいコードが反映されていない');
console.log('   - キャッシュの問題');
console.log('');

console.log('4. 🔍 case 7, 9 処理内でのエラー発生');
console.log('   - try-catch で捕捉されてスキップされている');
console.log('   - 他の処理は継続するため、一部だけ失敗');
console.log('   - エラーログに記録されていない');
console.log('');

console.log('5. 🔑 外部キー制約やユニーク制約');
console.log('   - question_answer_option_linear_scale テーブル特有の制約');
console.log('   - 重複データの制約');
console.log('   - NULL制約の問題');
console.log('');

console.log('📋 実際のテーブル構造再確認:');
console.log('   CREATE TABLE question_answer_option_linear_scale (');
console.log('     id uuid PRIMARY KEY,');
console.log('     created_at timestamp NOT NULL DEFAULT now(),');
console.log('     review_question_answers_id uuid NULL,  ← FK制約');
console.log('     answer_number bigint NULL             ← bigint型');
console.log('   );');
console.log('');

console.log('💻 Edge Function での処理:');
console.log('   case 7:');
console.log('   case 9:');
console.log('     .from("question_answer_option_linear_scale")');
console.log('     .insert([{');
console.log('       review_question_answers_id: questionAnswerId,');
console.log('       answer_number: parseInt((answerData as any).answer)  ← number型');
console.log('     }])');
console.log('');

console.log('🚨 最も可能性の高い原因:\n');

console.log('🔴 RLS ポリシーの問題 (90%の可能性)');
console.log('   - question_answer_option_linear_scale テーブルだけ');
console.log('   - INSERT権限が制限されている');
console.log('   - 他のテーブルは許可されているがこのテーブルだけNG');
console.log('');

console.log('🟡 データ型変換の問題 (60%の可能性)');
console.log('   - parseInt() → number型');
console.log('   - bigint型への自動変換が失敗');
console.log('   - PostgreSQLのbigint型の制約');
console.log('');

console.log('🔧 調査・解決手順:\n');

console.log('1️⃣ 最優先: RLSポリシー確認');
console.log('   - Supabaseダッシュボードでテーブルのポリシーを確認');
console.log('   - INSERT権限の設定を他のテーブルと比較');
console.log('');

console.log('2️⃣ 高優先: データ型の検証');
console.log('   - 実際にINSERTテストを実行');
console.log('   - number型からbigint型への変換を確認');
console.log('   - BigInt()関数の使用を検討');
console.log('');

console.log('3️⃣ 中優先: Edge Function ログ確認');
console.log('   - case 7, 9 の処理でエラーが発生していないか');
console.log('   - スキップされていないか');
console.log('');

console.log('🎯 推奨される修正案:');
console.log('');
console.log('A) データ型を明示的に変換:');
console.log('   answer_number: BigInt(parseInt((answerData as any).answer))');
console.log('');
console.log('B) RLSポリシーの修正:');
console.log('   question_answer_option_linear_scale テーブルのINSERT権限を');
console.log('   他のテーブルと同等に設定');

console.log('\n✅ 分析完了');
process.exit(0);