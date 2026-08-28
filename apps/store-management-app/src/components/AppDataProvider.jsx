/**
 * アプリデータプロバイダー
 * アプリレベルでのデータ管理とルート監視
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import appDataManager, {
  addAppDataListener,
  getAppDataStats,
  resetAppData
} from '../utils/appDataManager'
import { useComprehensiveData } from '../hooks/useComprehensiveData'

// アプリデータコンテキスト
const AppDataContext = createContext({
  stats: null,
  isDataReset: false,
  lastResetTime: null,
  forceRefresh: () => {},
  getDataAge: () => null,
  unreadCounts: { comments: 0, alerts: 0 },
  weeklyDataCache: null
})

export const useAppDataContext = () => {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error('useAppDataContext must be used within AppDataProvider')
  }
  return context
}

const AppDataProvider = ({ children }) => {
  const [stats, setStats] = useState(null)
  const [isDataReset, setIsDataReset] = useState(false)
  const [lastResetTime, setLastResetTime] = useState(null)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // 今週の開始日を計算（月曜日）
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - daysToMonday)
    monday.setHours(0, 0, 0, 0)
    return monday
  })
  
  const location = useLocation()
  const { isInitialized } = useAuth()
  
  // 統合Edge Function hook（全データをサーバーサイドで処理）
  const comprehensiveData = useComprehensiveData({
    includeUnreadCounts: true,
    includeWeeklyData: true,
    includeNPSAnalysis: true,
    includeLowNPSAlerts: true,
    weekStart: currentWeekStart
  })

  // ルート変更の監視
  const prevLocationRef = useRef(location.pathname)
  const comprehensiveDataRefetchRef = useRef(comprehensiveData.refetch)

  // refetch関数の参照を最新に保つ
  useEffect(() => {
    comprehensiveDataRefetchRef.current = comprehensiveData.refetch
  }, [comprehensiveData.refetch])

  useEffect(() => {
    const prevPath = prevLocationRef.current
    const currentPath = location.pathname

    // ルート(/)にアクセスした場合はデータリセット
    if (currentPath === '/') {
      console.log('🔄 ルートアクセス検出 - アプリデータをリセット')
      resetAppData()
      setIsDataReset(true)
      setLastResetTime(new Date())
    } else {
      setIsDataReset(false)
    }

    // コメントページから別のページに移動した時に未読カウントを更新
    if (prevPath === '/comment' && currentPath !== '/comment') {
      console.log('🔄 コメントページから離脱 - 未読カウントを更新')
      // 少し遅延させてrecordCommentPageLeaveが完了するのを待つ
      setTimeout(() => {
        comprehensiveDataRefetchRef.current?.()
      }, 500)
    }

    prevLocationRef.current = currentPath
  }, [location.pathname])

  // 統計の定期更新
  useEffect(() => {
    const updateStats = () => {
      setStats(getAppDataStats())
    }

    updateStats()
    const interval = setInterval(updateStats, 10000) // 10秒間隔

    return () => clearInterval(interval)
  }, [])

  // アプリデータの変更を監視
  useEffect(() => {
    const unsubscribe = addAppDataListener(({ event, ...data }) => {
      if (event === 'dataReset') {
        setIsDataReset(true)
        setLastResetTime(new Date())
        console.log('📊 アプリデータがリセットされました')
      } else if (event === 'dataUpdated') {
        console.log(`📊 データ更新: ${data.key}`)
      }
      
      // 統計を更新
      setStats(getAppDataStats())
    })

    return unsubscribe
  }, [])

  // 強制リフレッシュ
  const forceRefresh = () => {
    console.log('🔄 アプリデータを強制リフレッシュ')
    resetAppData()
    setIsDataReset(true)
    setLastResetTime(new Date())
  }

  // データの年齢を取得（いつ取得されたかの推定）
  const getDataAge = (key) => {
    // 実装はappDataManagerに追加が必要
    return null
  }

  const contextValue = {
    stats,
    isDataReset,
    lastResetTime,
    forceRefresh,
    getDataAge,
    currentPath: location.pathname,
    isOnRootPath: location.pathname === '/',
    // 統合Edge Function data（表示準備完了）
    unreadCounts: {
      comments: comprehensiveData.commentCount,
      alerts: comprehensiveData.alertCount,
      total: comprehensiveData.totalUnreadCount,
      loading: comprehensiveData.loading,
      error: comprehensiveData.error,
      refresh: comprehensiveData.refetch
    },
    weeklyDataCache: {
      data: comprehensiveData.weeklyData,
      loading: comprehensiveData.loading,
      error: comprehensiveData.error,
      getNPSForDate: comprehensiveData.getNPSForDate,
      getSubmissionsForDate: comprehensiveData.getSubmissionsForDate,
      getCommentsForDate: comprehensiveData.getCommentsForDate,
      weeklyAverage: comprehensiveData.weeklyAverage,
      refetch: comprehensiveData.refetch
    },
    npsAnalysis: comprehensiveData.npsAnalysis,
    lowNPSAlerts: comprehensiveData.lowNPSAlerts,
    currentWeekStart,
    setCurrentWeekStart
  }

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  )
}

// デバッグ情報表示コンポーネント
const AppDataDebugInfo = ({ stats, isDataReset, lastResetTime, currentPath }) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      left: '10px', 
      zIndex: 9999 
    }}>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          padding: '5px 10px',
          backgroundColor: isDataReset ? '#ff6b6b' : '#4ecdc4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        📊 AppData {isDataReset ? '(Reset)' : `(${stats?.totalKeys || 0})`}
      </button>
      
      {isVisible && (
        <div style={{
          position: 'absolute',
          bottom: '35px',
          left: '0',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '11px',
          minWidth: '250px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div><strong>📍 現在のパス:</strong> {currentPath}</div>
          <div><strong>🔄 リセット状態:</strong> {isDataReset ? 'YES' : 'NO'}</div>
          {lastResetTime && (
            <div><strong>⏰ 最終リセット:</strong> {lastResetTime.toLocaleTimeString()}</div>
          )}
          <div><strong>📦 保持データ数:</strong> {stats?.totalKeys || 0}</div>
          <div><strong>⏳ ローディング中:</strong> {stats?.loadingKeys || 0}</div>
          {stats?.keys && stats.keys.length > 0 && (
            <div>
              <strong>🔑 データキー:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '10px' }}>
                {stats.keys.slice(0, 5).map((key, index) => (
                  <li key={index}>{key}</li>
                ))}
                {stats.keys.length > 5 && <li>...他{stats.keys.length - 5}件</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AppDataProvider