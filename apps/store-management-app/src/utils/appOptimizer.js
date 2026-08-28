/**
 * アプリ最適化ユーティリティ
 * Edge Function対応とキャッシュ戦略の統合管理
 */

import edgeFunctionCache from './edgeFunctionCache'

class AppOptimizer {
  constructor() {
    this.isInitialized = false
    this.performanceMetrics = {
      edgeFunctionCalls: 0,
      cacheHits: 0,
      networkRequests: 0,
      averageResponseTime: 0
    }
  }

  // アプリ起動時の初期化
  async initialize() {
    if (this.isInitialized) return

    console.log('🚀 App Optimizer initializing...')

    try {
      // 1. Service Worker登録確認
      await this.ensureServiceWorkerReady()

      // 2. キャッシュを初期化
      await this.initializeCache()

      // 3. パフォーマンス監視を開始
      this.startPerformanceMonitoring()

      this.isInitialized = true
      console.log('✅ App Optimizer initialized successfully')

      // 統計を出力
      setTimeout(() => this.logPerformanceStats(), 30000) // 30秒後に統計出力

    } catch (error) {
      console.error('❌ App Optimizer initialization failed:', error)
    }
  }

  // Service Worker準備完了を待つ
  async ensureServiceWorkerReady() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      console.log('✅ Service Worker ready:', registration.scope)
    } catch (error) {
      console.warn('Service Worker registration failed:', error)
    }
  }

  // キャッシュ初期化
  async initializeCache() {
    try {
      // 古いキャッシュをクリーンアップ
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        const oldCaches = cacheNames.filter(name => 
          name.includes('edge-function') && name !== 'edge-function-cache-v1'
        )
        
        await Promise.all(oldCaches.map(name => caches.delete(name)))
        if (oldCaches.length > 0) {
          console.log('🗑️ Cleaned up old caches:', oldCaches)
        }
      }

      console.log('💾 Cache system initialized')
    } catch (error) {
      console.warn('Cache initialization failed:', error)
    }
  }

  // パフォーマンス監視開始
  startPerformanceMonitoring() {
    // Fetch APIをラップしてメトリクスを収集
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        const duration = endTime - startTime

        // Edge Function呼び出しを検出
        const url = args[0]
        if (typeof url === 'string' && url.includes('/functions/v1/')) {
          this.performanceMetrics.edgeFunctionCalls++
          this.updateAverageResponseTime(duration)
          
          // キャッシュヒット判定（簡易版）
          if (duration < 50) { // 50ms未満はキャッシュヒットと判定
            this.performanceMetrics.cacheHits++
          } else {
            this.performanceMetrics.networkRequests++
          }
        }

        return response
      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime
        this.updateAverageResponseTime(duration)
        throw error
      }
    }

    console.log('📊 Performance monitoring started')
  }

  // 平均レスポンス時間を更新
  updateAverageResponseTime(duration) {
    const total = this.performanceMetrics.edgeFunctionCalls
    const current = this.performanceMetrics.averageResponseTime
    this.performanceMetrics.averageResponseTime = 
      ((current * (total - 1)) + duration) / total
  }

  // パフォーマンス統計をログ出力
  logPerformanceStats() {
    const stats = this.getPerformanceStats()
    console.log('📊 Performance Statistics:', stats)
    
    // キャッシュ効率を計算
    const totalRequests = stats.cacheHits + stats.networkRequests
    const cacheEfficiency = totalRequests > 0 ? 
      Math.round((stats.cacheHits / totalRequests) * 100) : 0

    console.log(`📈 Cache Efficiency: ${cacheEfficiency}% (${stats.cacheHits}/${totalRequests})`)
    console.log(`⚡ Average Response Time: ${Math.round(stats.averageResponseTime)}ms`)
  }

  // パフォーマンス統計を取得
  getPerformanceStats() {
    return {
      ...this.performanceMetrics,
      cacheStats: edgeFunctionCache.getStats(),
      timestamp: new Date().toISOString()
    }
  }

  // データを手動でプリロード
  async preloadData(storeId, userId, weekStart) {
    if (!storeId || !userId) return

    console.log('🔄 Preloading data...')

    try {
      // 並列でデータを事前ロード
      await Promise.all([
        edgeFunctionCache.fetchWithCache(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unread-counts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ store_id: storeId, user_id: userId })
          },
          30 * 1000 // 30秒キャッシュ
        ),
        
        weekStart ? edgeFunctionCache.fetchWithCache(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-data`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ 
              store_id: storeId, 
              week_start: weekStart.toISOString().split('T')[0] 
            })
          },
          5 * 60 * 1000 // 5分キャッシュ
        ) : Promise.resolve()
      ])

      console.log('✅ Data preloaded successfully')
    } catch (error) {
      console.warn('⚠️ Data preload failed:', error)
    }
  }

  // キャッシュを無効化
  async invalidateAllCaches() {
    await edgeFunctionCache.clearCache()
    console.log('🗑️ All caches invalidated')
  }

  // 特定パターンのキャッシュを無効化
  async invalidateCache(pattern) {
    await edgeFunctionCache.invalidateCache(pattern)
    console.log('🗑️ Cache invalidated for:', pattern)
  }
}

// シングルトンインスタンス
const appOptimizer = new AppOptimizer()

export default appOptimizer

// 便利な関数をエクスポート
export const initializeAppOptimizer = () => appOptimizer.initialize()
export const preloadAppData = (storeId, userId, weekStart) => 
  appOptimizer.preloadData(storeId, userId, weekStart)
export const getAppPerformanceStats = () => appOptimizer.getPerformanceStats()
export const invalidateAppCache = (pattern) => appOptimizer.invalidateCache(pattern)