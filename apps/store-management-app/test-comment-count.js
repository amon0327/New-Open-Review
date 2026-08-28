// コメント数機能のテストコード
// ブラウザのコンソールで実行

const testCommentCount = {
  
  // 1. 関連テーブルの基本アクセステスト
  async testTableAccess() {
    console.log('🔍 === コメント関連テーブルアクセステスト ===')
    
    const tables = [
      'question_display_settings',
      'review_question_answers',
      'review_questions'
    ]
    
    const results = {}
    
    for (const tableName of tables) {
      try {
        console.log(`📋 ${tableName} テーブルアクセステスト...`)
        
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(3)
        
        if (error) {
          console.log(`  ❌ ${tableName}: ${error.message}`)
          results[tableName] = { success: false, error: error.message }
        } else {
          console.log(`  ✅ ${tableName}: ${count} 件`)
          results[tableName] = { success: true, count, sampleData: data }
          
          // データ構造確認
          if (data && data.length > 0) {
            console.log(`  📋 ${tableName} データ構造:`, Object.keys(data[0]))
          }
        }
        
      } catch (err) {
        console.log(`  ❌ ${tableName}: ${err.message}`)
        results[tableName] = { success: false, error: err.message }
      }
    }
    
    return results
  },
  
  // 2. review_questions テーブル構造の詳細確認
  async checkQuestionStructure() {
    console.log('🔍 === review_questions テーブル構造確認 ===')
    
    try {
      // テーブル構造を確認
      const { data: columns, error: columnsError } = await supabase
        .rpc('sql', { 
          query: `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'review_questions'
            ORDER BY ordinal_position
          `
        })
      
      if (columnsError) {
        console.log('⚠️ テーブル構造確認をスキップ:', columnsError.message)
      } else {
        console.log('📋 review_questions テーブル構造:')
        columns?.forEach(col => {
          console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULL可)' : '(NOT NULL)'}`)
        })
      }
      
      // サンプルデータから質問タイプフィールドを特定
      const { data: sampleData, error: sampleError } = await supabase
        .from('review_questions')
        .select('*')
        .limit(3)
      
      if (!sampleError && sampleData && sampleData.length > 0) {
        console.log('📋 review_questions サンプルデータ:')
        sampleData.forEach((item, index) => {
          console.log(`  サンプル ${index + 1}:`, item)
        })
        
        // 質問タイプフィールドの候補を確認
        const firstItem = sampleData[0]
        const possibleTypeFields = ['question_type', 'type_id', 'question_type_id', 'type']
        const foundTypeFields = possibleTypeFields.filter(field => firstItem.hasOwnProperty(field))
        
        console.log('🎯 質問タイプフィールド候補:', foundTypeFields)
        
        return {
          columns,
          sampleData,
          possibleTypeFields: foundTypeFields
        }
      }
      
    } catch (error) {
      console.error('❌ テーブル構造確認エラー:', error)
      return null
    }
  },
  
  // 3. 質問タイプ1,2の質問を確認
  async checkQuestionTypes() {
    console.log('🔍 === 質問タイプ1,2の確認 ===')
    
    const possibleFields = ['question_type', 'type_id', 'question_type_id', 'type']
    
    for (const field of possibleFields) {
      try {
        console.log(`📋 ${field} フィールドで質問タイプ1,2をチェック...`)
        
        const { data, error } = await supabase
          .from('review_questions')
          .select(`id, ${field}`)
          .in(field, [1, 2])
          .limit(5)
        
        if (!error && data && data.length > 0) {
          console.log(`  ✅ ${field} フィールドで ${data.length} 件発見:`)
          data.forEach(item => {
            console.log(`    ID: ${item.id}, ${field}: ${item[field]}`)
          })
          return { field, data }
        } else if (error) {
          console.log(`  ❌ ${field} フィールドエラー: ${error.message}`)
        } else {
          console.log(`  ⚠️ ${field} フィールドで質問タイプ1,2が見つからず`)
        }
        
      } catch (err) {
        console.log(`  ❌ ${field} フィールド例外: ${err.message}`)
      }
    }
    
    return null
  },
  
  // 4. question_display_settings との連携テスト
  async testQuestionSettings() {
    console.log('🔍 === question_display_settings 連携テスト ===')
    
    try {
      // question_display_settings から review_question_id を取得
      const { data: settings, error: settingsError } = await supabase
        .from('question_display_settings')
        .select('review_question_id, display_name')
        .limit(10)
      
      if (settingsError) {
        console.error('❌ question_display_settings エラー:', settingsError.message)
        return false
      }
      
      console.log(`📊 question_display_settings: ${settings?.length || 0} 件`)
      
      if (settings && settings.length > 0) {
        console.log('📋 設定サンプル:')
        settings.slice(0, 3).forEach((setting, index) => {
          console.log(`  ${index + 1}. 質問ID: ${setting.review_question_id}, 表示名: ${setting.display_name}`)
        })
        
        // これらの質問IDが review_questions に存在するかチェック
        const questionIds = settings.map(s => s.review_question_id).filter(Boolean)
        
        if (questionIds.length > 0) {
          const { data: questions, error: questionsError } = await supabase
            .from('review_questions')
            .select('id')
            .in('id', questionIds.slice(0, 5))
          
          if (!questionsError) {
            console.log(`✅ 関連する review_questions: ${questions?.length || 0} 件確認`)
          }
        }
      }
      
      return settings
      
    } catch (error) {
      console.error('❌ question_display_settings テストエラー:', error)
      return false
    }
  },
  
  // 5. review_question_answers のテスト
  async testQuestionAnswers() {
    console.log('🔍 === review_question_answers テスト ===')
    
    try {
      // 今日の回答データを確認
      const today = new Date().toISOString().split('T')[0]
      
      const { data: todayAnswers, error: todayError } = await supabase
        .from('review_question_answers')
        .select('id, created_at, review_questions_id, store_id')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .limit(10)
      
      if (todayError) {
        console.error('❌ review_question_answers エラー:', todayError.message)
        return false
      }
      
      console.log(`📊 今日の回答: ${todayAnswers?.length || 0} 件`)
      
      if (todayAnswers && todayAnswers.length > 0) {
        console.log('📋 回答サンプル:')
        todayAnswers.slice(0, 3).forEach((answer, index) => {
          console.log(`  ${index + 1}. 質問ID: ${answer.review_questions_id}, 店舗: ${answer.store_id}`)
        })
      }
      
      // 全体の回答数も確認
      const { count: totalCount, error: totalError } = await supabase
        .from('review_question_answers')
        .select('id', { count: 'exact', head: true })
      
      if (!totalError) {
        console.log(`📊 総回答数: ${totalCount} 件`)
      }
      
      return todayAnswers
      
    } catch (error) {
      console.error('❌ review_question_answers テストエラー:', error)
      return false
    }
  },
  
  // 6. 実際のコメント数取得をシミュレート
  async simulateCommentCount() {
    console.log('🔍 === コメント数取得シミュレーション ===')
    
    const today = new Date()
    const dateString = today.toISOString().split('T')[0]
    
    try {
      // ユーザーの店舗を確認
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ ユーザーがログインしていません')
        return 0
      }
      
      // 現在の店舗を確認
      const { data: stores } = await supabase
        .from('stores')
        .select('id, name')
        .limit(1)
      
      if (!stores || stores.length === 0) {
        console.log('❌ アクセス可能な店舗がありません')
        return 0
      }
      
      const targetStoreId = stores[0].id
      console.log(`🏪 対象店舗: ${stores[0].name || targetStoreId}`)
      
      // シンプルな方法でコメント数を取得
      const { count: simpleCount, error: simpleError } = await supabase
        .from('review_question_answers')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', targetStoreId)
        .gte('created_at', `${dateString}T00:00:00`)
        .lte('created_at', `${dateString}T23:59:59`)
      
      if (simpleError) {
        console.error('❌ シンプルカウントエラー:', simpleError.message)
        return 0
      }
      
      console.log(`✅ ${dateString} のコメント数（全質問タイプ）: ${simpleCount} 件`)
      
      // より詳細な分析（質問タイプ別）も試行
      // ただし、実際のテーブル構造がわからないので、エラーが出る可能性がある
      
      return simpleCount || 0
      
    } catch (error) {
      console.error('❌ コメント数シミュレーションエラー:', error)
      return 0
    }
  },
  
  // 7. 包括的テスト実行
  async runComprehensiveTest() {
    console.log('🚀 === コメント数機能包括テスト開始 ===')
    
    const tableAccess = await this.testTableAccess()
    const questionStructure = await this.checkQuestionStructure()
    const questionTypes = await this.checkQuestionTypes()
    const questionSettings = await this.testQuestionSettings()
    const questionAnswers = await this.testQuestionAnswers()
    const commentCount = await this.simulateCommentCount()
    
    console.log('\n📋 === テスト結果サマリー ===')
    
    const accessibleTables = Object.entries(tableAccess).filter(([name, result]) => result.success)
    console.log(`✅ アクセス可能テーブル: ${accessibleTables.length}/3`)
    accessibleTables.forEach(([name, result]) => {
      console.log(`  - ${name}: ${result.count} 件`)
    })
    
    if (questionStructure?.possibleTypeFields?.length > 0) {
      console.log(`✅ 質問タイプフィールド候補: ${questionStructure.possibleTypeFields.join(', ')}`)
    }
    
    if (questionTypes) {
      console.log(`✅ 質問タイプ1,2: ${questionTypes.field} フィールドで ${questionTypes.data.length} 件`)
    }
    
    console.log(`✅ 今日のコメント数: ${commentCount} 件`)
    
    console.log('\n🎯 実装ステータス:')
    if (accessibleTables.length === 3 && commentCount >= 0) {
      console.log('🎉 コメント数機能の基本実装準備完了！')
      if (!questionTypes) {
        console.log('⚠️ 質問タイプフィールドの特定が必要です')
      }
    } else {
      console.log('⚠️ 一部機能に問題があります。RLSポリシーまたはデータを確認してください')
    }
    
    return {
      tableAccess,
      questionStructure,
      questionTypes,
      questionSettings,
      questionAnswers,
      commentCount
    }
  }
}

// 簡易テスト
const quickCommentTest = async () => {
  console.log('⚡ クイックコメント数テスト')
  
  try {
    const { count, error } = await supabase
      .from('review_question_answers')
      .select('id', { count: 'exact', head: true })
    
    if (error) {
      console.log('❌ エラー:', error.message)
    } else {
      console.log(`✅ 総回答数: ${count} 件`)
    }
  } catch (err) {
    console.log('❌ 例外:', err.message)
  }
}

console.log('🚀 コメント数テストツールが読み込まれました')
console.log('使用方法:')
console.log('  testCommentCount.runComprehensiveTest() - 包括的テスト')
console.log('  quickCommentTest() - 簡易テスト')
console.log('  testCommentCount.checkQuestionStructure() - テーブル構造確認')
console.log('  testCommentCount.simulateCommentCount() - コメント数取得テスト')