import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkTable(tableName) {
  console.log(`\n📋 ${tableName} テーブル構造:`);
  console.log('='.repeat(80));

  // テーブルから1件取得してカラム構造を確認
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    console.log(`❌ エラー: ${error.message}`);
    console.log(`   コード: ${error.code}`);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ カラム一覧:');
    Object.keys(data[0]).forEach((key, index) => {
      const value = data[0][key];
      const type = typeof value;
      console.log(`   ${(index + 1).toString().padStart(2)}. ${key.padEnd(30)} (${type})`);
    });
    console.log(`\n📊 データ例:`);
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('⚠️  テーブルは存在しますが、データが0件です');
    console.log('   (カラム構造を確認するにはデータが必要です)');
  }
}

async function main() {
  console.log('🔍 Partner関連テーブルの構造を確認中...\n');

  await checkTable('partner_companies');
  await checkTable('partner_company_memberships');
  await checkTable('company_invitations');
  await checkTable('companies');
  await checkTable('company_memberships');
  await checkTable('stores');
  await checkTable('store_memberships');

  console.log('\n✅ 確認完了');
}

main();
