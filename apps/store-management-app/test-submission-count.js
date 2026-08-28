// review_form_submissions の回答数取得テスト
// ブラウザのコンソールで実行

const testSubmissionCount = {
  
  // 1. 基本的なテーブルアクセステスト
  async testTableAccess() {
    console.log('🔍 === review_form_submissions テーブルアクセステスト ===')
    
    try {
      // RLS適用後の基本アクセス
      const { data, error, count } = await supabase
        .from('review_form_submissions')
        .select('*', { count: 'exact' })
        .limit(5)
      
      if (error) {
        console.error('❌ テーブルアクセスエラー:', error.message)
        return false
      }
      
      console.log('✅ テーブルアクセス成功')
      console.log(`📊 総件数: ${count} 件`)
      console.log('📋 サンプルデータ:', data)
      
      // データ構造の確認
      if (data && data.length > 0) {
        const sample = data[0]
        console.log('📋 データ構造:')
        console.log('  ID:', sample.id)
        console.log('  作成日時:', sample.created_at)
        console.log('  フォームID:', sample.review_forms_id)
        console.log('  ユーザー:', sample.users)
        console.log('  店舗ID:', sample.store_id)
      }
      
      return true
      
    } catch (error) {
      console.error('❌ テーブルアクセス例外:', error)
      return false
    }
  },
  
  // 2. RPC関数のテスト
  async testRPCFunctions() {
    console.log('🔍 === RPC関数テスト ===')
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      console.log('📅 テスト対象日付:')
      console.log('  今日:', today)
      console.log('  昨日:', yesterday)
      
      // 今日の回答数
      console.log('📋 今日の回答数取得テスト...')
      const { data: todayCount, error: todayError } = await supabase
        .rpc('get_daily_submission_count', {
          target_date: today
        })
      
      if (todayError) {
        console.error('❌ 今日の回答数取得エラー:', todayError.message)
      } else {
        console.log('✅ 今日の回答数:', todayCount)
      }
      
      // 昨日の回答数
      console.log('📋 昨日の回答数取得テスト...')
      const { data: yesterdayCount, error: yesterdayError } = await supabase
        .rpc('get_daily_submission_count', {
          target_date: yesterday
        })
      
      if (yesterdayError) {
        console.error('❌ 昨日の回答数取得エラー:', yesterdayError.message)
      } else {
        console.log('✅ 昨日の回答数:', yesterdayCount)
      }
      
      // 過去1週間のデータ
      console.log('📋 過去1週間のデータ取得テスト...')
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const { data: weeklyData, error: weeklyError } = await supabase
        .rpc('get_submission_count_by_date_range', {
          start_date: weekAgo,
          end_date: today
        })
      
      if (weeklyError) {
        console.error('❌ 週間データ取得エラー:', weeklyError.message)
      } else {
        console.log('✅ 週間データ取得成功:', weeklyData)
        console.log(`📊 期間内データ: ${weeklyData?.length || 0} 日分`)
      }
      
      return {
        todayCount: todayCount || 0,
        yesterdayCount: yesterdayCount || 0,
        weeklyData: weeklyData || []
      }
      
    } catch (error) {
      console.error('❌ RPC関数テスト例外:', error)
      return null
    }
  },
  
  // 3. 日付別クエリテスト
  async testDateFiltering() {
    console.log('🔍 === 日付別フィルタリングテスト ===')
    
    try {
      const testDate = new Date()
      testDate.setHours(0, 0, 0, 0)
      
      const startOfDay = new Date(testDate)
      const endOfDay = new Date(testDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      console.log('📅 フィルタ条件:')
      console.log('  開始:', startOfDay.toISOString())
      console.log('  終了:', endOfDay.toISOString())
      
      // 直接クエリで日付フィルタリング
      const { data, error, count } = await supabase
        .from('review_form_submissions')
        .select('id, created_at, store_id', { count: 'exact' })
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ 日付フィルタリングエラー:', error.message)
        return false
      }
      
      console.log('✅ 日付フィルタリング成功')
      console.log(`📊 本日の回答数: ${count} 件`)
      
      if (data && data.length > 0) {
        console.log('📋 本日のデータサンプル:')
        data.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. 作成日時: ${item.created_at}, 店舗: ${item.store_id}`)
        })
      }
      
      return count
      
    } catch (error) {
      console.error('❌ 日付フィルタリング例外:', error)
      return 0
    }
  },
  
  // 4. 店舗別フィルタリングテスト
  async testStoreFiltering() {
    console.log('🔍 === 店舗別フィルタリングテスト ===')
    
    try {
      // 利用可能な店舗IDを取得
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .limit(3)
      
      if (storesError) {
        console.error('❌ 店舗データ取得エラー:', storesError.message)
        return
      }
      
      if (!stores || stores.length === 0) {
        console.log('⚠️ アクセス可能な店舗がありません')
        return
      }
      
      console.log(`📊 テスト対象店舗: ${stores.length} 件`)
      
      for (const store of stores) {
        console.log(`📋 店舗「${store.name || store.id}」の回答数確認...`)
        
        const { data, error, count } = await supabase
          .from('review_form_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', store.id)
        
        if (error) {
          console.log(`  ❌ エラー: ${error.message}`)
        } else {
          console.log(`  ✅ 回答数: ${count} 件`)
        }
      }
      
    } catch (error) {
      console.error('❌ 店舗別フィルタリング例外:', error)
    }
  },
  
  // 5. カスタムフックのシミュレーション
  async simulateCustomHook() {
    console.log('🔍 === カスタムフック動作シミュレーション ===')
    
    const selectedDate = new Date()
    console.log('📅 選択日付:', selectedDate.toISOString().split('T')[0])
    
    try {
      // フック内の処理をシミュレート
      const dateString = selectedDate.toISOString().split('T')[0]
      
      // まずRPC関数を試行
      console.log('📋 RPC関数で回答数取得中...')
      let submissionCount = 0
      
      try {
        const { data: rpcCount, error: rpcError } = await supabase
          .rpc('get_daily_submission_count', {
            target_date: dateString
          })
        
        if (rpcError) {
          throw rpcError
        }
        
        submissionCount = rpcCount || 0
        console.log('✅ RPC関数成功:', submissionCount)
        
      } catch (rpcError) {
        console.log('⚠️ RPC関数失敗、直接クエリに切り替え:', rpcError.message)
        
        // 直接クエリにフォールバック
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)
        
        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)
        
        const { count, error: directError } = await supabase
          .from('review_form_submissions')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString())
        
        if (directError) {
          throw directError
        }
        
        submissionCount = count || 0
        console.log('✅ 直接クエリ成功:', submissionCount)
      }
      
      console.log(`🎯 最終結果: ${submissionCount} 件`)
      return submissionCount
      
    } catch (error) {
      console.error('❌ シミュレーションエラー:', error)
      return 0
    }
  },
  
  // 6. 包括的テスト実行
  async runComprehensiveTest() {
    console.log('🚀 === review_form_submissions 包括テスト開始 ===')
    
    const tableAccess = await this.testTableAccess()
    if (!tableAccess) {
      console.log('❌ テーブルアクセスに失敗しました。テストを中止します。')
      return
    }
    
    const rpcResults = await this.testRPCFunctions()
    const dateFilterCount = await this.testDateFiltering()
    await this.testStoreFiltering()
    const hookSimulation = await this.simulateCustomHook()
    
    console.log('\n📋 === テスト結果サマリー ===')
    console.log('✅ テーブルアクセス: 正常')
    console.log(`✅ RPC関数: ${rpcResults ? '動作' : '失敗'}`)
    console.log(`✅ 日付フィルタ: ${dateFilterCount} 件`)
    console.log(`✅ フック動作: ${hookSimulation} 件`)
    
    if (rpcResults) {
      console.log('\n📊 詳細データ:')
      console.log(`  今日の回答数: ${rpcResults.todayCount}`)
      console.log(`  昨日の回答数: ${rpcResults.yesterdayCount}`)
      console.log(`  週間データ: ${rpcResults.weeklyData.length} 日分`)
    }
    
    console.log('\n🎯 実装ステータス:')
    if (tableAccess && hookSimulation >= 0) {
      console.log('🎉 回答数表示機能の実装準備完了！')
    } else {
      console.log('⚠️ 一部機能に問題があります。RLSポリシーまたはデータを確認してください。')
    }
    
    return {
      tableAccess,
      rpcResults,
      dateFilterCount,
      hookSimulation
    }
  }
}

// 簡易テスト
const quickSubmissionTest = async () => {
  console.log('⚡ クイック回答数テスト')
  
  try {
    const { data, error, count } = await supabase
      .from('review_form_submissions')
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

console.log('🚀 review_form_submissions テストツールが読み込まれました')
console.log('使用方法:')
console.log('  testSubmissionCount.runComprehensiveTest() - 包括的テスト')
console.log('  quickSubmissionTest() - 簡易テスト')
console.log('  testSubmissionCount.simulateCustomHook() - フック動作確認')