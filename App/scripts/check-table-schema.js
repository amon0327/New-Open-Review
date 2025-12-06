// Supabaseのテーブルスキーマを詳細確認するスクリプト
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getTableSchema(tableName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 ${tableName} テーブルの詳細`);
  console.log('='.repeat(80));

  try {
    // サンプルレコードを1件取得してカラム情報を確認
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.log(`\n❌ エラー: ${error.message}`);
      console.log(`   コード: ${error.code}`);
      return;
    }

    console.log(`\n📊 レコード数: ${count}件`);

    if (data && data.length > 0) {
      console.log('\n📝 カラム一覧:');
      const columns = Object.keys(data[0]);
      columns.forEach((col, index) => {
        const value = data[0][col];
        const type = value === null ? 'null' : typeof value;
        console.log(`   ${(index + 1).toString().padStart(2)}. ${col.padEnd(30)} (型: ${type})`);
      });

      console.log('\n📄 サンプルデータ (最大5件):');
      data.forEach((record, index) => {
        console.log(`\n   --- レコード ${index + 1} ---`);
        Object.entries(record).forEach(([key, value]) => {
          let displayValue = value;
          if (value === null) {
            displayValue = 'NULL';
          } else if (typeof value === 'string' && value.length > 50) {
            displayValue = value.substring(0, 50) + '...';
          } else if (typeof value === 'object') {
            displayValue = JSON.stringify(value);
          }
          console.log(`   ${key.padEnd(30)}: ${displayValue}`);
        });
      });
    } else {
      console.log('\n⚠️ テーブルは存在しますが、レコードがありません');
      console.log('\n💡 テーブル構造を推測するため、INSERTを試みます（実際には実行しません）');
    }

  } catch (error) {
    console.error(`\n❌ 予期しないエラー:`, error.message);
  }
}

async function main() {
  console.log('🔍 Supabaseテーブルスキーマ確認ツール');
  console.log(`📡 接続先: ${supabaseUrl}\n`);

  const tablesToCheck = [
    'partner_companies',
    'partner_company_memberships',
    'company_invitations',
    'companies',
    'company_memberships',
    'stores',
    'store_memberships',
    'store_invitations'
  ];

  for (const table of tablesToCheck) {
    await getTableSchema(table);
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('✅ 確認完了');
  console.log('='.repeat(80));
}

main();
