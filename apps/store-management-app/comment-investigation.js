// コメント未読数問題調査スクリプト
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 環境変数を読み込み
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase環境変数が不足しています')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 コメント未読数問題の調査を開始します...')

async function investigateCommentIssues() {
  try {
    // 1. 認証状態の確認
    console.log('\n📊 === 認証状態確認 ===')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('👤 現在のユーザー:', user?.id || 'ログインしていません')
    
    if (!user) {
      console.log('❌ ログインが必要です。ログインしてから再実行してください。')
      return
    }

    // 2. comment_page_view_logテーブルの存在確認
    console.log('\n📊 === comment_page_view_logテーブル調査 ===')
    
    // テーブルアクセステスト
    const { data: viewLogData, error: viewLogError } = await supabase
      .from('comment_page_view_log')
      .select('*')
      .limit(1)
    
    if (viewLogError) {
      console.error('❌ comment_page_view_logテーブルエラー:', viewLogError.message)
      console.log('📝 可能な原因:')
      console.log('   - テーブルが存在しない')
      console.log('   - RLSポリシーによりアクセス拒否')
      console.log('   - 権限不足')
      
      // テーブル存在確認のための情報スキーマクエリ
      console.log('\n🔍 テーブル存在確認を実行中...')
      const { data: tableExists, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'comment_page_view_log')
      
      if (schemaError) {
        console.log('❌ 情報スキーマアクセスエラー:', schemaError.message)
      } else if (tableExists && tableExists.length > 0) {
        console.log('✅ comment_page_view_logテーブルは存在します（RLSまたは権限の問題）')
      } else {
        console.log('❌ comment_page_view_logテーブルが存在しません')
      }
    } else {
      console.log('✅ comment_page_view_logテーブルアクセス成功')
      console.log('📋 サンプルデータ:', viewLogData)
      
      if (viewLogData && viewLogData.length > 0) {
        const columns = Object.keys(viewLogData[0])
        console.log('📋 テーブル構造:', columns)
      }
    }

    // 3. question_answer_textsテーブルの確認
    console.log('\n📊 === question_answer_textsテーブル調査 ===')
    
    const { data: textData, error: textError } = await supabase
      .from('question_answer_texts')
      .select('*')
      .limit(3)
    
    if (textError) {
      console.error('❌ question_answer_textsエラー:', textError.message)
    } else {
      console.log('✅ question_answer_textsアクセス成功')
      console.log('📋 レコード数（サンプル）:', textData?.length || 0)
      if (textData && textData.length > 0) {
        console.log('📋 テーブル構造:', Object.keys(textData[0]))
        console.log('📋 サンプルデータ:', textData[0])
      }
    }

    // 4. review_question_answersテーブルの確認
    console.log('\n📊 === review_question_answersテーブル調査 ===')
    
    const { data: answerData, error: answerError } = await supabase
      .from('review_question_answers')
      .select('*')
      .limit(3)
    
    if (answerError) {
      console.error('❌ review_question_answersエラー:', answerError.message)
    } else {
      console.log('✅ review_question_answersアクセス成功')
      console.log('📋 レコード数（サンプル）:', answerData?.length || 0)
      if (answerData && answerData.length > 0) {
        console.log('📋 テーブル構造:', Object.keys(answerData[0]))
      }
    }

    // 5. question_display_settingsテーブルの確認
    console.log('\n📊 === question_display_settingsテーブル調査 ===')
    
    const { data: displayData, error: displayError } = await supabase
      .from('question_display_settings')
      .select('*')
      .limit(10)
    
    if (displayError) {
      console.error('❌ question_display_settingsエラー:', displayError.message)
    } else {
      console.log('✅ question_display_settingsアクセス成功')
      console.log('📋 レコード数:', displayData?.length || 0)
      if (displayData && displayData.length > 0) {
        console.log('📋 テーブル構造:', Object.keys(displayData[0]))
        console.log('📋 設定一覧:')
        displayData.forEach((setting, index) => {
          console.log(`   ${index + 1}. ID: ${setting.review_question_id}, タイプ: ${setting.display_type}, 名前: ${setting.display_name}`)
        })
        
        // コメント用の設定があるかチェック
        const commentSettings = displayData.filter(s => s.display_type === 'comment')
        console.log(`📋 コメント用設定: ${commentSettings.length}件`)
      }
    }

    // 6. RLSポリシーの確認
    console.log('\n📊 === RLSポリシー調査 ===')
    
    const tables = ['comment_page_view_log', 'question_answer_texts', 'review_question_answers', 'question_display_settings']
    
    for (const tableName of tables) {
      console.log(`\n🔍 ${tableName}のRLS状態:`)
      
      // テーブルのRLS状態確認
      const { data: rlsStatus, error: rlsError } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('schemaname', 'public')
        .eq('tablename', tableName)
      
      if (!rlsError && rlsStatus && rlsStatus.length > 0) {
        console.log(`   RLS有効: ${rlsStatus[0].rowsecurity ? 'YES' : 'NO'}`)
      } else {
        console.log(`   RLS状態確認失敗: ${rlsError?.message || 'テーブル不明'}`)
      }
      
      // ポリシー一覧確認
      const { data: policies, error: policyError } = await supabase
        .from('pg_policies')
        .select('policyname, cmd, qual')
        .eq('schemaname', 'public')
        .eq('tablename', tableName)
      
      if (!policyError && policies) {
        console.log(`   ポリシー数: ${policies.length}`)
        policies.forEach(policy => {
          console.log(`     - ${policy.policyname} (${policy.cmd})`)
        })
      } else {
        console.log(`   ポリシー確認失敗: ${policyError?.message || '不明'}`)
      }
    }

    // 7. 現在のユーザーの店舗権限確認
    console.log('\n📊 === ユーザー店舗権限確認 ===')
    
    const { data: userStores, error: storeError } = await supabase
      .from('store_memberships')
      .select(`
        store_id,
        role,
        stores (
          id,
          name
        )
      `)
      .eq('business_user_id', user.id)
    
    if (storeError) {
      console.error('❌ 店舗権限確認エラー:', storeError.message)
    } else {
      console.log('✅ 店舗権限確認成功')
      console.log('📋 アクセス可能店舗数:', userStores?.length || 0)
      userStores?.forEach((membership, index) => {
        console.log(`   ${index + 1}. 店舗ID: ${membership.store_id}, 名前: ${membership.stores?.name || 'N/A'}, 役割: ${membership.role}`)
      })
    }

    // 8. useUnreadCommentCount.jsで使用されるクエリのテスト
    console.log('\n📊 === useUnreadCommentCountクエリテスト ===')
    
    if (userStores && userStores.length > 0) {
      const testStoreId = userStores[0].store_id
      console.log(`🧪 店舗ID ${testStoreId} でテスト実行`)
      
      // comment_page_view_logクエリテスト
      const { data: lastViewTest, error: lastViewError } = await supabase
        .from('comment_page_view_log')
        .select('last_login_at')
        .eq('business_user_id', user.id)
        .limit(1)
      
      console.log('🧪 comment_page_view_logクエリ結果:', {
        success: !lastViewError,
        error: lastViewError?.message,
        data: lastViewTest
      })
      
      // question_answer_textsクエリテスト
      const { data: commentsTest, error: commentsError } = await supabase
        .from('question_answer_texts')
        .select(`
          created_at,
          review_question_answers!inner (
            review_form_submissions_id,
            store_id,
            review_questions!inner (
              question_types_id
            )
          )
        `)
        .eq('review_question_answers.store_id', testStoreId)
        .eq('review_question_answers.review_questions.question_types_id', 10)
        .limit(5)
      
      console.log('🧪 question_answer_textsクエリ結果:', {
        success: !commentsError,
        error: commentsError?.message,
        dataCount: commentsTest?.length || 0
      })
      
      // question_display_settingsクエリテスト
      const { data: displaySettingsTest, error: displaySettingsError } = await supabase
        .from('question_display_settings')
        .select('review_question_id')
        .eq('display_type', 'comment')
      
      console.log('🧪 question_display_settingsクエリ結果:', {
        success: !displaySettingsError,
        error: displaySettingsError?.message,
        dataCount: displaySettingsTest?.length || 0
      })
    }

    // 9. 問題の要約と推奨対応
    console.log('\n📊 === 問題要約と推奨対応 ===')
    
    const issues = []
    
    if (viewLogError) {
      issues.push('comment_page_view_logテーブルへのアクセス不可')
    }
    
    if (textError) {
      issues.push('question_answer_textsテーブルへのアクセス不可')
    }
    
    if (answerError) {
      issues.push('review_question_answersテーブルへのアクセス不可')
    }
    
    if (displayError) {
      issues.push('question_display_settingsテーブルへのアクセス不可')
    }
    
    if (issues.length === 0) {
      console.log('✅ 主要なテーブルアクセスは正常です')
      console.log('📝 次のステップ:')
      console.log('   1. 実際のデータが期待通りに存在するか確認')
      console.log('   2. useUnreadCommentCount.jsのロジック確認')
      console.log('   3. フロントエンドでのエラーハンドリング確認')
    } else {
      console.log('❌ 検出された問題:')
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`)
      })
      
      console.log('\n📝 推奨対応:')
      console.log('   1. comment_page_view_logテーブルの作成とRLSポリシー設定')
      console.log('   2. 各テーブルのRLSポリシー見直し')
      console.log('   3. auth.uid()とbusiness_user_idの整合性確認')
    }

  } catch (error) {
    console.error('❌ 調査中にエラーが発生:', error)
  }
}

// 実行
investigateCommentIssues().then(() => {
  console.log('\n🏁 調査完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ 調査でエラー:', error)
  process.exit(1)
})