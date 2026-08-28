import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTableSchema(tableName) {
  console.log(`\n📋 ${tableName} テーブルのスキーマ:`);
  console.log('='.repeat(80));

  // PostgreSQLのinformation_schemaから直接カラム情報を取得
  const { data, error } = await supabase.rpc('get_table_columns', {
    table_name_param: tableName
  });

  if (error) {
    console.log(`⚠️  RPCエラー: ${error.message}`);
    console.log('   代替方法でスキーマを取得します...\n');

    // 代替方法：実際にテーブルにダミーデータを作成しようとしてエラーメッセージからスキーマを推測
    const { error: insertError } = await supabase
      .from(tableName)
      .insert([{}]);

    if (insertError) {
      console.log(`   エラーメッセージ: ${insertError.message}`);

      // エラーメッセージからカラム情報を抽出
      if (insertError.message.includes('null value in column')) {
        const match = insertError.message.match(/null value in column "(\w+)"/);
        if (match) {
          console.log(`   → 必須カラム: ${match[1]}`);
        }
      }
    }
    return;
  }

  console.log('✅ カラム一覧:');
  if (data && data.length > 0) {
    data.forEach((col, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? '(NULL可)' : '(NOT NULL)'}`);
    });
  } else {
    console.log('   カラム情報が取得できませんでした');
  }
}

async function main() {
  console.log('🔍 Partner関連テーブルのスキーマを確認中...\n');

  const tables = [
    'partner_companies',
    'partner_company_memberships',
    'company_invitations',
    'companies',
    'company_memberships',
    'stores',
    'store_memberships',
    'store_invitations'
  ];

  for (const table of tables) {
    await getTableSchema(table);
  }

  console.log('\n✅ 確認完了');
}

main();
