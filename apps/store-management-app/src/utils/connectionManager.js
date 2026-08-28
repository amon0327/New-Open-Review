/**
 * アプリのバックグラウンド復帰時の接続管理
 * 新しいAppLifecycleManagerと連携し、重複を排除
 */

import { supabase } from '../lib/supabase'
import { appLifecycleManager } from './appLifecycleManager'

class ConnectionManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.retryCount = 0
    this.maxRetries = 3
    this.retryDelay = 1000
    this.pendingRequests = new Map()
    
    // 新しいライフサイクルマネージャーと連携
    this.unsubscribeForeground = null
    this.unsubscribeOnline = null
    this.unsubscribeOffline = null
    
    this.init()
  }

  init() {
    console.log('🚀 ConnectionManager: Initializing with AppLifecycleManager integration...')
    
    // 新しいライフサイクルマネージャーに登録
    this.unsubscribeForeground = appLifecycleManager.onForeground(() => {
      this.handleAppForeground()
    })
    
    this.unsubscribeOnline = appLifecycleManager.onOnline(() => {
      this.handleOnline()
    })
    
    this.unsubscribeOffline = appLifecycleManager.onOffline(() => {
      this.handleOffline()
    })
    
    console.log('✅ ConnectionManager: Successfully integrated with AppLifecycleManager')
  }

  handleOnline() {
    console.log('🌐 ConnectionManager: App is online')
    this.isOnline = true
    this.retryCount = 0
    this.retryPendingRequests()
  }

  handleOffline() {
    console.log('📵 ConnectionManager: App is offline')
    this.isOnline = false
  }

  // ライフサイクルイベントはAppLifecycleManagerに任せ、ここでは削除

  async handleAppForeground() {
    // フォアグラウンドに復帰時の処理（AppLifecycleManagerから呼び出し）
    console.log('📱 ConnectionManager: App returning to foreground')
    
    try {
      // 接続状態を確認
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        // 保留中のリクエストを再実行
        await this.retryPendingRequests()
        
        console.log('✅ ConnectionManager: Database connection restored, pending requests retried')
      } else {
        console.warn('⚠️ ConnectionManager: Connection failed, will retry later')
      }
    } catch (error) {
      console.error('❌ ConnectionManager: Error in foreground handler:', error)
    }
  }

  async checkConnection() {
    try {
      console.log('🔍 ConnectionManager: Checking database connection...')
      
      // 軽量なクエリで接続確認
      const { data, error } = await supabase
        .from('business_users')
        .select('id')
        .limit(1)
        .maybeSingle()
      
      if (error) {
        console.warn('⚠️ ConnectionManager: Database connection issue:', error)
        return false
      }
      
      console.log('✅ ConnectionManager: Database connection OK')
      return true
    } catch (error) {
      console.error('❌ ConnectionManager: Connection check failed:', error)
      return false
    }
  }

  async refreshSession() {
    // セッションリフレッシュはAuthContextに任せる（重複回避）
    console.log('🔄 ConnectionManager: Session refresh delegated to AuthContext')
    return true
  }

  async executeWithRetry(operation, key = null) {
    if (!this.isOnline) {
      throw new Error('アプリがオフラインです')
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 ConnectionManager: Executing operation (attempt ${attempt + 1}/${this.maxRetries + 1})`)
        
        if (key) {
          this.pendingRequests.set(key, operation)
        }
        
        const result = await operation()
        
        if (key) {
          this.pendingRequests.delete(key)
        }
        
        console.log('✅ ConnectionManager: Operation completed successfully')
        return result
      } catch (error) {
        console.warn(`⚠️ ConnectionManager: Operation failed (attempt ${attempt + 1}):`, error)
        
        if (attempt === this.maxRetries) {
          if (key) {
            this.pendingRequests.delete(key)
          }
          throw error
        }
        
        // 指数バックオフで再試行
        const delay = this.retryDelay * Math.pow(2, attempt)
        console.log(`⏳ ConnectionManager: Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  clearPendingRequests() {
    console.log('🧹 ConnectionManager: Clearing pending requests')
    this.pendingRequests.clear()
  }

  async retryPendingRequests() {
    if (this.pendingRequests.size === 0) {
      return
    }

    console.log(`🔄 ConnectionManager: Retrying ${this.pendingRequests.size} pending requests`)
    
    const requests = Array.from(this.pendingRequests.entries())
    this.pendingRequests.clear()
    
    for (const [key, operation] of requests) {
      try {
        await this.executeWithRetry(operation, key)
      } catch (error) {
        console.error(`❌ ConnectionManager: Failed to retry operation ${key}:`, error)
      }
    }
  }
  
  // クリーンアップ
  destroy() {
    console.log('🧹 ConnectionManager: Cleaning up...')
    
    // ライフサイクルマネージャーから登録解除
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground()
    }
    if (this.unsubscribeOnline) {
      this.unsubscribeOnline()
    }
    if (this.unsubscribeOffline) {
      this.unsubscribeOffline()
    }
    
    // 保留中のリクエストをクリア
    this.pendingRequests.clear()
    
    console.log('✅ ConnectionManager: Cleanup completed')
  }
}

// シングルトンインスタンス
export const connectionManager = new ConnectionManager()

// データ取得のラッパー関数
export const executeWithConnection = async (operation, key = null) => {
  return connectionManager.executeWithRetry(operation, key)
}

export default connectionManager