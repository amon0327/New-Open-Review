/**
 * Edge Function レスポンスキャッシュマネージャー
 * ServiceWorkerと連携してネットワークレベルでのキャッシュを実装
 */

class EdgeFunctionCache {
  constructor() {
    this.memoryCache = new Map()
    this.maxMemoryCacheSize = 50
    this.defaultTTL = 5 * 60 * 1000 // 5分
  }

  // キャッシュキーを生成
  generateCacheKey(url, body) {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
    return `${url}:${btoa(bodyStr)}`
  }

  // メモリキャッシュから取得
  getFromMemory(cacheKey) {
    const cached = this.memoryCache.get(cacheKey)
    if (!cached) return null

    if (Date.now() > cached.expiresAt) {
      this.memoryCache.delete(cacheKey)
      return null
    }

    console.log('📦 Cache hit (Memory):', cacheKey)
    return cached.data
  }

  // メモリキャッシュに保存
  setInMemory(cacheKey, data, ttl = this.defaultTTL) {
    // サイズ制限
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value
      this.memoryCache.delete(firstKey)
    }

    this.memoryCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + ttl
    })

    console.log('💾 Cache stored (Memory):', cacheKey)
  }

  // キャッシュされたレスポンスを返すかフェッチを実行
  async fetchWithCache(url, options = {}, ttl = this.defaultTTL) {
    const cacheKey = this.generateCacheKey(url, options.body)

    // 1. メモリキャッシュをチェック
    const memoryResult = this.getFromMemory(cacheKey)
    if (memoryResult) {
      return memoryResult
    }

    // 2. Cache APIをチェック（ServiceWorker経由）
    if ('caches' in window) {
      try {
        const cache = await caches.open('edge-function-cache-v1')
        const cachedResponse = await cache.match(url)
        
        if (cachedResponse) {
          const data = await cachedResponse.json()
          const cacheDate = new Date(cachedResponse.headers.get('date'))
          const age = Date.now() - cacheDate.getTime()
          
          if (age < ttl) {
            console.log('📦 Cache hit (Storage):', cacheKey)
            // メモリキャッシュにも保存
            this.setInMemory(cacheKey, data, ttl - age)
            return data
          } else {
            // 期限切れのキャッシュを削除
            await cache.delete(url)
          }
        }
      } catch (error) {
        console.warn('Cache API error:', error)
      }
    }

    // 3. ネットワークからフェッチ
    console.log('🌐 Fetching from network:', url)
    try {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // 4. キャッシュに保存
      this.setInMemory(cacheKey, data, ttl)
      
      // Cache APIにも保存
      if ('caches' in window) {
        try {
          const cache = await caches.open('edge-function-cache-v1')
          const responseToCache = new Response(JSON.stringify(data), {
            headers: {
              'Content-Type': 'application/json',
              'date': new Date().toISOString()
            }
          })
          await cache.put(url, responseToCache)
          console.log('💾 Cache stored (Storage):', cacheKey)
        } catch (error) {
          console.warn('Failed to store in Cache API:', error)
        }
      }

      return data
    } catch (error) {
      console.error('Network fetch failed:', error)
      throw error
    }
  }

  // キャッシュをクリア
  async clearCache() {
    this.memoryCache.clear()
    
    if ('caches' in window) {
      try {
        await caches.delete('edge-function-cache-v1')
        console.log('🗑️ Cache cleared')
      } catch (error) {
        console.warn('Failed to clear Cache API:', error)
      }
    }
  }

  // 特定のキャッシュを削除
  async invalidateCache(pattern) {
    // メモリキャッシュから削除
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key)
      }
    }

    // Cache APIからも削除
    if ('caches' in window) {
      try {
        const cache = await caches.open('edge-function-cache-v1')
        const keys = await cache.keys()
        
        for (const request of keys) {
          if (request.url.includes(pattern)) {
            await cache.delete(request)
          }
        }
        console.log('🗑️ Cache invalidated for pattern:', pattern)
      } catch (error) {
        console.warn('Failed to invalidate Cache API:', error)
      }
    }
  }

  // 統計情報を取得
  getStats() {
    return {
      memoryCacheSize: this.memoryCache.size,
      maxMemoryCacheSize: this.maxMemoryCacheSize,
      entries: Array.from(this.memoryCache.keys())
    }
  }
}

// シングルトンインスタンス
const edgeFunctionCache = new EdgeFunctionCache()

export default edgeFunctionCache

// Edge Function専用のfetchラッパー
export const fetchEdgeFunction = async (functionName, body, options = {}) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const url = `${supabaseUrl}/functions/v1/${functionName}`
  
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      ...options.headers
    },
    body: JSON.stringify(body)
  }

  // キャッシュTTLをfunctionNameに応じて調整
  const ttl = options.ttl || (functionName === 'weekly-data' ? 5 * 60 * 1000 : 60 * 1000) // weekly-data: 5分, その他: 1分

  return edgeFunctionCache.fetchWithCache(url, fetchOptions, ttl)
}