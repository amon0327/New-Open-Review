/**
 * アプリライフサイクル統合管理システム
 * すべてのfocus/blur/visibilitychangeイベントを一元管理し、競合を排除
 */

import { useEffect } from 'react'

class AppLifecycleManager {
  constructor() {
    this.isVisible = !document.hidden
    this.hasFocus = document.hasFocus()
    this.isOnline = navigator.onLine
    
    // イベントリスナーの重複を防ぐためのフラグ
    this.isInitialized = false
    
    // デバウンス用のタイマー
    this.foregroundTimer = null
    this.backgroundTimer = null
    
    // イベントハンドラーのコールバック登録
    this.callbacks = {
      foreground: new Set(),
      background: new Set(),
      online: new Set(),
      offline: new Set()
    }
    
    // 現在の状態
    this.currentState = 'unknown'
    
    this.init()
  }

  init() {
    if (this.isInitialized) {
      console.warn('⚠️ AppLifecycleManager: Already initialized, skipping')
      return
    }
    
    console.log('🚀 AppLifecycleManager: Initializing...')
    
    // 初期状態を設定
    this.updateState()
    
    // 単一のイベントリスナーを設定（重複排除）
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    window.addEventListener('focus', this.handleFocus.bind(this))
    window.addEventListener('blur', this.handleBlur.bind(this))
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
    
    this.isInitialized = true
    console.log('✅ AppLifecycleManager: Initialized with state:', this.currentState)
  }

  updateState() {
    const wasState = this.currentState
    
    if (!this.isOnline) {
      this.currentState = 'offline'
    } else if (document.hidden) {
      this.currentState = 'background'
    } else if (this.hasFocus) {
      this.currentState = 'foreground-focused'
    } else {
      this.currentState = 'foreground-unfocused'
    }
    
    if (wasState !== this.currentState) {
      console.log(`🔄 AppLifecycleManager: State changed from ${wasState} to ${this.currentState}`)
    }
  }

  handleVisibilityChange() {
    const wasVisible = this.isVisible
    this.isVisible = !document.hidden
    
    console.log(`👁️ AppLifecycleManager: Visibility changed to ${this.isVisible ? 'visible' : 'hidden'}`)
    
    if (this.isVisible && !wasVisible) {
      // バックグラウンドからフォアグラウンドに復帰
      this.handleAppForeground('visibility')
    } else if (!this.isVisible && wasVisible) {
      // フォアグラウンドからバックグラウンドに移行
      this.handleAppBackground('visibility')
    }
    
    this.updateState()
  }

  handleFocus() {
    console.log('🎯 AppLifecycleManager: Window gained focus')
    this.hasFocus = true
    
    if (this.isVisible) {
      // 可視状態でフォーカスを得た場合
      this.handleAppForeground('focus')
    }
    
    this.updateState()
  }

  handleBlur() {
    console.log('😴 AppLifecycleManager: Window lost focus')
    this.hasFocus = false
    this.updateState()
  }

  handleOnline() {
    console.log('🌐 AppLifecycleManager: App is online')
    this.isOnline = true
    this.updateState()
    this.notifyCallbacks('online')
  }

  handleOffline() {
    console.log('📵 AppLifecycleManager: App is offline')
    this.isOnline = false
    this.updateState()
    this.notifyCallbacks('offline')
  }

  handleAppForeground(source) {
    console.log(`📱 AppLifecycleManager: App entering foreground (${source})`)
    
    // 既存のタイマーをクリア
    if (this.foregroundTimer) {
      clearTimeout(this.foregroundTimer)
    }
    
    // デバウンス付きフォアグラウンド処理（500ms）
    this.foregroundTimer = setTimeout(() => {
      console.log('🚀 AppLifecycleManager: Executing foreground callbacks')
      this.notifyCallbacks('foreground')
    }, 500)
  }

  handleAppBackground(source) {
    console.log(`📱 AppLifecycleManager: App entering background (${source})`)
    
    // フォアグラウンドタイマーをキャンセル
    if (this.foregroundTimer) {
      clearTimeout(this.foregroundTimer)
      this.foregroundTimer = null
    }
    
    // 即座にバックグラウンドコールバックを実行
    this.notifyCallbacks('background')
  }

  notifyCallbacks(event) {
    const callbacks = this.callbacks[event]
    if (callbacks && callbacks.size > 0) {
      console.log(`📡 AppLifecycleManager: Notifying ${callbacks.size} callbacks for ${event}`)
      callbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.error(`❌ AppLifecycleManager: Error in ${event} callback:`, error)
        }
      })
    }
  }

  // コールバック登録
  onForeground(callback) {
    this.callbacks.foreground.add(callback)
    console.log(`📝 AppLifecycleManager: Registered foreground callback (total: ${this.callbacks.foreground.size})`)
    
    // 登録解除関数を返す
    return () => {
      this.callbacks.foreground.delete(callback)
      console.log(`🗑️ AppLifecycleManager: Unregistered foreground callback (total: ${this.callbacks.foreground.size})`)
    }
  }

  onBackground(callback) {
    this.callbacks.background.add(callback)
    console.log(`📝 AppLifecycleManager: Registered background callback (total: ${this.callbacks.background.size})`)
    
    return () => {
      this.callbacks.background.delete(callback)
      console.log(`🗑️ AppLifecycleManager: Unregistered background callback (total: ${this.callbacks.background.size})`)
    }
  }

  onOnline(callback) {
    this.callbacks.online.add(callback)
    return () => this.callbacks.online.delete(callback)
  }

  onOffline(callback) {
    this.callbacks.offline.add(callback)
    return () => this.callbacks.offline.delete(callback)
  }

  // 現在の状態を取得
  getState() {
    return {
      isVisible: this.isVisible,
      hasFocus: this.hasFocus,
      isOnline: this.isOnline,
      currentState: this.currentState
    }
  }

  // 手動でフォアグラウンド処理をトリガー
  triggerForegroundRefresh() {
    console.log('🔄 AppLifecycleManager: Manual foreground refresh triggered')
    this.notifyCallbacks('foreground')
  }

  // クリーンアップ
  destroy() {
    console.log('🧹 AppLifecycleManager: Cleaning up...')
    
    if (this.foregroundTimer) {
      clearTimeout(this.foregroundTimer)
    }
    if (this.backgroundTimer) {
      clearTimeout(this.backgroundTimer)
    }
    
    // イベントリスナーを削除
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('focus', this.handleFocus)
    window.removeEventListener('blur', this.handleBlur)
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    
    // コールバックをクリア
    Object.keys(this.callbacks).forEach(key => {
      this.callbacks[key].clear()
    })
    
    this.isInitialized = false
    console.log('✅ AppLifecycleManager: Cleanup completed')
  }
}

// シングルトンインスタンス
export const appLifecycleManager = new AppLifecycleManager()

// React Hook for easy usage

export const useAppLifecycle = () => {
  return {
    onForeground: appLifecycleManager.onForeground.bind(appLifecycleManager),
    onBackground: appLifecycleManager.onBackground.bind(appLifecycleManager),
    onOnline: appLifecycleManager.onOnline.bind(appLifecycleManager),
    onOffline: appLifecycleManager.onOffline.bind(appLifecycleManager),
    getState: appLifecycleManager.getState.bind(appLifecycleManager),
    triggerRefresh: appLifecycleManager.triggerForegroundRefresh.bind(appLifecycleManager)
  }
}

export default appLifecycleManager