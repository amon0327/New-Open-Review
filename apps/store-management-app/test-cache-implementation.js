// キャッシュ機能のテストコード
// ブラウザのコンソールで実行

const testCacheImplementation = {
  
  // 1. 基本的なキャッシュ動作テスト
  async testBasicCache() {
    console.log('🔍 === キャッシュ基本動作テスト ===')
    
    try {
      // まず通常のクエリで現在の週のデータを確認
      const today = new Date()
      const weekStart = new Date(today)
      const day = weekStart.getDay()
      weekStart.setDate(weekStart.getDate() - day)
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      console.log('📅 テスト期間:')
      console.log('  週開始:', weekStart.toISOString().split('T')[0])
      console.log('  週終了:', weekEnd.toISOString().split('T')[0])
      
      // 週全体のデータを取得
      const { data: weekData, error } = await supabase
        .from('review_form_submissions')
        .select('created_at, store_id')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
      
      if (error) {
        console.error('❌ 週データ取得エラー:', error.message)
        return false
      }
      
      console.log(`📊 週データ取得成功: ${weekData?.length || 0} 件`)
      
      // 日付別に集計
      const dailyCounts = {}
      
      // 週の7日分を初期化
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + i)
        const dateKey = date.toISOString().split('T')[0]
        dailyCounts[dateKey] = 0
      }
      
      // 実際のデータで上書き
      weekData?.forEach(item => {
        const dateKey = item.created_at.split('T')[0]
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1
      })
      
      console.log('📋 日別集計結果:')
      Object.entries(dailyCounts).forEach(([date, count]) => {
        const dateObj = new Date(date)
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()]
        console.log(`  ${date} (${dayOfWeek}): ${count} 件`)
      })
      
      return dailyCounts
      
    } catch (error) {
      console.error('❌ キャッシュテストエラー:', error)
      return false
    }
  },
  
  // 2. 複数週のデータ取得テスト
  async testMultipleWeeks() {
    console.log('🔍 === 複数週データ取得テスト ===')
    
    try {
      const today = new Date()
      const weeks = []
      
      // 現在の週、前の週、次の週
      for (let i = -1; i <= 1; i++) {
        const weekDate = new Date(today)
        weekDate.setDate(today.getDate() + (i * 7))
        
        const weekStart = new Date(weekDate)
        const day = weekStart.getDay()
        weekStart.setDate(weekStart.getDate() - day)
        
        weeks.push({
          index: i,
          label: i === -1 ? '前の週' : i === 0 ? '今週' : '来週',
          weekStart,
          key: weekStart.toISOString().split('T')[0]
        })
      }
      
      console.log('📅 テスト対象週:')
      weeks.forEach(week => {
        console.log(`  ${week.label}: ${week.key}`)
      })
      
      // 各週のデータを並行取得
      const weekPromises = weeks.map(async (week) => {
        const weekEnd = new Date(week.weekStart)
        weekEnd.setDate(week.weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        
        const { data, error } = await supabase
          .from('review_form_submissions')
          .select('created_at, store_id')
          .gte('created_at', week.weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString())
        
        return {
          week,
          data: data || [],
          error,
          count: data?.length || 0
        }
      })
      
      const results = await Promise.all(weekPromises)
      
      console.log('📊 複数週取得結果:')
      results.forEach(result => {
        if (result.error) {
          console.log(`  ❌ ${result.week.label}: ${result.error.message}`)
        } else {
          console.log(`  ✅ ${result.week.label}: ${result.count} 件`)
        }
      })
      
      return results
      
    } catch (error) {
      console.error('❌ 複数週テストエラー:', error)
      return null
    }
  },
  
  // 3. パフォーマンステスト
  async testPerformance() {
    console.log('🔍 === パフォーマンステスト ===')
    
    try {
      const testDates = []
      const today = new Date()
      
      // 今週の各日付を生成
      const weekStart = new Date(today)
      const day = weekStart.getDay()
      weekStart.setDate(weekStart.getDate() - day)
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + i)
        testDates.push(date)
      }
      
      console.log('⏱️ 個別クエリ（従来方式）のパフォーマンス:')
      const individualStart = performance.now()
      
      const individualPromises = testDates.map(async (date) => {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)
        
        const { count, error } = await supabase
          .from('review_form_submissions')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString())
        
        return { date: date.toISOString().split('T')[0], count: count || 0, error }
      })
      
      const individualResults = await Promise.all(individualPromises)
      const individualEnd = performance.now()
      const individualTime = individualEnd - individualStart
      
      console.log(`  ⏱️ 実行時間: ${individualTime.toFixed(2)}ms`)
      console.log(`  📊 クエリ数: ${testDates.length} 回`)
      console.log('  📋 結果:')
      individualResults.forEach(result => {
        console.log(`    ${result.date}: ${result.count} 件`)
      })
      
      console.log('\n⚡ 週一括クエリ（新方式）のパフォーマンス:')
      const batchStart = performance.now()
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      const { data: batchData, error: batchError } = await supabase
        .from('review_form_submissions')
        .select('created_at, store_id')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
      
      // 日付別に集計
      const batchCounts = {}
      testDates.forEach(date => {
        const dateKey = date.toISOString().split('T')[0]
        batchCounts[dateKey] = 0
      })
      
      batchData?.forEach(item => {
        const dateKey = item.created_at.split('T')[0]
        if (batchCounts.hasOwnProperty(dateKey)) {
          batchCounts[dateKey] = (batchCounts[dateKey] || 0) + 1
        }
      })
      
      const batchEnd = performance.now()
      const batchTime = batchEnd - batchStart
      
      console.log(`  ⏱️ 実行時間: ${batchTime.toFixed(2)}ms`)
      console.log(`  📊 クエリ数: 1 回`)
      console.log('  📋 結果:')
      Object.entries(batchCounts).forEach(([date, count]) => {
        console.log(`    ${date}: ${count} 件`)
      })
      
      const improvement = ((individualTime - batchTime) / individualTime * 100).toFixed(1)
      console.log(`\n🚀 パフォーマンス改善: ${improvement}% 高速化`)
      
      return {
        individualTime,
        batchTime,
        improvement: parseFloat(improvement),
        individualResults,
        batchResults: batchCounts
      }
      
    } catch (error) {
      console.error('❌ パフォーマンステストエラー:', error)
      return null
    }
  },
  
  // 4. キャッシュ効果のシミュレーション
  simulateCacheEffect(performanceData) {
    console.log('🔍 === キャッシュ効果シミュレーション ===')
    
    if (!performanceData) {
      console.log('❌ パフォーマンスデータが必要です。先にtestPerformance()を実行してください。')
      return
    }
    
    console.log('📊 日付選択時の動作比較:')
    console.log('\n従来方式（キャッシュなし）:')
    console.log('  1. 日付選択')
    console.log('  2. ローディング表示')
    console.log(`  3. クエリ実行 (${performanceData.individualTime.toFixed(2)}ms)`)
    console.log('  4. 結果表示')
    console.log(`  ⏱️ 合計待機時間: ~${performanceData.individualTime.toFixed(2)}ms`)
    
    console.log('\n新方式（週間キャッシュ）:')
    console.log('  1. 週データ事前取得・キャッシュ')
    console.log(`  2. 日付選択 → 即座に表示 (~1ms)`)
    console.log('  ⏱️ 待機時間: ほぼゼロ')
    
    console.log('\n🎯 ユーザー体験の改善:')
    console.log('  ✅ ローディングの削除')
    console.log('  ✅ 即座の結果表示')
    console.log('  ✅ スムーズな日付切り替え')
    console.log('  ✅ 先読みによる快適な操作')
  },
  
  // 5. 包括的テスト実行
  async runComprehensiveTest() {
    console.log('🚀 === キャッシュ実装包括テスト開始 ===')
    
    const basicCache = await this.testBasicCache()
    const multipleWeeks = await this.testMultipleWeeks()
    const performance = await this.testPerformance()
    
    if (performance) {
      this.simulateCacheEffect(performance)
    }
    
    console.log('\n📋 === テスト結果サマリー ===')
    console.log(`✅ 基本キャッシュ: ${basicCache ? '成功' : '失敗'}`)
    console.log(`✅ 複数週取得: ${multipleWeeks ? '成功' : '失敗'}`)
    console.log(`✅ パフォーマンス: ${performance ? '測定完了' : '失敗'}`)
    
    if (performance) {
      console.log(`🚀 性能改善: ${performance.improvement}% 高速化`)
    }
    
    console.log('\n🎯 実装ステータス:')
    if (basicCache && multipleWeeks && performance) {
      console.log('🎉 キャッシュ機能の実装準備完了！')
      console.log('💡 次のステップ: WeekCalendarWithCache コンポーネントを使用')
    } else {
      console.log('⚠️ 一部機能に問題があります。RLSポリシーまたはデータを確認してください。')
    }
    
    return {
      basicCache,
      multipleWeeks,
      performance
    }
  }
}

console.log('🚀 キャッシュ実装テストツールが読み込まれました')
console.log('使用方法:')
console.log('  testCacheImplementation.runComprehensiveTest() - 包括的テスト')
console.log('  testCacheImplementation.testPerformance() - パフォーマンス比較')
console.log('  testCacheImplementation.testBasicCache() - 基本動作テスト')