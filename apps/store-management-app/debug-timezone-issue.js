/**
 * タイムゾーン問題調査スクリプト
 * ブラウザコンソールで実行
 */

const debugTimezoneIssues = {
  // 現在の日時情報を詳細に調査
  checkCurrentTime() {
    const now = new Date()
    const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000)
    const jstNow = new Date(utcNow.getTime() + (9 * 60 * 60 * 1000))
    
    console.log('🕐 === 現在の時間情報 ===')
    console.log('ローカル時間:', now.toString())
    console.log('UTC時間:', utcNow.toString())
    console.log('JST時間:', jstNow.toString())
    console.log('タイムゾーンオフセット (分):', now.getTimezoneOffset())
    
    console.log('\n📅 === ISO形式の日付 ===')
    console.log('ローカル ISO:', now.toISOString())
    console.log('ローカル 日付のみ:', now.toISOString().split('T')[0])
    console.log('JST ISO:', jstNow.toISOString())
    console.log('JST 日付のみ:', jstNow.toISOString().split('T')[0])
    
    return {
      local: now,
      utc: utcNow,
      jst: jstNow,
      timezoneOffset: now.getTimezoneOffset()
    }
  },

  // 週の開始日計算の詳細分析
  analyzeWeekCalculation() {
    console.log('\n📅 === 週の開始日計算分析 ===')
    
    const selectedDate = new Date() // 現在選択されている日付をシミュレート
    console.log('選択された日付:', selectedDate.toString())
    console.log('曜日 (0=日, 1=月):', selectedDate.getDay())
    
    // StorePage.jsxの計算方法
    const getWeekStart = (date) => {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()) // 時間情報をリセット
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 日曜日の場合は-6、それ以外は1を足す
      return new Date(d.getFullYear(), d.getMonth(), diff)
    }
    
    const weekStart = getWeekStart(selectedDate)
    console.log('計算された週開始日:', weekStart.toString())
    console.log('週開始日の曜日:', weekStart.getDay())
    console.log('週開始日 ISO:', weekStart.toISOString())
    
    // 7日間の範囲を生成
    console.log('\n📋 === 週の7日間 ===')
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dayNames = ['日', '月', '火', '水', '木', '金', '土']
      console.log(`${i + 1}日目: ${date.toISOString().split('T')[0]} (${dayNames[date.getDay()]})`)
    }
    
    return { selectedDate, weekStart }
  },

  // Supabaseクエリの日付範囲を詳細分析
  analyzeSupabaseQueries() {
    console.log('\n🔍 === Supabaseクエリ日付範囲分析 ===')
    
    const { weekStart } = this.analyzeWeekCalculation()
    
    // useOptimizedWeeklyDataの計算方法
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // 6日後（7日間）
    weekEnd.setHours(23, 59, 59, 999) // 終了日の23:59:59まで
    
    console.log('Supabaseクエリ範囲:')
    console.log('  開始:', weekStart.toISOString())
    console.log('  終了:', weekEnd.toISOString())
    console.log('  範囲:', `${(weekEnd - weekStart) / (1000 * 60 * 60 * 24) + 1}日間`)
    
    // 各日の0:00:00と23:59:59を確認
    console.log('\n📊 === 各日の詳細範囲 ===')
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStart)
      dayStart.setDate(weekStart.getDate() + i)
      dayStart.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(weekStart)
      dayEnd.setDate(weekStart.getDate() + i)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayNames = ['日', '月', '火', '水', '木', '金', '土']
      console.log(`${dayNames[dayStart.getDay()]}: ${dayStart.toISOString()} ～ ${dayEnd.toISOString()}`)
    }
    
    return { weekStart, weekEnd }
  },

  // 実際のSupabaseデータとの比較
  async checkSupabaseData() {
    console.log('\n🔍 === Supabaseデータ確認 ===')
    
    if (typeof supabase === 'undefined') {
      console.log('❌ supabaseオブジェクトが見つかりません')
      return
    }

    const { weekStart, weekEnd } = this.analyzeSupabaseQueries()
    
    try {
      // サンプルクエリでタイムスタンプを確認
      const { data: sampleData, error } = await supabase
        .from('review_form_submissions')
        .select('created_at')
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString())
        .order('created_at', { ascending: true })
        .limit(10)
      
      if (error) {
        console.error('❌ クエリエラー:', error)
        return
      }
      
      console.log('📊 取得されたデータサンプル:')
      sampleData?.forEach((item, index) => {
        const utcDate = new Date(item.created_at)
        const jstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
        
        console.log(`${index + 1}. UTC: ${item.created_at}`)
        console.log(`   JST: ${jstDate.toISOString()}`)
        console.log(`   日付キー: ${item.created_at.split('T')[0]}`)
        console.log(`   JST日付キー: ${jstDate.toISOString().split('T')[0]}`)
        console.log('')
      })
      
      // 日付別カウント（UTCベース）
      const utcDateCounts = {}
      const jstDateCounts = {}
      
      sampleData?.forEach(item => {
        const utcDateKey = item.created_at.split('T')[0]
        const jstDate = new Date(new Date(item.created_at).getTime() + (9 * 60 * 60 * 1000))
        const jstDateKey = jstDate.toISOString().split('T')[0]
        
        utcDateCounts[utcDateKey] = (utcDateCounts[utcDateKey] || 0) + 1
        jstDateCounts[jstDateKey] = (jstDateCounts[jstDateKey] || 0) + 1
      })
      
      console.log('📊 UTC日付別カウント:', utcDateCounts)
      console.log('📊 JST日付別カウント:', jstDateCounts)
      
    } catch (error) {
      console.error('❌ データ確認エラー:', error)
    }
  },

  // タイムゾーン修正版の日付処理を提案
  proposeFix() {
    console.log('\n🔧 === 修正提案 ===')
    
    console.log('問題: Supabaseのタイムスタンプ(UTC)を日本時間として誤って扱っている')
    console.log('')
    console.log('修正方法:')
    console.log('1. Supabaseから取得したcreated_atをJSTに変換')
    console.log('2. 日付キー生成時にJST基準を使用')
    console.log('3. 週の範囲計算もJST基準で実行')
    console.log('')
    
    // 修正版の関数例
    const convertUTCToJST = (utcString) => {
      const utcDate = new Date(utcString)
      const jstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
      return jstDate
    }
    
    const getJSTDateKey = (utcString) => {
      return convertUTCToJST(utcString).toISOString().split('T')[0]
    }
    
    console.log('例:')
    console.log('UTC: 2025-10-20T15:30:00.000Z')
    console.log('JST変換後:', convertUTCToJST('2025-10-20T15:30:00.000Z').toISOString())
    console.log('JST日付キー:', getJSTDateKey('2025-10-20T15:30:00.000Z'))
  },

  // 全て実行
  async runFullAnalysis() {
    console.log('🔍 === タイムゾーン問題の完全分析 ===')
    
    this.checkCurrentTime()
    this.analyzeWeekCalculation()
    this.analyzeSupabaseQueries()
    await this.checkSupabaseData()
    this.proposeFix()
    
    console.log('\n✅ 分析完了')
  }
}

// グローバルに公開
window.debugTimezoneIssues = debugTimezoneIssues

console.log('🔍 タイムゾーン問題調査ツール準備完了')
console.log('💡 debugTimezoneIssues.runFullAnalysis() で完全分析を実行してください')

// 簡易確認を自動実行
debugTimezoneIssues.checkCurrentTime()
debugTimezoneIssues.analyzeWeekCalculation()