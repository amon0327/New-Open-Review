/**
 * Supabaseクエリ実行数監視スクリプト
 * ブラウザのコンソールで実行してクエリ数をカウント
 */

// クエリカウンター
let queryCount = 0;
let queryLog = [];

// Supabaseクライアントのクエリを監視
function monitorSupabaseQueries() {
  console.log('🔍 Supabaseクエリ監視を開始します...');
  
  // 元のfetch関数を保存
  const originalFetch = window.fetch;
  
  // fetch関数をラップ
  window.fetch = function(...args) {
    const [url, options] = args;
    
    // Supabase APIコールを検出
    if (url && typeof url === 'string' && url.includes('supabase.co')) {
      queryCount++;
      const timestamp = new Date().toISOString();
      const method = options?.method || 'GET';
      
      // URLからテーブル名を抽出
      let tableName = 'unknown';
      const tableMatch = url.match(/\/rest\/v1\/([^?]+)/);
      if (tableMatch) {
        tableName = tableMatch[1];
      }
      
      const logEntry = {
        id: queryCount,
        timestamp,
        method,
        tableName,
        url: url.split('?')[0], // クエリパラメータを除く
        fullUrl: url
      };
      
      queryLog.push(logEntry);
      
      console.log(`📊 Query #${queryCount}: ${method} ${tableName}`, {
        url: url.split('?')[0],
        time: timestamp
      });
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ 監視設定完了 - ページを操作してクエリを確認してください');
}

// クエリ統計を表示
function showQueryStats() {
  console.log('\n📈 === Supabaseクエリ実行統計 ===');
  console.log(`総クエリ数: ${queryCount}`);
  
  if (queryLog.length === 0) {
    console.log('クエリが実行されていません');
    return;
  }
  
  // テーブル別集計
  const tableStats = {};
  queryLog.forEach(log => {
    if (!tableStats[log.tableName]) {
      tableStats[log.tableName] = { count: 0, methods: new Set() };
    }
    tableStats[log.tableName].count++;
    tableStats[log.tableName].methods.add(log.method);
  });
  
  console.log('\n📋 テーブル別クエリ数:');
  Object.entries(tableStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .forEach(([table, stats]) => {
      console.log(`  ${table}: ${stats.count}回 (${Array.from(stats.methods).join(', ')})`);
    });
  
  // 最近のクエリ
  console.log('\n🕐 最新10クエリ:');
  queryLog.slice(-10).forEach(log => {
    const time = new Date(log.timestamp).toLocaleTimeString();
    console.log(`  ${log.id}. [${time}] ${log.method} ${log.tableName}`);
  });
  
  return {
    totalQueries: queryCount,
    tableStats,
    recentQueries: queryLog.slice(-10),
    allQueries: queryLog
  };
}

// クエリログをリセット
function resetQueryCount() {
  queryCount = 0;
  queryLog = [];
  console.log('🔄 クエリカウンターをリセットしました');
}

// 詳細なクエリ情報を表示
function showDetailedQueryLog(limit = 20) {
  console.log(`\n📝 詳細クエリログ (最新${limit}件):`);
  
  queryLog.slice(-limit).forEach(log => {
    console.log(`\n${log.id}. ${log.method} ${log.tableName}`);
    console.log(`   時刻: ${new Date(log.timestamp).toLocaleString()}`);
    console.log(`   URL: ${log.url}`);
    if (log.fullUrl !== log.url) {
      console.log(`   クエリ: ${log.fullUrl.split('?')[1] || 'なし'}`);
    }
  });
}

// 特定のテーブルのクエリを表示
function showQueriesForTable(tableName) {
  const tableQueries = queryLog.filter(log => log.tableName === tableName);
  console.log(`\n🎯 ${tableName} テーブルへのクエリ (${tableQueries.length}件):`);
  
  tableQueries.forEach(log => {
    console.log(`  ${log.id}. [${new Date(log.timestamp).toLocaleTimeString()}] ${log.method}`);
    console.log(`     ${log.fullUrl}`);
  });
  
  return tableQueries;
}

// クエリ実行の時系列チャート（簡易版）
function showQueryTimeline() {
  if (queryLog.length === 0) {
    console.log('クエリデータがありません');
    return;
  }
  
  console.log('\n📊 クエリ実行タイムライン:');
  
  // 最初のクエリ時刻を基準にする
  const startTime = new Date(queryLog[0].timestamp).getTime();
  
  queryLog.forEach((log, index) => {
    const currentTime = new Date(log.timestamp).getTime();
    const elapsedSeconds = Math.round((currentTime - startTime) / 1000);
    const bar = '█'.repeat(Math.min(Math.floor(elapsedSeconds / 5), 20)); // 5秒ごとに1文字
    
    console.log(`${String(log.id).padStart(3)}: ${bar} +${elapsedSeconds}s ${log.tableName}`);
  });
}

// 使用方法の表示
function showUsage() {
  console.log(`
🔧 === Supabaseクエリ監視ツール ===

使用方法:
1. monitorSupabaseQueries()     - クエリ監視を開始
2. showQueryStats()             - クエリ統計を表示  
3. showDetailedQueryLog(20)     - 詳細ログを表示
4. showQueriesForTable('table') - 特定テーブルのクエリ表示
5. showQueryTimeline()          - クエリ実行タイムライン
6. resetQueryCount()            - カウンターリセット

例：
> monitorSupabaseQueries()  // 監視開始
> // スコアページを操作
> showQueryStats()          // 統計確認
`);
}

// 自動的に使用方法を表示
showUsage();

// グローバルに関数を公開
window.monitorSupabaseQueries = monitorSupabaseQueries;
window.showQueryStats = showQueryStats;
window.resetQueryCount = resetQueryCount;
window.showDetailedQueryLog = showDetailedQueryLog;
window.showQueriesForTable = showQueriesForTable;
window.showQueryTimeline = showQueryTimeline;
window.showUsage = showUsage;

console.log('✅ クエリ監視ツールが読み込まれました');
console.log('💡 monitorSupabaseQueries() を実行して監視を開始してください');