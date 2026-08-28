// Supabaseのテーブル情報を確認するスクリプト
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .envファイルを読み込み
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('🔍 Supabaseのテーブルを確認中...\n');
  console.log('📡 接続先:', supabaseUrl, '\n');

  try {
    // publicスキーマのテーブル一覧を取得
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list');

    if (tablesError) {
      console.log('⚠️ RPCが使えないため、既知のテーブルを確認します\n');

      // 既知のテーブルを順番にチェック
      const knownTables = [
        'business_users',
        'companies',
        'company_memberships',
        'stores',
        'store_memberships',
        'store_invitations',
        'review_forms',
        'shift',
        'partner_companies',
        'partner_company_memberships',
        'company_invitations'
      ];

      console.log('📊 テーブル確認結果:\n');

      for (const tableName of knownTables) {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (error.code === '42P01') {
            console.log(`❌ ${tableName.padEnd(30)} - テーブルが存在しません`);
          } else if (error.code === '42501') {
            console.log(`⚠️  ${tableName.padEnd(30)} - 権限がありません（テーブルは存在）`);
          } else {
            console.log(`❓ ${tableName.padEnd(30)} - エラー: ${error.message}`);
          }
        } else {
          console.log(`✅ ${tableName.padEnd(30)} - ${count !== null ? count + '件のレコード' : '存在します'}`);
        }
      }
    } else {
      console.log('✅ テーブル一覧:', tables);
    }

    // 各テーブルのカラム情報を確認（company_memberships）
    console.log('\n\n📋 company_memberships テーブルの詳細:\n');
    const { data: companyMemberships, error: cmError } = await supabase
      .from('company_memberships')
      .select('*')
      .limit(1);

    if (!cmError && companyMemberships && companyMemberships.length > 0) {
      const columns = Object.keys(companyMemberships[0]);
      console.log('カラム:', columns.join(', '));
      console.log('サンプルデータ:', companyMemberships[0]);
    } else if (cmError) {
      console.log('エラー:', cmError.message);
    } else {
      console.log('レコードがありません');
    }

    // 各テーブルのカラム情報を確認（stores）
    console.log('\n\n📋 stores テーブルの詳細:\n');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(1);

    if (!storesError && stores && stores.length > 0) {
      const columns = Object.keys(stores[0]);
      console.log('カラム:', columns.join(', '));
      console.log('サンプルデータ:', stores[0]);
    } else if (storesError) {
      console.log('エラー:', storesError.message);
    } else {
      console.log('レコードがありません');
    }

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

checkTables();
