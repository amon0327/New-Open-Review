// Supabaseのすべてのテーブルを確認するスクリプト（PostgreSQLメタデータを使用）
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ REACT_APP_SUPABASE_URLが設定されていません');
  process.exit(1);
}

console.log('🔍 Supabaseの全テーブルを確認中...');
console.log(`📡 接続先: ${supabaseUrl}\n`);

// まず通常のクライアントで試す
const supabaseAnon = createClient(
  supabaseUrl,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function listTablesWithQuery() {
  console.log('\n📋 方法1: PostgreSQLメタデータクエリで取得\n');

  // information_schemaを使ってテーブル一覧を取得
  const { data, error } = await supabaseAnon
    .from('information_schema.tables')
    .select('table_schema, table_name')
    .eq('table_schema', 'public')
    .order('table_name');

  if (error) {
    console.log('❌ エラー:', error.message);
    console.log('   (information_schemaへのアクセス権限がない可能性があります)\n');
    return null;
  }

  return data;
}

async function listTablesByTrying() {
  console.log('📋 方法2: 各テーブルへのアクセスを試行\n');

  // database_schema.jsonから抽出したテーブル名リスト
  const possibleTables = [
    // public schema
    'business_users',
    'completion_screen_settings',
    'login_screen_settings',
    'plan_categories',
    'question_answer_option_choices',
    'question_answer_option_linear_scale',
    'question_answer_texts',
    'question_categories',
    'question_option_choices',
    'question_option_linear_scale',
    'question_screen_settings',
    'question_subcategories',
    'question_types',
    'review_form_pages',
    'review_form_settings',
    'review_form_submissions',
    'review_forms',
    'review_question_answers',
    'review_questions',
    'template_question_option_choices',
    'template_question_option_linear_scale',
    'template_review_questions',
    'users',
    // Store management tables
    'companies',
    'company_memberships',
    'stores',
    'store_memberships',
    'store_invitations',
    'shift',
    'company_review_forms',
    'store_review_forms',
    'question_display_settings',
    'question_display_rule_settings',
    // Partner tables (確認用)
    'partner_companies',
    'partner_company_memberships',
    'company_invitations'
  ];

  const results = {
    exists: [],
    notExists: [],
    noPermission: []
  };

  for (const tableName of possibleTables) {
    const { data, error, count } = await supabaseAnon
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        results.notExists.push(tableName);
      } else if (error.code === '42501') {
        results.noPermission.push(tableName);
      } else {
        console.log(`   ❓ ${tableName}: ${error.message}`);
      }
    } else {
      results.exists.push({ name: tableName, count });
    }
  }

  return results;
}

async function main() {
  // 方法1を試す
  const metaTables = await listTablesWithQuery();

  if (metaTables) {
    console.log(`✅ ${metaTables.length}個のテーブルが見つかりました:\n`);
    metaTables.forEach((table, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${table.table_name}`);
    });
  }

  // 方法2を試す
  const results = await listTablesByTrying();

  console.log('\n' + '='.repeat(80));
  console.log('📊 テーブル確認結果サマリー');
  console.log('='.repeat(80));

  console.log(`\n✅ 存在するテーブル (${results.exists.length}個):\n`);
  results.exists.forEach((table, index) => {
    const countText = table.count !== null ? `${table.count}件` : 'N/A';
    console.log(`   ${(index + 1).toString().padStart(2)}. ${table.name.padEnd(40)} [${countText}]`);
  });

  if (results.noPermission.length > 0) {
    console.log(`\n⚠️  権限がないテーブル (${results.noPermission.length}個):\n`);
    results.noPermission.forEach((table, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${table}`);
    });
  }

  if (results.notExists.length > 0) {
    console.log(`\n❌ 存在しないテーブル (${results.notExists.length}個):\n`);
    results.notExists.forEach((table, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${table}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ 確認完了');
  console.log('='.repeat(80));
}

main();
