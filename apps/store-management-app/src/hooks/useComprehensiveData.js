/**
 * 統合データ取得フック - Edge Function版
 * すべての複雑なクエリと計算をサーバーサイドで実行
 * Client側は表示のみに特化
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchEdgeFunction } from '../utils/edgeFunctionCache'
import { supabase } from '../lib/supabase'

export const useComprehensiveData = (options = {}) => {
  const {
    includeUnreadCounts = true,
    includeWeeklyData = true,
    includeNPSAnalysis = false,
    includeLowNPSAlerts = false,
    weekStart = null
  } = options

  const [data, setData] = useState({
    unreadCounts: { comment_count: 0, alert_count: 0 },
    weeklyData: { nps: {}, submissions: {}, comments: {} },
    npsAnalysis: null,
    lowNPSAlerts: [],
    isLoaded: false
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { currentStore, user, loading: authLoading, isInitialized } = useAuth()
  
  // キャッシュと重複実行防止
  const fetchingRef = useRef(false)
  const cacheRef = useRef(new Map())
  const lastFetchTimeRef = useRef(0)
  
  // Edge Function失敗追跡
  const edgeFunctionFailuresRef = useRef(new Map())
  const maxEdgeFunctionRetries = 2 // 2回失敗したら停止
  const edgeFunctionRetryInterval = 30 * 60 * 1000 // 30分間停止

  // フォールバック: 個別クエリでデータ取得
  const fetchDataFallback = useCallback(async (requestedTypes) => {
    console.log('🔄 Fetching data using fallback method')
    
    const fallbackData = {}

    try {
      // 未読数フォールバック
      if (requestedTypes.includes('unread_counts')) {
        const [commentResult, alertResult] = await Promise.all([
          supabase
            .from('review_form_submissions')
            .select('id')
            .eq('store_id', currentStore.store_id)
            .limit(10),
          supabase
            .from('review_form_submissions')
            .select('id')
            .eq('store_id', currentStore.store_id)
            .limit(5)
        ])

        fallbackData.unread_counts = {
          comment_count: commentResult.data?.length || 0,
          alert_count: alertResult.data?.length || 0
        }
      }

      // 週間データフォールバック
      if (requestedTypes.includes('weekly_data') && weekStart) {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)

        const [npsResult, submissionsResult] = await Promise.all([
          supabase
            .from('question_answer_option_linear_scale')
            .select(`
              answer_number,
              created_at,
              review_question_answers!inner (
                store_id,
                review_questions!inner (
                  question_types_id
                )
              )
            `)
            .eq('review_question_answers.store_id', currentStore.store_id)
            .eq('review_question_answers.review_questions.question_types_id', 9)
            .gte('created_at', weekStart.toISOString())
            .lt('created_at', weekEnd.toISOString()),
          
          supabase
            .from('review_form_submissions')
            .select('created_at')
            .eq('store_id', currentStore.store_id)
            .gte('created_at', weekStart.toISOString())
            .lt('created_at', weekEnd.toISOString())
        ])

        // 簡易処理
        const weeklyData = { nps: {}, submissions: {}, comments: {} }
        
        // 7日分初期化
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart)
          date.setDate(weekStart.getDate() + i)
          const dateKey = date.toISOString().split('T')[0]
          weeklyData.nps[dateKey] = null
          weeklyData.submissions[dateKey] = 0
          weeklyData.comments[dateKey] = 0
        }

        // NPS計算（簡易版）
        if (npsResult.data?.length > 0) {
          const scores = npsResult.data.map(item => item.answer_number).filter(Boolean)
          if (scores.length > 0) {
            const promoters = scores.filter(score => score >= 9).length
            const detractors = scores.filter(score => score <= 6).length
            const avgNPS = Math.round(((promoters - detractors) / scores.length) * 100)
            
            // 今日の日付に設定
            const today = new Date().toISOString().split('T')[0]
            if (weeklyData.nps.hasOwnProperty(today)) {
              weeklyData.nps[today] = avgNPS
            }
          }
        }

        // 提出数（簡易版）
        submissionsResult.data?.forEach(item => {
          const dateKey = item.created_at.split('T')[0]
          if (weeklyData.submissions.hasOwnProperty(dateKey)) {
            weeklyData.submissions[dateKey]++
          }
        })

        fallbackData.weekly_data = weeklyData
      }

      return fallbackData

    } catch (error) {
      console.error('❌ Fallback data fetch error:', error)
      return {
        unread_counts: { comment_count: 0, alert_count: 0 },
        weekly_data: { nps: {}, submissions: {}, comments: {} }
      }
    }
  }, [currentStore?.store_id, weekStart])

  // メインデータ取得（Edge Function → フォールバック）
  const fetchComprehensiveData = useCallback(async (forceRefresh = false) => {
    if (!isInitialized || authLoading || !currentStore?.store_id || !user?.id) {
      return
    }

    const now = Date.now()
    
    // レート制限（強化）
    if (!forceRefresh && now - lastFetchTimeRef.current < 10000) {
      console.log('⚠️ Rate limited, skipping fetch (10s minimum interval)')
      return
    }

    // 重複実行防止
    if (fetchingRef.current) {
      console.log('⚠️ Fetch already in progress')
      return
    }

    // リクエストするデータタイプを構築
    const dataTypes = []
    if (includeUnreadCounts) dataTypes.push('unread_counts')
    if (includeWeeklyData) dataTypes.push('weekly_data')
    if (includeNPSAnalysis) dataTypes.push('nps_data')
    if (includeLowNPSAlerts) dataTypes.push('low_nps_alerts')

    if (dataTypes.length === 0) return

    // キャッシュキー
    const cacheKey = `${currentStore.store_id}-${user.id}-${dataTypes.join(',')}-${weekStart?.toISOString().split('T')[0] || 'no-week'}`
    
    // キャッシュチェック
    if (!forceRefresh && cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)
      const age = Date.now() - cached.timestamp
      if (age < 2 * 60 * 1000) { // 2分間有効
        console.log('📦 Using cached comprehensive data')
        setData({ ...cached.data, isLoaded: true })
        return
      }
    }

    fetchingRef.current = true
    lastFetchTimeRef.current = now
    setLoading(true)
    setError(null)

    try {
      // Edge Function失敗履歴をチェック
      const failureKey = `comprehensive-data-${currentStore.store_id}`
      const lastFailure = edgeFunctionFailuresRef.current.get(failureKey)
      
      if (lastFailure && lastFailure.count >= maxEdgeFunctionRetries) {
        const timeSinceLastFailure = now - lastFailure.lastAttempt
        if (timeSinceLastFailure < edgeFunctionRetryInterval) {
          console.log(`⏸️ Edge Function blocked for ${Math.round((edgeFunctionRetryInterval - timeSinceLastFailure) / 60000)}min after ${lastFailure.count} failures, using fallback`)
          throw new Error('Edge Function temporarily blocked due to repeated failures')
        } else {
          // リセット期間が過ぎたら失敗カウンターをリセット
          edgeFunctionFailuresRef.current.delete(failureKey)
        }
      }
      
      console.log('🚀 Fetching comprehensive data from Edge Function')

      // Edge Function呼び出し
      const requestBody = {
        store_id: currentStore.store_id,
        user_id: user.id,
        data_types: dataTypes
      }

      if (weekStart) {
        requestBody.week_start = weekStart.toISOString().split('T')[0]
      }

      const result = await fetchEdgeFunction('comprehensive-data', requestBody, {
        ttl: 2 * 60 * 1000 // 2分間キャッシュ
      })
      
      // 成功したら失敗カウンターをリセット
      edgeFunctionFailuresRef.current.delete(failureKey)
      
      if (result.error) {
        throw new Error(result.error)
      }

      console.log(`✅ Comprehensive data fetched in ${result.computation_time_ms}ms`)

      // データを構造化
      const processedData = {
        unreadCounts: result.unread_counts || { comment_count: 0, alert_count: 0 },
        weeklyData: result.weekly_data || { nps: {}, submissions: {}, comments: {} },
        npsAnalysis: result.nps_data || null,
        lowNPSAlerts: result.low_nps_alerts || [],
        isLoaded: true
      }

      // キャッシュに保存
      cacheRef.current.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      })

      // 古いキャッシュを削除
      if (cacheRef.current.size > 20) {
        const oldestKey = Array.from(cacheRef.current.keys())[0]
        cacheRef.current.delete(oldestKey)
      }

      setData(processedData)

    } catch (edgeFunctionError) {
      // Edge Function失敗を記録
      const failureKey = `comprehensive-data-${currentStore.store_id}`
      const currentFailure = edgeFunctionFailuresRef.current.get(failureKey)
      
      if (currentFailure) {
        currentFailure.count++
        currentFailure.lastAttempt = now
      } else {
        edgeFunctionFailuresRef.current.set(failureKey, {
          count: 1,
          lastAttempt: now
        })
      }
      
      console.warn('⚠️ Edge Function failed, trying fallback:', edgeFunctionError.message)
      
      try {
        // フォールバック実行
        const fallbackResult = await fetchDataFallback(dataTypes)
        
        console.log('✅ Comprehensive data fetched via fallback')
        
        const processedData = {
          unreadCounts: fallbackResult.unread_counts || { comment_count: 0, alert_count: 0 },
          weeklyData: fallbackResult.weekly_data || { nps: {}, submissions: {}, comments: {} },
          npsAnalysis: null, // フォールバックでは分析データなし
          lowNPSAlerts: [], // フォールバックではアラートなし
          isLoaded: true
        }

        setData(processedData)
        
      } catch (fallbackError) {
        console.error('❌ Both Edge Function and fallback failed:', fallbackError)
        setError(fallbackError.message)
      }
    } finally {
      fetchingRef.current = false
      setLoading(false)
    }
  }, [
    isInitialized, 
    authLoading, 
    currentStore?.store_id, 
    user?.id,
    includeUnreadCounts,
    includeWeeklyData,
    includeNPSAnalysis,
    includeLowNPSAlerts,
    weekStart,
    fetchDataFallback
  ])

  // 初回データ取得（依存関係を最小限に）
  useEffect(() => {
    if (isInitialized && !authLoading && currentStore?.store_id && user?.id) {
      fetchComprehensiveData()
    }
  }, [isInitialized, authLoading, currentStore?.store_id, user?.id])

  // アプリリフレッシュイベント
  useEffect(() => {
    const handleAppRefresh = () => {
      console.log('🔄 App refresh: Updating comprehensive data')
      cacheRef.current.clear()
      // Edge Function失敗カウンターもリセット
      edgeFunctionFailuresRef.current.clear()
      fetchComprehensiveData(true)
    }
    
    window.addEventListener('app-refresh', handleAppRefresh)
    return () => {
      window.removeEventListener('app-refresh', handleAppRefresh)
    }
  }, [])

  // 日付別データアクセサー
  const getNPSForDate = useCallback((date) => {
    const dateKey = date.toISOString().split('T')[0]
    return data.weeklyData.nps[dateKey] || null
  }, [data.weeklyData.nps])

  const getSubmissionsForDate = useCallback((date) => {
    const dateKey = date.toISOString().split('T')[0]
    return data.weeklyData.submissions[dateKey] || 0
  }, [data.weeklyData.submissions])

  const getCommentsForDate = useCallback((date) => {
    const dateKey = date.toISOString().split('T')[0]
    return data.weeklyData.comments[dateKey] || 0
  }, [data.weeklyData.comments])

  // 週間平均計算
  const weeklyAverage = Object.values(data.weeklyData.nps).filter(v => v !== null).length > 0
    ? Math.round(Object.values(data.weeklyData.nps).filter(v => v !== null).reduce((a, b) => a + b, 0) / Object.values(data.weeklyData.nps).filter(v => v !== null).length)
    : null

  return {
    // データ（表示準備完了）
    unreadCounts: data.unreadCounts,
    weeklyData: data.weeklyData,
    npsAnalysis: data.npsAnalysis,
    lowNPSAlerts: data.lowNPSAlerts,
    
    // 日付別アクセサー（Client表示用）
    getNPSForDate,
    getSubmissionsForDate,
    getCommentsForDate,
    weeklyAverage,
    
    // 状態
    loading,
    error,
    isLoaded: data.isLoaded,
    
    // 制御
    refetch: () => {
      // 手動リフレッシュ時は失敗カウンターもリセット
      edgeFunctionFailuresRef.current.clear()
      cacheRef.current.clear()
      return fetchComprehensiveData(true)
    },
    
    // 互換性API
    commentCount: data.unreadCounts.comment_count,
    alertCount: data.unreadCounts.alert_count,
    totalUnreadCount: data.unreadCounts.comment_count + data.unreadCounts.alert_count
  }
}