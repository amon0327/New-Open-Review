/**
 * スコアページクエリ分析スクリプト
 * 実際にページを操作してクエリ数を測定
 */

// モニタリング設定
let queryAnalyzer = {
  queries: [],
  startTime: null,
  hooks: new Map(),
  
  // 監視開始
  start() {
    this.queries = [];
    this.startTime = Date.now();
    this.hooks.clear();
    
    // Supabaseクエリを監視
    this.monitorFetch();
    
    console.log('🔍 スコアページクエリ分析開始');
    console.log('💡 以下の手順で測定してください:');
    console.log('  1. ストアページ → スコアページに遷移');
    console.log('  2. 異なるスコア種別をクリック');
    console.log('  3. analyzeResults() で結果確認');
  },
  
  // Fetch監視
  monitorFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = (...args) => {
      const [url] = args;
      
      if (url && url.includes('supabase.co')) {
        const timestamp = Date.now() - this.startTime;
        const tableMatch = url.match(/\/rest\/v1\/([^?]+)/);
        const tableName = tableMatch ? tableMatch[1] : 'unknown';
        
        // スタックトレースからReactフック名を推定
        const stackTrace = new Error().stack;
        let hookName = 'unknown';
        
        if (stackTrace.includes('useCustomQuestionScores')) {
          hookName = 'useCustomQuestionScores';
        } else if (stackTrace.includes('useWeeklyNPSCache')) {
          hookName = 'useWeeklyNPSCache';
        } else if (stackTrace.includes('RecommendedScoreCard')) {
          hookName = 'RecommendedScoreCard';
        } else if (stackTrace.includes('useWeeklyDataCache')) {
          hookName = 'useWeeklyDataCache';
        }
        
        const query = {
          id: this.queries.length + 1,
          timestamp,
          tableName,
          hookName,
          url: url.split('?')[0],
          fullUrl: url
        };
        
        this.queries.push(query);
        
        // フック別カウント
        if (!this.hooks.has(hookName)) {
          this.hooks.set(hookName, []);
        }
        this.hooks.get(hookName).push(query);
        
        console.log(`📊 Query #${query.id}: [${hookName}] ${tableName} (+${timestamp}ms)`);
      }
      
      return originalFetch.apply(this, args);
    };
  },
  
  // 結果分析
  analyzeResults() {
    const totalQueries = this.queries.length;
    const duration = Date.now() - this.startTime;
    
    console.log('\n📈 === スコアページクエリ分析結果 ===');
    console.log(`📊 総クエリ数: ${totalQueries}`);
    console.log(`⏱️ 実行時間: ${Math.round(duration / 1000)}秒`);
    
    if (totalQueries === 0) {
      console.log('❌ クエリが検出されませんでした');
      return;
    }
    
    // フック別集計
    console.log('\n🎣 フック別クエリ数:');
    Array.from(this.hooks.entries())
      .sort(([,a], [,b]) => b.length - a.length)
      .forEach(([hookName, queries]) => {
        console.log(`  ${hookName}: ${queries.length}回`);
        
        // テーブル別詳細
        const tables = {};
        queries.forEach(q => {
          tables[q.tableName] = (tables[q.tableName] || 0) + 1;
        });
        
        Object.entries(tables).forEach(([table, count]) => {
          console.log(`    └─ ${table}: ${count}回`);
        });
      });
    
    // タイムライン表示
    console.log('\n⏱️ クエリタイムライン:');
    this.queries.slice(0, 20).forEach(q => {
      const timeStr = `+${q.timestamp}ms`.padStart(8);
      console.log(`  ${timeStr}: [${q.hookName}] ${q.tableName}`);
    });
    
    if (this.queries.length > 20) {
      console.log(`  ... 他${this.queries.length - 20}件`);
    }
    
    // 問題診断
    this.diagnoseIssues();
    
    return {
      totalQueries,
      duration,
      byHook: Object.fromEntries(this.hooks),
      timeline: this.queries
    };
  },
  
  // 問題診断
  diagnoseIssues() {
    console.log('\n🔧 === 問題診断 ===');
    
    const totalQueries = this.queries.length;
    
    if (totalQueries <= 10) {
      console.log('✅ クエリ数は適正範囲内です');
    } else if (totalQueries <= 50) {
      console.log('⚠️ クエリ数がやや多いです。バッチ化を検討してください');
    } else {
      console.log('❌ クエリ数が多すぎます。緊急にバッチ化が必要です');
    }
    
    // 重複テーブルアクセス検出
    const tableAccess = {};
    this.queries.forEach(q => {
      const key = `${q.hookName}-${q.tableName}`;
      tableAccess[key] = (tableAccess[key] || 0) + 1;
    });
    
    const duplicates = Object.entries(tableAccess).filter(([, count]) => count > 3);
    if (duplicates.length > 0) {
      console.log('\n⚠️ 重複アクセス検出:');
      duplicates.forEach(([key, count]) => {
        console.log(`  ${key}: ${count}回 → バッチ化推奨`);
      });
    }
    
    // 推奨改善案
    if (this.hooks.has('RecommendedScoreCard') && this.hooks.get('RecommendedScoreCard').length > 3) {
      console.log('\n💡 改善提案:');
      console.log('  - RecommendedScoreCardをuseCustomQuestionScoresと統合');
      console.log('  - テーブル構造確認クエリをキャッシュ化');
    }
    
    if (totalQueries > 50) {
      console.log('\n🚨 緊急対応が必要:');
      console.log('  - React Strict Modeが有効化されていないか確認');
      console.log('  - useEffectの依存配列に問題がないか確認');
      console.log('  - 無限ループが発生していないか確認');
    }
  },
  
  // 特定フックのクエリ詳細表示
  showHookDetails(hookName) {
    const hookQueries = this.hooks.get(hookName);
    if (!hookQueries) {
      console.log(`❌ フック "${hookName}" のクエリは見つかりませんでした`);
      return;
    }
    
    console.log(`\n📋 ${hookName} の詳細 (${hookQueries.length}クエリ):`);
    hookQueries.forEach(q => {
      console.log(`  ${q.id}. [+${q.timestamp}ms] ${q.tableName}`);
      console.log(`     ${q.fullUrl}`);
    });
  },
  
  // リセット
  reset() {
    this.queries = [];
    this.hooks.clear();
    this.startTime = null;
    console.log('🔄 分析データをリセットしました');
  }
};

// 使用方法の表示
console.log(`
🔧 === スコアページクエリ分析ツール ===

使用方法:
1. queryAnalyzer.start()                    - 分析開始
2. // スコアページを操作
3. queryAnalyzer.analyzeResults()           - 結果分析
4. queryAnalyzer.showHookDetails('hookName') - 特定フック詳細
5. queryAnalyzer.reset()                    - リセット

推奨手順:
1. StorePage を開く
2. queryAnalyzer.start() を実行
3. 任意のスコアカードをクリックしてScoreAnalysisPage に遷移
4. いくつかの異なるスコア種別をクリック
5. queryAnalyzer.analyzeResults() で結果確認
`);

// グローバルに公開
window.queryAnalyzer = queryAnalyzer;

console.log('✅ スコアページクエリ分析ツール準備完了');
console.log('💡 queryAnalyzer.start() で分析を開始してください');