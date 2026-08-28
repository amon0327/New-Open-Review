// 未読コメント数を取得するフック（修正版）
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { executeWithConnection } from '../utils/connectionManager'

export const useUnreadCommentCount = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const { currentStore, user, loading: authLoading, isInitialized } = useAuth()

  useEffect(() => {
    // 認証が初期化されていない場合は待機
    if (!isInitialized || authLoading) {
      return
    }
    
    // currentStoreまたはuserが取得できない場合は早期リターン
    if (!currentStore?.store_id || !user?.id) {
      setUnreadCount(0)
      setError(null)
      return
    }
    
    // 既にローディング中の場合はスキップ
    if (loading) {
      return
    }
    
    fetchUnreadCount()
  }, [currentStore?.store_id, user?.id, isInitialized, authLoading])

  const fetchUnreadCount = async () => {
    try {
      setLoading(true)
      setError(null)

      // 10秒タイムアウトを設定
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('データ取得がタイムアウトしました')), 10000)
      })

      console.log('fetchUnreadCount: starting for user', user.id, 'store', currentStore.store_id)
      
      // データ取得処理をPromise.raceでタイムアウト制御
      const dataFetchPromise = executeWithConnection(async () => {
        // 現在のSupabaseセッション情報を確認
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`)
      }
      
      console.log('fetchUnreadCount: current session valid:', !!session?.user)
      
      // auth.uid()の値を確認
      const authUid = session?.user?.id
      console.log('fetchUnreadCount: auth.uid() equivalent:', authUid)
      console.log('fetchUnreadCount: user.id === auth.uid():', user.id === authUid)

      // Step 1: 最後にコメントページから離れた時刻を取得
      console.log('fetchUnreadCount: Step 1 - Getting last left time...')
      const { data: lastViewData, error: viewError } = await supabase
        .from('comment_page_view_log')
        .select('left_at')
        .eq('business_user_id', user.id)
        .order('id', { ascending: false })
        .limit(1)

      if (viewError) {
        console.warn('fetchUnreadCount: Warning - comment_page_view_log access failed:', viewError.message)
        console.log('fetchUnreadCount: This might be normal if the table does not exist yet')
        // comment_page_view_logが存在しないかアクセスできない場合、全コメントを未読として扱う
      }

      const lastLeftTime = lastViewData?.[0]?.left_at
      const timeThreshold = lastLeftTime || '1970-01-01T00:00:00Z'
      console.log('fetchUnreadCount: time threshold (left_at):', timeThreshold)

      // Step 2: コメント質問IDを取得
      console.log('fetchUnreadCount: Step 2 - Getting comment question IDs...')
      const { data: displaySettings, error: displayError } = await supabase
        .from('question_display_settings')
        .select('review_question_id')
        .eq('display_type', 'comment')
      
      if (displayError) {
        throw new Error(`Display settings error: ${displayError.message}`)
      }
      
      const commentQuestionIds = displaySettings?.map(setting => setting.review_question_id).filter(id => id !== null) || []
      console.log('fetchUnreadCount: found comment question IDs:', commentQuestionIds.length)
      
      if (commentQuestionIds.length === 0) {
        console.log('fetchUnreadCount: no comment questions configured, setting count to 0')
        setUnreadCount(0)
        return
      }

      // Step 3: 対象店舗の未読コメント数を取得
      console.log('fetchUnreadCount: Step 3 - Getting unread comments for store:', currentStore.store_id)
      
      // 改良された方法: review_question_answersから直接カウントし、JOINの複雑さを回避
      const { data: unreadAnswers, error: answersError } = await supabase
        .from('review_question_answers')
        .select(`
          id,
          review_form_submissions_id,
          created_at,
          store_id
        `)
        .eq('store_id', currentStore.store_id)
        .in('review_questions_id', commentQuestionIds)
        .gt('created_at', timeThreshold)

      if (answersError) {
        throw new Error(`Answers query error: ${answersError.message}`)
      }

      console.log('fetchUnreadCount: found unread answers:', unreadAnswers?.length || 0)

      if (!unreadAnswers || unreadAnswers.length === 0) {
        setUnreadCount(0)
        return
      }

      // Step 4: 実際のテキストコンテンツがあるコメントのみをフィルタリング
      console.log('fetchUnreadCount: Step 4 - Filtering answers with actual text content...')
      
      const answerIds = unreadAnswers.map(answer => answer.id)
      
      // question_answer_textsテーブルから実際のテキストがあるものを確認
      const { data: actualTexts, error: textsError } = await supabase
        .from('question_answer_texts')
        .select('review_questions_answers_id')
        .in('review_questions_answers_id', answerIds)
        .not('answer_text', 'is', null)
        .not('answer_text', 'eq', '')

      if (textsError) {
        console.warn('fetchUnreadCount: Warning - question_answer_texts query failed:', textsError.message)
        // テキストテーブルアクセスに失敗した場合は、review_question_answersの数をそのまま使用
        const uniqueSubmissions = [...new Set(unreadAnswers.map(a => a.review_form_submissions_id).filter(id => id !== null))]
        setUnreadCount(uniqueSubmissions.length)
        return
      }

      const validAnswerIds = new Set(actualTexts?.map(text => text.review_questions_answers_id) || [])
      const validAnswers = unreadAnswers.filter(answer => validAnswerIds.has(answer.id))
      
      // ユニークなsubmission_idの数を返す（重複を除去）
      const uniqueSubmissionIds = [...new Set(validAnswers.map(answer => answer.review_form_submissions_id).filter(id => id !== null))]
      
        console.log('fetchUnreadCount: final valid answers:', validAnswers.length)
        console.log('fetchUnreadCount: unique submission IDs:', uniqueSubmissionIds.length)
        
        return uniqueSubmissionIds.length
      }, 'unread-comment-count')

      // タイムアウト制御
      const result = await Promise.race([dataFetchPromise, timeoutPromise])
      setUnreadCount(result)

    } catch (err) {
      console.error('Error fetching unread comment count:', err)
      setError(err.message)
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  // コメントページにアクセスしたことを記録する関数
  const recordCommentPageView = async () => {
    try {
      if (!user?.id || isRecording) {
        console.log('recordCommentPageView: No user ID available or already recording')
        return
      }

      setIsRecording(true)

      console.log('recordCommentPageView: recording access for user', user.id)
      
      // 現在のSupabaseセッション情報を確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`)
      }
      
      const authUid = session?.user?.id
      console.log('recordCommentPageView: auth.uid() equivalent:', authUid)
      console.log('recordCommentPageView: user.id === auth.uid():', user.id === authUid)

      // 既存レコードがあるか確認してからINSERTまたはUPDATE
      const { data: existingRecord, error: fetchError } = await supabase
        .from('comment_page_view_log')
        .select('id')
        .eq('business_user_id', user.id)
        .limit(1)

      if (fetchError) {
        console.error('recordCommentPageView: Error fetching existing record:', fetchError)
        throw fetchError
      }

      let error
      if (existingRecord && existingRecord.length > 0) {
        // 既存レコードを更新
        const { error: updateError } = await supabase
          .from('comment_page_view_log')
          .update({
            accessed_at: new Date().toISOString(),
            left_at: null // アクセス時はleft_atをクリア
          })
          .eq('business_user_id', user.id)
        error = updateError
      } else {
        // 新規レコードを挿入
        const { error: insertError } = await supabase
          .from('comment_page_view_log')
          .insert({
            business_user_id: user.id,
            accessed_at: new Date().toISOString(),
            left_at: null
          })
        error = insertError
      }

      if (error) {
        console.error('recordCommentPageView: Error recording page access:', error)
        throw error
      }
      
      console.log('recordCommentPageView: Successfully recorded page access')
      
      // 記録後、未読数を再計算（ただし無限ループを避けるため少し遅延）
      setTimeout(() => {
        fetchUnreadCount()
      }, 100)
    } catch (err) {
      console.error('Error recording comment page view:', err)
      // エラーが発生してもアプリケーションの動作は継続
    } finally {
      setIsRecording(false)
    }
  }

  // コメントページから離れたことを記録する関数
  const recordCommentPageLeave = async () => {
    try {
      if (!user?.id) {
        console.log('recordCommentPageLeave: No user ID available')
        return
      }

      console.log('recordCommentPageLeave: recording leave for user', user.id)
      
      // executeWithConnectionを使用して確実に記録
      await executeWithConnection(async () => {
        // left_atを更新（同じbusiness_user_idのレコードを直接更新）
        const { error: updateError } = await supabase
          .from('comment_page_view_log')
          .update({
            left_at: new Date().toISOString()
          })
          .eq('business_user_id', user.id)

        if (updateError) {
          console.error('recordCommentPageLeave: Error updating leave time:', updateError)
          throw updateError
        }
        
        console.log('recordCommentPageLeave: Successfully recorded page leave')
        return true
      }, 'record-comment-leave')
      
      // 離脱後、未読数を再計算（少し遅延してから）
      setTimeout(() => {
        fetchUnreadCount()
      }, 200)
    } catch (err) {
      console.error('Error recording comment page leave:', err)
      // エラーが発生してもアプリケーションの動作は継続
    }
  }

  // 同期的な離脱記録（ページアンロード時用）
  const recordCommentPageLeaveSync = () => {
    if (!user?.id) return
    
    // navigator.sendBeacon を使用してブラウザ終了時でも確実に送信
    const data = JSON.stringify({
      business_user_id: user.id,
      left_at: new Date().toISOString()
    })
    
    try {
      // 可能であればbeaconで送信
      if (navigator.sendBeacon) {
        const url = `${supabase.supabaseUrl}/rest/v1/comment_page_view_log?business_user_id=eq.${user.id}`
        const headers = {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`
        }
        
        const blob = new Blob([JSON.stringify({
          left_at: new Date().toISOString()
        })], { type: 'application/json' })
        
        // 実際のHTTP PATCHリクエストはbeaconでは難しいので、通常のfetchを使用
        fetch(url, {
          method: 'PATCH',
          headers,
          body: blob,
          keepalive: true
        }).catch(err => console.error('Sync leave record failed:', err))
      }
    } catch (err) {
      console.error('Error in sync leave record:', err)
    }
  }

  // 手動でリフレッシュする関数
  const refreshUnreadCount = () => {
    if (currentStore?.store_id && user?.id) {
      fetchUnreadCount()
    }
  }

  // 最後のページ離脱時刻を取得する関数
  const getLastLeaveTime = async () => {
    try {
      if (!user?.id) return null

      console.log('getLastLeaveTime: getting for user', user.id)
      
      const { data: lastViewData, error: viewError } = await supabase
        .from('comment_page_view_log')
        .select('left_at')
        .eq('business_user_id', user.id)
        .not('left_at', 'is', null)
        .order('left_at', { ascending: false })
        .limit(1)

      if (viewError) {
        console.warn('getLastLeaveTime: Warning - could not get last leave time:', viewError.message)
        return null
      }

      console.log('getLastLeaveTime: result:', lastViewData?.[0]?.left_at)
      return lastViewData?.[0]?.left_at || null
    } catch (err) {
      console.error('Error getting last leave time:', err)
      return null
    }
  }

  return {
    unreadCount,
    loading,
    error,
    refreshUnreadCount,
    recordCommentPageView,
    recordCommentPageLeave,
    getLastLeaveTime
  }
}

export default useUnreadCommentCount