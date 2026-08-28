import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('環境変数チェック:');
console.log('REACT_APP_SUPABASE_URL:', !!process.env.REACT_APP_SUPABASE_URL);
console.log('REACT_APP_SUPABASE_ANON_KEY:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function discoverSchema(tableName) {
  console.log(`\n📋 ${tableName} テーブルのスキーマ推測:`);
  console.log('='.repeat(80));

  // 空のオブジェクトで挿入を試みる（エラーメッセージから必須カラムを推測）
  const { data, error } = await supabase
    .from(tableName)
    .insert([{}])
    .select();

  if (error) {
    console.log(`❌ 挿入エラー（期待通り）:`);
    console.log(`   ${error.message}`);

    // NOT NULL制約のカラムを抽出
    const nullMatches = error.message.matchAll(/null value in column "(\w+)"/g);
    const requiredColumns = [...nullMatches].map(m => m[1]);

    if (requiredColumns.length > 0) {
      console.log(`\n   → 必須カラム (NOT NULL):`);
      requiredColumns.forEach(col => console.log(`      - ${col}`));
    }

    // 外部キー制約のエラーを確認
    if (error.message.includes('foreign key')) {
      console.log(`\n   → 外部キー制約あり`);
    }

    // デフォルト値が設定されているカラムは見つからない
  } else if (data) {
    console.log(`✅ 挿入成功（デフォルト値で作成されました）:`);
    console.log(JSON.stringify(data[0], null, 2));

    // 作成されたレコードを削除
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('id', data[0].id);

    if (!deleteError) {
      console.log(`   → テストデータを削除しました`);
    }
  }
}

async function main() {
  console.log('\n🔍 Partner関連テーブルのスキーマを推測中...\n');

  const tables = [
    'partner_companies',
    'partner_company_memberships',
    'company_invitations'
  ];

  for (const table of tables) {
    await discoverSchema(table);
  }

  console.log('\n✅ 確認完了');
}

main();
