// プリセット質問のコメントを取得するフック（Edge Function経由）
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// QSCテーマの日本語マッピング
const QSC_THEME_MAP = {
  quality: '料理・ドリンク',
  service: '接客・対応',
  cleanliness: '清潔さ・衛生'
}

// QSCテーマ × question_number による質問テキストマッピング（ページ4の質問文）
const QSC_QUESTION_MAP = {
  quality: {
    1: '料理について、良かった点や改善してほしい点があればお聞かせください',
    2: 'ドリンクについて、良かった点や改善してほしい点があればお聞かせください',
    3: 'メニューについて、良かった点や改善点があればお聞かせください',
    4: '当店ならではの魅力、または他店と比べて物足りない点があればお聞かせください',
    5: 'その他、気になる点があればご記入ください。'
  },
  service: {
    1: '入店から注文までの接客で、良かった点や気になった点があればお聞かせください',
    2: '提供スピードや正確さについて、良かった点や気になった点があればお聞かせください',
    3: 'スタッフの対応で、良かった点や改善してほしい点があればお聞かせください',
    4: '特に良かったスタッフがいれば、その理由を教えてください',
    5: 'その他、気になる点があればご記入ください。'
  },
  cleanliness: {
    1: '店内環境（外観・床・空気・整頓・トイレ）で良かった点や気になった点があればお聞かせください',
    2: 'テーブル・椅子・食器など、座席周りで良かった点や気になった点があればお聞かせください',
    3: 'スタッフの身だしなみで良かった点や気になった点があればお聞かせください',
    4: 'その他、気になる点があればご記入ください。'
  }
}

// QSCテーマとquestion_numberから質問テキストを取得
const getQuestionText = (selectedQsc, questionNumber) => {
  if (!selectedQsc || !questionNumber) return null
  const themeQuestions = QSC_QUESTION_MAP[selectedQsc]
  if (!themeQuestions) return null
  return themeQuestions[questionNumber] || null
}

// p1_q3の値から新規/リピーター判定
const getVisitorType = (p1_q3) => {
  if (!p1_q3) return null
  // "初めて"のみ新規、それ以外はリピーター
  return p1_q3 === '初めて' ? '新規' : 'リピーター'
}

// p1_q2から再来店意向を取得
const getRevisitIntention = (p1_q2) => {
  if (p1_q2 === null || p1_q2 === undefined) return null
  return p1_q2 ? 'あり' : 'なし'
}

export const usePresetComments = (selectedDate, dateRange, filterType, userRole = null) => {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { currentStore, loading: authLoading, isInitialized } = useAuth()

  // 最新の fetch 関数を Realtime callback から呼び出すための ref
  const fetchRef = useRef(null)
  // INSERT/UPDATE が連続して飛んできた時に過剰に fetch しないためのデバウンス
  const debounceRef = useRef(null)
  // 最終取得時刻 (visibility 復帰時に「古ければ再取得」判定に使う)
  const lastFetchTimeRef = useRef(0)

  useEffect(() => {
    // 認証が初期化されていない場合は待機
    if (!isInitialized || authLoading) {
      return
    }

    // currentStoreが取得できない場合は早期リターン
    if (!currentStore?.store_id) {
      setComments([])
      setLoading(false)
      return
    }

    // filterTypeが'loading'の場合は初期化中なのでAPIを呼ばない
    if (filterType === 'loading') {
      return
    }

    fetchPresetComments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, dateRange?.start, dateRange?.end, filterType, currentStore?.store_id, isInitialized, authLoading, userRole])

  // ===== Realtime subscription =====
  // 店舗管理者は常に、スタッフは staff_view_mode='realtime' のときだけ
  // preset_question_answer_comment テーブルの INSERT/UPDATE/DELETE を購読し
  // 新しいコメントや 表示状態の変化を瞬時に画面に反映する
  const role = userRole || currentStore?.role
  const isStaff = String(role || '').toUpperCase() === 'STAFF'
  const staffViewMode = currentStore?.stores?.staff_view_mode || 'weekly'
  const realtimeEnabled = !!currentStore?.store_id && (!isStaff || staffViewMode === 'realtime')

  useEffect(() => {
    // 最新の fetch 関数を ref に保持 (subscription を再構築せずに refresh できる)
    fetchRef.current = () => {
      if (!currentStore?.store_id) return
      fetchPresetComments()
    }
  })

  // 画面が見える状態に戻ったときの自動再取得
  // (Realtime が切れていたり、PWA バックグラウンド復帰でデータが古くなる問題への保険。
  //  STAFF + weekly モードで Realtime 無効でも、これにより画面復帰時に最新を取得できる)
  useEffect(() => {
    if (!currentStore?.store_id) return

    const STALE_THRESHOLD_MS = 30 * 1000 // 30秒以上経過していたら再取得
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      const elapsed = Date.now() - lastFetchTimeRef.current
      if (elapsed < STALE_THRESHOLD_MS) return
      console.log('usePresetComments: Page became visible, refetching (elapsed:', elapsed, 'ms)')
      fetchRef.current?.()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [currentStore?.store_id])

  useEffect(() => {
    if (!realtimeEnabled) return

    const triggerRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        fetchRef.current?.()
      }, 600)
    }

    const channel = supabase
      .channel(`preset-comments-${currentStore.store_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'preset_question_answer_comment'
      }, () => {
        // payload には store_id が直接ないため 自店舗判定は fetch 側 (Edge Function) に委ねる
        triggerRefresh()
      })
      .subscribe()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [realtimeEnabled, currentStore?.store_id])

  const fetchPresetComments = async () => {
    try {
      setLoading(true)
      setError(null)

      // 日付範囲を決定
      const { startDate, endDate } = getDateRange()

      // userRoleが渡されていない場合はcurrentStoreから取得
      const role = userRole || currentStore?.role

      console.log('usePresetComments: Fetching via Edge Function', {
        store_id: currentStore.store_id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        user_role: role
      })

      // Edge Function経由でデータを取得
      // 応答が15秒以内に返らない場合はタイムアウト扱いにする (PWA バックグラウンド復帰や
      // 5G ハンドオフで応答が宙ぶらりんになり skeleton が永久表示になる問題への対処)
      const FETCH_TIMEOUT_MS = 15000
      const fetchPromise = supabase.functions.invoke('preset-comments', {
        body: {
          store_id: currentStore.store_id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          user_role: role
        }
      })
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('応答に時間がかかっています。通信状況をご確認のうえ、もう一度お試しください。')),
          FETCH_TIMEOUT_MS
        )
      })
      const { data, error: functionError } = await Promise.race([fetchPromise, timeoutPromise])

      if (functionError) {
        console.error('usePresetComments: Edge Function error', functionError)
        throw new Error(functionError.message || 'Failed to fetch comments')
      }

      if (!data.success) {
        console.error('usePresetComments: API error', data.error)
        throw new Error(data.error || 'Failed to fetch comments')
      }

      console.log('usePresetComments: Data received', { count: data.count })

      // データを整形
      const formattedComments = (data.comments || [])
        .filter(c => c.preset_question_answer) // JOINできたもののみ
        .map(comment => {
          const answer = comment.preset_question_answer
          const qscTheme = QSC_THEME_MAP[comment.selected_qsc] || comment.selected_qsc
          const visitorType = getVisitorType(answer.p1_q3)
          const revisitIntention = getRevisitIntention(answer.p1_q2)
          const questionText = getQuestionText(comment.selected_qsc, comment.question_number)

          // 属性を構築
          const attributes = []

          if (visitorType) {
            attributes.push({
              questionId: 'visitor_type',
              choiceName: visitorType
            })
          }

          if (revisitIntention) {
            attributes.push({
              questionId: 'revisit',
              choiceName: `再来店${revisitIntention}`
            })
          }

          return {
            id: comment.id,
            category: qscTheme,
            categoryStyle: getCategoryStyle(qscTheme),
            datetime: formatDateTime(comment.created_at),
            timestamp: new Date(comment.created_at),
            content: comment.comment,
            npsScore: answer.p1_q1,
            attributes: attributes,
            isPositive: comment.is_positive,
            questionNumber: comment.question_number,
            selectedQsc: comment.selected_qsc,
            questionText: questionText,
            isHidden: comment.is_hidden || false,
            // 性別 (p1_q4: '男性'/'女性'/'その他') と 年齢区分 (p1_q5: '20歳~24歳' 等)
            // AnswerApp の必須設問 required_1_4 / required_1_5 に対応
            gender: answer.p1_q4 || null,
            ageGroup: answer.p1_q5 || null
          }
        })

      // 日時順でソート
      const sortedComments = formattedComments.sort((a, b) => b.timestamp - a.timestamp)

      setComments(sortedComments)
      lastFetchTimeRef.current = Date.now()

    } catch (err) {
      console.error('usePresetComments: Error', err)
      setError(err.message)
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  // 日付範囲を決定
  const getDateRange = () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let startDate, endDate

    // selectedDateがある場合は、フィルタータイプに関係なく優先
    if (selectedDate) {
      startDate = new Date(selectedDate)
      endDate = new Date(selectedDate)
    } else if (filterType === 'today') {
      startDate = new Date(today)
      endDate = new Date(today)
    } else if (filterType === 'yesterday') {
      startDate = new Date(yesterday)
      endDate = new Date(yesterday)
    } else if (filterType === 'custom' && dateRange?.start && dateRange?.end) {
      startDate = new Date(dateRange.start)
      endDate = new Date(dateRange.end)
    } else if (filterType === 'last_7_days') {
      // 直近1週間 (新井さん要望: 普段は1日/1週間単位で見るため、デフォルトを軽くする)
      startDate = new Date(today)
      startDate.setDate(startDate.getDate() - 7)
      endDate = new Date(today)
    } else {
      // デフォルトはすべての期間
      startDate = new Date('2020-01-01')
      endDate = new Date(today)
    }

    // 時刻を設定
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    return { startDate, endDate }
  }

  // 日時フォーマット
  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hours}:${minutes}`
  }

  // カテゴリスタイル（QSCテーマ用）
  const getCategoryStyle = (categoryName) => {
    const colorMap = {
      '料理・ドリンク': '#f59e0b', // amber
      '接客・対応': '#3b82f6',     // blue
      '清潔さ・衛生': '#10b981'    // emerald
    }

    const color = colorMap[categoryName] || '#64748b'

    return {
      backgroundColor: color,
      borderColor: color,
      color: '#ffffff'
    }
  }

  return { comments, loading, error, refetch: fetchPresetComments }
}
