/**
 * アプリレベルデータマネージャー
 * ルートアクセス時にリセット、それ以外では初回取得後保持
 */

import { supabase } from '../lib/supabase'

class AppDataManager {
  constructor() {
    this.data = new Map()
    this.loadingStates = new Map()
    this.isInitialized = false
    this.currentPath = null
    this.listeners = new Set()
    
    // パス変更の監視
    this.setupPathListener()
  }

  // パス変更の監視設定
  setupPathListener() {
    if (typeof window !== 'undefined') {
      // 初期パスを記録
      this.currentPath = window.location.pathname
      
      // popstateイベント（ブラウザの戻る/進むボタン）
      window.addEventListener('popstate', () => {
        this.handlePathChange(window.location.pathname)
      })
      
      // pushState/replaceStateの監視
      const originalPushState = history.pushState
      const originalReplaceState = history.replaceState
      
      history.pushState = (...args) => {
        originalPushState.apply(history, args)
        this.handlePathChange(window.location.pathname)
      }
      
      history.replaceState = (...args) => {
        originalReplaceState.apply(history, args)
        this.handlePathChange(window.location.pathname)
      }
    }
  }

  // パス変更時の処理
  handlePathChange(newPath) {
    const oldPath = this.currentPath
    this.currentPath = newPath
    
    // ルート(/)にアクセスした場合はリセット
    if (newPath === '/') {
      console.log('🔄 ルートアクセス検出 - データをリセット')
      this.resetAllData()
    }
    
    // リスナーに通知
    this.notifyListeners('pathChange', { oldPath, newPath })
  }

  // 全データリセット
  resetAllData() {
    this.data.clear()
    this.loadingStates.clear()
    this.isInitialized = false
    this.notifyListeners('dataReset')
  }

  // データの取得
  async getData(key, fetchFunction, forceRefetch = false) {
    // 既にデータがある場合は返す（強制再取得でない限り）
    if (!forceRefetch && this.data.has(key)) {
      return this.data.get(key)
    }

    // 既にローディング中の場合は待機
    if (this.loadingStates.has(key)) {
      return this.loadingStates.get(key)
    }

    // データを取得
    const fetchPromise = this.fetchAndStore(key, fetchFunction)
    this.loadingStates.set(key, fetchPromise)

    try {
      const result = await fetchPromise
      return result
    } finally {
      this.loadingStates.delete(key)
    }
  }

  // データ取得と保存
  async fetchAndStore(key, fetchFunction) {
    try {
      console.log(`📥 データ取得開始: ${key}`)
      const data = await fetchFunction()
      
      if (data !== null && data !== undefined) {
        this.data.set(key, data)
        console.log(`✅ データ保存完了: ${key}`)
        this.notifyListeners('dataUpdated', { key, data })
      }
      
      return data
    } catch (error) {
      console.error(`❌ データ取得エラー: ${key}`, error)
      throw error
    }
  }

  // データの直接設定
  setData(key, data) {
    this.data.set(key, data)
    this.notifyListeners('dataUpdated', { key, data })
  }

  // データの存在確認
  hasData(key) {
    return this.data.has(key)
  }

  // ローディング状態の確認
  isLoading(key) {
    return this.loadingStates.has(key)
  }

  // 特定のデータを削除
  removeData(key) {
    const existed = this.data.delete(key)
    if (existed) {
      this.notifyListeners('dataRemoved', { key })
    }
    return existed
  }

  // パターンマッチングでデータを削除
  removeDataByPattern(pattern) {
    const keysToRemove = []
    for (const key of this.data.keys()) {
      if (key.includes(pattern)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      this.data.delete(key)
      this.notifyListeners('dataRemoved', { key })
    })
    
    return keysToRemove.length
  }

  // リスナーの登録
  addListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // リスナーへの通知
  notifyListeners(event, data = {}) {
    this.listeners.forEach(callback => {
      try {
        callback({ event, ...data })
      } catch (error) {
        console.error('Listener error:', error)
      }
    })
  }

  // 統計情報
  getStats() {
    return {
      totalKeys: this.data.size,
      loadingKeys: this.loadingStates.size,
      currentPath: this.currentPath,
      isInitialized: this.isInitialized,
      keys: Array.from(this.data.keys())
    }
  }

  // デバッグ用：全データの表示
  getAllData() {
    const result = {}
    for (const [key, value] of this.data.entries()) {
      result[key] = value
    }
    return result
  }
}

// シングルトンインスタンス
const appDataManager = new AppDataManager()

// エクスポート
export default appDataManager

// ヘルパー関数群
export const getAppData = (key, fetchFunction, forceRefetch = false) => {
  return appDataManager.getData(key, fetchFunction, forceRefetch)
}

export const setAppData = (key, data) => {
  return appDataManager.setData(key, data)
}

export const hasAppData = (key) => {
  return appDataManager.hasData(key)
}

export const isAppDataLoading = (key) => {
  return appDataManager.isLoading(key)
}

export const removeAppData = (key) => {
  return appDataManager.removeData(key)
}

export const removeAppDataByPattern = (pattern) => {
  return appDataManager.removeDataByPattern(pattern)
}

export const addAppDataListener = (callback) => {
  return appDataManager.addListener(callback)
}

export const getAppDataStats = () => {
  return appDataManager.getStats()
}

export const resetAppData = () => {
  return appDataManager.resetAllData()
}

// データキー生成ヘルパー
export const createDataKey = (type, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|')
  return sortedParams ? `${type}_${sortedParams}` : type
}

// 特定データタイプ用のヘルパー
export const getNPSDataKey = (weekStart, storeId) => {
  return createDataKey('nps_weekly', { weekStart, storeId })
}

export const getSubmissionDataKey = (weekStart, storeId) => {
  return createDataKey('submissions_weekly', { weekStart, storeId })
}

export const getQuestionScoreDataKey = (date, storeId) => {
  return createDataKey('question_scores', { date, storeId })
}

export const getCommentDataKey = (weekStart, storeId) => {
  return createDataKey('comments_weekly', { weekStart, storeId })
}