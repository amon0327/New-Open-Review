import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { usePresetComments } from '../hooks/usePresetComments'
import { useAuth } from '../contexts/AuthContext'
import { useUnreadCommentCount } from '../hooks/useUnreadCommentCount'
import { supabase } from '../lib/supabase'
import SkeletonScreen from '../components/SkeletonScreen'
import BottomNav from '../components/BottomNav'
import BroadcastPage from '../components/broadcast/BroadcastPage'
import { fetchLineQuota } from '../lib/lineMessaging'
import { SkKpiGrid, SkChart, SkSettings, SkList } from '../components/Skeleton'
import './CommentPage.css'

// 日付をフォーマット (YYYY/MM/DD)
const formatDateDisplay = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

// input用の日付フォーマット (YYYY-MM-DD)
const formatDateInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 回答日時を「5月13日 14:30」形式で表示する関数
// (「1日前」のような相対表示は何時に回答されたか分かりにくいため絶対日時で表示)
const formatTimeAgo = (date) => {
  const target = new Date(date)
  if (isNaN(target.getTime())) return ''
  const month = target.getMonth() + 1
  const day = target.getDate()
  const hours = String(target.getHours()).padStart(2, '0')
  const minutes = String(target.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}

// NPSカテゴリを取得
const getNpsCategory = (score) => {
  if (score >= 9) return 'promoter'
  if (score >= 7) return 'passive'
  return 'detractor'
}

// CSV 出力用: NPSスコアから日本語の評価区分を返す
const getNpsLabelJa = (score) => {
  if (score == null) return ''
  if (score >= 9) return '推奨者'
  if (score >= 7) return '中立者'
  return '批判者'
}

// CSV 出力用: コメントの attributes 配列から特定の属性値を取り出す
const getAttributeValue = (attributes, questionId) => {
  if (!Array.isArray(attributes)) return ''
  const attr = attributes.find(a => a?.questionId === questionId)
  return attr?.choiceName || ''
}

// CSV 出力用: RFC 4180 準拠のフィールドエスケープ
const escapeCsvField = (val) => {
  const s = val == null ? '' : String(val)
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

// CSV 出力用: コメント配列を Excel で開ける CSV テキスト (UTF-8 BOM + CRLF) に変換
const commentsToCsv = (comments) => {
  const headers = ['日付', '時刻', 'コメント', '推奨スコア', '評価区分', '再来店意向', '来客タイプ', '性別', '年代']
  const lines = [headers.map(escapeCsvField).join(',')]
  for (const c of comments) {
    const d = c.timestamp instanceof Date ? c.timestamp : new Date(c.timestamp)
    const y = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')

    const visitor = getAttributeValue(c.attributes, 'visitor_type')
    // attribute では '再来店あり' / '再来店なし' で保存されているので 'あり' / 'なし' に整形
    const revisit = getAttributeValue(c.attributes, 'revisit').replace('再来店', '')

    const row = [
      `${y}-${mm}-${dd}`,
      `${hh}:${mi}`,
      c.content || '',
      c.npsScore != null ? c.npsScore : '',
      getNpsLabelJa(c.npsScore),
      revisit,
      visitor,
      c.gender || '',
      c.ageGroup || ''
    ]
    lines.push(row.map(escapeCsvField).join(','))
  }
  // 先頭に UTF-8 BOM を付与 (Excel で開いた際の文字化け防止)
  return '﻿' + lines.join('\r\n')
}

// CSV 出力用: テキストを CSV ファイルとしてダウンロード
const downloadCsv = (filename, csvText) => {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// NPSスコアボックスコンポーネント
const NpsScoreBox = ({ score }) => {
  if (score === null || score === undefined) return null

  const category = getNpsCategory(score)

  return (
    <div className="nps-box-container">
      {Array.from({ length: 11 }, (_, i) => {
        const isFilled = i <= score
        return (
          <div
            key={i}
            className={`nps-square ${isFilled ? `nps-square-filled nps-${category}` : 'nps-square-empty'}`}
          >
            {i}
          </div>
        )
      })}
    </div>
  )
}

// 属性バッジコンポーネント
const AttributeBadges = ({ attributes }) => {
  if (!attributes || attributes.length === 0) return null

  // 属性タイプに基づいてアイコンとスタイルを決定
  const getAttributeStyle = (choiceName) => {
    const name = choiceName

    // リピーター判定
    if (name === 'リピーター') {
      return { icon: 'history', className: 'attr-indigo' }
    }
    // 新規判定
    if (name === '新規') {
      return { icon: 'person_add', className: 'attr-sky' }
    }
    // 再来店あり
    if (name === '再来店あり') {
      return { icon: 'check_circle', className: 'attr-emerald', filled: true }
    }
    // 再来店なし
    if (name === '再来店なし') {
      return { icon: 'cancel', className: 'attr-rose', filled: true }
    }

    return { icon: 'label', className: 'attr-slate' }
  }

  return (
    <div className="attribute-badges">
      {attributes.map((attr, index) => {
        const style = getAttributeStyle(attr.choiceName)
        return (
          <div key={index} className={`attribute-badge ${style.className}`}>
            <span className={`material-symbols-outlined ${style.filled ? 'fill-icon' : ''}`}>
              {style.icon}
            </span>
            <span>{attr.choiceName}</span>
          </div>
        )
      })}
    </div>
  )
}

// レビューカードコンポーネント
const ReviewCard = ({ comment, isNew, isStaff, storeId, onVisibilityChange, isSaved, onSaveToggle }) => {
  const [isHidden, setIsHidden] = useState(comment.isHidden || false)
  const npsCategory = comment.npsScore !== null ? getNpsCategory(comment.npsScore) : null

  const handleSave = () => {
    // 楽観的UIで即座に更新
    onSaveToggle(comment.id, !isSaved)
  }

  const handleHide = () => {
    if (isStaff) return // staffは操作不可

    // 楽観的UIで即座に更新
    const newHiddenState = !isHidden
    setIsHidden(newHiddenState)

    if (onVisibilityChange) {
      onVisibilityChange(comment.id, newHiddenState)
    }

    // バックグラウンドでデータベースを更新
    supabase.functions.invoke('update-comment-visibility', {
      body: {
        comment_id: comment.id,
        is_hidden: newHiddenState,
        store_id: storeId
      }
    }).then(({ data, error }) => {
      if (error || !data?.success) {
        console.error('Failed to update visibility:', error)
        // 失敗した場合は元に戻す
        setIsHidden(!newHiddenState)
        if (onVisibilityChange) {
          onVisibilityChange(comment.id, !newHiddenState)
        }
      }
    }).catch(err => {
      console.error('Error updating visibility:', err)
      // 失敗した場合は元に戻す
      setIsHidden(!newHiddenState)
      if (onVisibilityChange) {
        onVisibilityChange(comment.id, !newHiddenState)
      }
    })
  }

  return (
    <div className={`review-card ${isHidden ? 'hidden-comment' : ''}`}>
      {/* NEWバッジ */}
      {isNew && (
        <div className="card-header">
          <span className="new-badge">NEW</span>
        </div>
      )}

      {/* 質問ラベルとアクションボタン */}
      <div className="card-top-row">
        <span className="question-label">質問内容</span>
        <div className="card-top-actions">
          {!isStaff && (
            <button
              className={`action-btn ${isHidden ? 'active-hide' : ''}`}
              onClick={handleHide}
              title={isHidden ? '非表示解除' : '非表示'}
            >
              <span className={`material-symbols-outlined ${isHidden ? 'fill-icon' : ''}`}>
                {isHidden ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          )}
          <button className="action-btn" onClick={handleSave} title="保存">
            <span className={`material-symbols-outlined ${isSaved ? 'fill-icon saved' : ''}`}>
              bookmark
            </span>
          </button>
        </div>
      </div>

      {/* 質問テキスト */}
      {comment.questionText && (
        <h2 className="question-title">{comment.questionText}</h2>
      )}

      {/* コメント本文 */}
      <div className="comment-body">
        <p className="comment-text">「{comment.content}」</p>
      </div>

      {/* 推奨スコア */}
      {comment.npsScore !== null && comment.npsScore !== undefined && (
        <div className="nps-section">
          <span className="nps-label">推奨スコア: {comment.npsScore}</span>
          <NpsScoreBox score={comment.npsScore} />
        </div>
      )}

      {/* 属性バッジと時間・属性テキスト (性別/年代) */}
      <div className="card-footer">
        <div className="footer-row">
          <AttributeBadges attributes={comment.attributes} />
          <div className="time-and-demographic">
            <span className="time-ago">{formatTimeAgo(comment.timestamp)}</span>
            {(comment.gender || comment.ageGroup) && (
              <span className="demographic-text">
                {[
                  comment.gender && (comment.gender === '男性' ? '男' : comment.gender === '女性' ? '女' : comment.gender),
                  comment.ageGroup
                ].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 回答制限日数 ドロップダウン (設定画面 内)
const AnswerCooldownSelect = ({ storeId, currentDays, themeColor, readOnly = false }) => {
  const { updateCurrentStoreSettings } = useAuth()
  const [days, setDays] = useState(currentDays || 5)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setDays(currentDays || 5)
  }, [currentDays])

  const handleChange = async (e) => {
    const next = Number(e.target.value)
    if (!storeId || saving || readOnly || next === days) return
    const prev = days
    setDays(next) // optimistic
    setSaving(true)
    setError(null)

    const { data, error: fnError } = await supabase.functions.invoke('update-store-setting', {
      body: { store_id: storeId, answer_cooldown_days: next }
    })

    if (fnError || !data?.success) {
      console.error('Failed to update answer_cooldown_days', fnError, data)
      setDays(prev)
      setError('設定を保存できませんでした。通信状況をご確認のうえ、もう一度お試しください。')
    } else {
      // 成功 → AuthContext の currentStore も即時更新
      // (別ページに行って戻ったときに古い値で上書きされないように)
      const saved = data?.store?.answer_cooldown_days ?? next
      updateCurrentStoreSettings?.({ answer_cooldown_days: saved })
    }
    setSaving(false)
  }

  return (
    <div className="settings-select-wrapper">
      <div className={`settings-select ${readOnly ? 'readonly' : ''}`} style={!readOnly && themeColor ? { borderColor: themeColor } : undefined}>
        <select
          className="settings-select-native"
          value={days}
          onChange={handleChange}
          disabled={saving || readOnly}
          aria-label="再回答までの日数"
        >
          {[1, 2, 3, 4, 5, 6, 7].map(n => (
            <option key={n} value={n}>{n} 日</option>
          ))}
        </select>
        <span className="material-symbols-outlined settings-select-chevron">expand_more</span>
      </div>
      {saving && <div className="settings-row-status">保存中…</div>}
      {error && <div className="settings-row-error">{error}</div>}
    </div>
  )
}

// スタッフ表示モード切り替え (設定画面 内) - セグメントコントロール
const StaffViewModeControl = ({ storeId, currentMode, themeColor, readOnly = false }) => {
  const { updateCurrentStoreSettings } = useAuth()
  const [mode, setMode] = useState(currentMode || 'weekly')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setMode(currentMode || 'weekly')
  }, [currentMode])

  const handleChange = async (next) => {
    if (!storeId || next === mode || saving || readOnly) return
    const prev = mode
    setMode(next) // optimistic
    setSaving(true)
    setError(null)

    const { data, error: fnError } = await supabase.functions.invoke('update-store-setting', {
      body: { store_id: storeId, staff_view_mode: next }
    })

    if (fnError || !data?.success) {
      console.error('Failed to update staff_view_mode', fnError, data)
      setMode(prev)
      setError('設定を保存できませんでした。通信状況をご確認のうえ、もう一度お試しください。')
    } else {
      // 成功 → AuthContext の currentStore.stores も即時上書き
      // これがないと 別ページから戻ったときに 古い weekly で再描画される
      const saved = data?.store?.staff_view_mode ?? next
      updateCurrentStoreSettings?.({ staff_view_mode: saved })
    }
    setSaving(false)
  }

  const options = [
    { value: 'weekly', label: '毎週月曜' },
    { value: 'realtime', label: 'リアルタイム' }
  ]

  return (
    <div className="settings-segmented-wrapper">
      <div className={`settings-segmented ${readOnly ? 'readonly' : ''}`} role="radiogroup" aria-label="スタッフへの表示モード">
        {options.map(opt => {
          const isActive = mode === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={saving || readOnly}
              className={`settings-segmented-item ${isActive ? 'active' : ''}`}
              style={isActive && themeColor ? { color: themeColor } : undefined}
              onClick={() => handleChange(opt.value)}
            >
              <span className="settings-segmented-label">{opt.label}</span>
            </button>
          )
        })}
        <span
          className={`settings-segmented-thumb ${mode === 'realtime' ? 'right' : 'left'}`}
          aria-hidden="true"
        />
      </div>
      {saving && <div className="settings-row-status">保存中…</div>}
      {error && <div className="settings-row-error">{error}</div>}
    </div>
  )
}

// 回答状況ページ
const formatStatsDate = (dateStr) => {
  // 'YYYY-MM-DD' を '5/8 (木)' 形式へ
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const w = ['日', '月', '火', '水', '木', '金', '土'][dt.getDay()]
  return { md: `${m}/${d}`, weekday: w }
}

// hex (#RRGGBB / #RGB) を rgba に変換 (a = 0..1)
const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string') return `rgba(25, 127, 230, ${alpha})`
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (h.length !== 6) return `rgba(25, 127, 230, ${alpha})`
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// 回答数の比率からヒートマップ用の塗り色 (intensity = 0..1)
const intensityToFill = (intensity, themeColor) => {
  if (intensity <= 0) return 'transparent'
  // 0.18 (薄) 〜 1.0 (濃) を 5 段階で量子化
  const step = Math.min(4, Math.floor(intensity * 5))
  const alphaTable = [0.20, 0.40, 0.60, 0.80, 1.00]
  return hexToRgba(themeColor || '#197fe6', alphaTable[step])
}

// DEV バイパス時にだけ使う モックデータ生成
// import.meta.env.DEV が false なら本番ビルドで除去される
const DEV_STATS_MOCK_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true'

const generateMockStats = (yearMonth) => {
  // yearMonth: 'YYYY-MM'
  const [yStr, mStr] = yearMonth.split('-')
  const year = parseInt(yStr, 10)
  const month = parseInt(mStr, 10)
  const daysInMonth = new Date(year, month, 0).getDate()
  let seed = year * 100 + month
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)

  const daily = []
  let totalR = 0, totalC = 0
  for (let d = daysInMonth; d >= 1; d--) {
    const dateObj = new Date(year, month - 1, d)
    const dateKey = `${yearMonth}-${String(d).padStart(2, '0')}`
    const isFuture = dateObj > now
    const dow = dateObj.getDay()
    const responseBase = isFuture
      ? 0
      : (dow === 0 || dow === 6 ? 2 + Math.floor(rand() * 6) : 5 + Math.floor(rand() * 14))
    const commentBase = isFuture ? 0 : Math.max(0, Math.round(responseBase * (0.3 + rand() * 0.5)))
    daily.push({
      date: dateKey,
      response_count: responseBase,
      comment_count: commentBase
    })
    totalR += responseBase
    totalC += commentBase
  }
  const todayRow = daily.find(d => d.date === todayKey)
  // 過去 7 日 (本日除く)
  let r7 = 0, c7 = 0
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const k = d.toISOString().slice(0, 10)
    const row = daily.find(r => r.date === k)
    if (row) { r7 += row.response_count; c7 += row.comment_count }
  }
  return {
    success: true,
    year_month: yearMonth,
    days_in_month: daysInMonth,
    today_response_count: todayRow?.response_count || 0,
    today_comment_count: todayRow?.comment_count || 0,
    avg7_response: Math.round((r7 / 7) * 10) / 10,
    avg7_comment: Math.round((c7 / 7) * 10) / 10,
    total_response: totalR,
    total_comment: totalC,
    daily
  }
}

const currentYearMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const shiftYearMonth = (ym, deltaMonths) => {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + deltaMonths, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const ResponseStatsPage = ({ storeId, themeColor, isVisible }) => {
  const [yearMonth, setYearMonth] = useState(currentYearMonth())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isVisible || !storeId) return
    let cancelled = false
    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      // DEV バイパス時はサーバーを呼ばずに モックデータを返す
      if (DEV_STATS_MOCK_ENABLED) {
        await new Promise(r => setTimeout(r, 200))
        if (cancelled) return
        setData(generateMockStats(yearMonth))
        setLoading(false)
        return
      }

      const { data: result, error: fnError } = await supabase.functions.invoke('response-stats', {
        body: { store_id: storeId, year_month: yearMonth }
      })
      if (cancelled) return
      if (fnError || !result?.success) {
        console.error('response-stats failed', fnError, result)
        setError('回答状況を取得できませんでした。通信状況をご確認のうえ、もう一度お試しください。')
        setData(null)
      } else {
        setData(result)
      }
      setLoading(false)
    }
    fetchStats()
    return () => { cancelled = true }
  }, [storeId, isVisible, yearMonth])

  if (loading) {
    return (
      <main className="comment-content stats-page">
        <SkKpiGrid />
        <SkChart rows={10} />
      </main>
    )
  }

  if (error) {
    return (
      <main className="comment-content stats-page">
        <div className="stats-error">{error}</div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="comment-content stats-page">
        <div className="stats-empty">データがありません</div>
      </main>
    )
  }

  return (
    <main className="comment-content stats-page">
      <ResponseStatsSummary data={data} />
      <ResponseStatsChart
        data={data}
        themeColor={themeColor}
        yearMonth={yearMonth}
        onChangeMonth={setYearMonth}
      />
    </main>
  )
}

// サマリー (横スクロール KPI カード)
const ResponseStatsSummary = ({ data }) => {
  const cards = [
    {
      label: '本日 回答', value: data.today_response_count, unit: '件',
      bg: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
    },
    {
      label: '本日 コメント', value: data.today_comment_count, unit: '件',
      bg: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)'
    },
    {
      label: '7日平均 回答', value: data.avg7_response, unit: '件 / 日', decimals: 1,
      bg: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)'
    },
    {
      label: '7日平均 コメント', value: data.avg7_comment, unit: '件 / 日', decimals: 1,
      bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
    }
  ]

  return (
    <section className="stats-kpi">
      <div className="stats-kpi-grid">
        {cards.map((c, i) => (
          <div key={i} className="stats-kpi-card" style={{ background: c.bg }}>
            <div className="stats-kpi-label">{c.label}</div>
            <div className="stats-kpi-row">
              <span className="stats-kpi-num">
                {c.decimals
                  ? c.value.toLocaleString(undefined, { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals })
                  : c.value.toLocaleString()}
              </span>
              <span className="stats-kpi-unit">{c.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// 月別チャート (タブ切替 + 月ナビ + 合計)
const ResponseStatsChart = ({ data, themeColor, yearMonth, onChangeMonth }) => {
  const [metric, setMetric] = useState('response') // 'response' | 'comment'
  const accent = metric === 'response' ? (themeColor || '#197fe6') : '#8b5cf6'
  const counts = data.daily.map(d => metric === 'response' ? d.response_count : d.comment_count)
  const maxCount = Math.max(1, ...counts)
  const total = metric === 'response' ? data.total_response : data.total_comment

  const todayKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  const [y, m] = yearMonth.split('-').map(Number)
  const monthLabel = `${y}年${m}月`
  const isCurrentMonth = yearMonth === currentYearMonth()

  return (
    <section className="stats-chart">
      {/* 月ナビ */}
      <div className="stats-month-nav">
        <button
          type="button"
          className="stats-month-btn"
          aria-label="前の月"
          onClick={() => onChangeMonth(shiftYearMonth(yearMonth, -1))}
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="stats-month-label">{monthLabel}</div>
        <button
          type="button"
          className="stats-month-btn"
          aria-label="次の月"
          disabled={isCurrentMonth}
          onClick={() => onChangeMonth(shiftYearMonth(yearMonth, 1))}
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* タブ */}
      <div className="stats-chart-tabs" role="tablist">
        {[
          { key: 'response', label: '回答数' },
          { key: 'comment', label: 'コメント数' }
        ].map(t => {
          const active = metric === t.key
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              type="button"
              className={`stats-chart-tab ${active ? 'active' : ''}`}
              style={active ? { color: accent, borderBottomColor: accent } : undefined}
              onClick={() => setMetric(t.key)}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <ul className="stats-bar-list">
        {/* 1日が上に来るよう昇順で表示 */}
        {[...data.daily].sort((a, b) => a.date.localeCompare(b.date)).map((row) => {
          const labels = formatStatsDate(row.date)
          const value = metric === 'response' ? row.response_count : row.comment_count
          const pct = (value / maxCount) * 100
          const intensity = value / maxCount
          const fill = intensityToFill(intensity, accent)
          const isToday = row.date === todayKey
          const isWeekend = labels.weekday === '土' || labels.weekday === '日'
          return (
            <li key={row.date} className={`stats-bar-row ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}>
              <div className="stats-bar-date">
                <span className="stats-bar-md">{labels.md}</span>
                <span className="stats-bar-weekday">{labels.weekday}</span>
              </div>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill"
                  style={{ width: `${pct}%`, background: fill }}
                />
              </div>
              <div className="stats-bar-count">{value}</div>
            </li>
          )
        })}
      </ul>

      {/* 月合計 */}
      <div className="stats-total">
        <span className="stats-total-label">{monthLabel} 合計</span>
        <span className="stats-total-value" style={{ color: accent }}>
          {total.toLocaleString()}<span className="stats-total-unit">件</span>
        </span>
      </div>
    </section>
  )
}

// 店舗切り替え (設定画面 内)
const StoreSwitcher = ({ stores, currentStoreId, onSelect, themeColor }) => {
  if (!stores || stores.length === 0) return null

  const getRoleLabel = (role) => String(role).toUpperCase() === 'STORE' ? '店舗管理者' : 'スタッフ'

  return (
    <section className="settings-group">
      <h2 className="settings-group-title">店舗の切り替え</h2>
      <ul className="store-switch-list" role="radiogroup" aria-label="店舗の切り替え">
        {stores.map(s => {
          const isActive = s.store_id === currentStoreId
          return (
            <li key={s.store_id}>
              <button
                type="button"
                role="radio"
                aria-checked={isActive}
                className={`store-switch-item ${isActive ? 'active' : ''}`}
                onClick={() => !isActive && onSelect(s.store_id)}
              >
                <div className="store-switch-text">
                  <div className="store-switch-name">
                    {s.stores?.name || `店舗 ${s.store_id}`}
                  </div>
                  <div className="store-switch-role">{getRoleLabel(s.role)}</div>
                </div>
                {isActive && (
                  <span
                    className="material-symbols-outlined store-switch-check"
                    style={themeColor ? { color: themeColor } : undefined}
                  >
                    check
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// 店舗プロフィール (役職を上、店舗名を下)
const StoreProfile = ({ store, role }) => {
  const name = store?.stores?.name || '店舗名未設定'
  const roleLabel = String(role).toUpperCase() === 'STORE' ? '店舗管理者' : 'スタッフ'

  return (
    <div className="store-profile">
      <div className="store-profile-role">{roleLabel}</div>
      <div className="store-profile-name">{name}</div>
    </div>
  )
}

const CommentPage = () => {
  const [npsFilter, setNpsFilter] = useState('all') // NPS フィルター
  const [lastViewTime, setLastViewTime] = useState(null)
  const [lastViewTimeLoading, setLastViewTimeLoading] = useState(true)

  // 新しいステート
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // 追加フィルター
  const [revisitFilter, setRevisitFilter] = useState('all') // all, yes, no
  const [visitorTypeFilter, setVisitorTypeFilter] = useState('all') // all, new, repeat
  const [savedOnly, setSavedOnly] = useState(false) // 保存済みのみ表示

  // タブ選択（ボトムナビで切り替え）
  const [activeTab, setActiveTab] = useState('comments') // comments, reports, settings

  // レポートタブ用state
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsFetched, setReportsFetched] = useState(false)
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null)
  const [selectedPdfTitle, setSelectedPdfTitle] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)

  // 保存済みコメントIDのセット
  const [savedCommentIds, setSavedCommentIds] = useState(new Set())
  const saveOperationsRef = useRef(new Map()) // 進行中の保存操作を追跡

  const { loading: authLoading, isInitialized, currentStore, userStores, selectStore, user, partnerTheme } = useAuth()
  const themeColor = partnerTheme?.primary_color || '#197fe6'

  // ユーザーのroleを取得（staff かどうか）
  const userRole = currentStore?.role || null
  const isStaff = userRole?.toUpperCase() === 'STAFF'

  // STAFF 表示モード ('weekly' = 1週間遅れ / 'realtime' = リアルタイム)
  // 店舗単位で stores.staff_view_mode に保存される。デフォルトは 'weekly'
  const staffViewMode = currentStore?.stores?.staff_view_mode || 'weekly'
  const staffWeeklyDelay = isStaff && staffViewMode === 'weekly'

  // 当月の回答獲得数 (response-stats Edge Function 経由)
  // total_response = preset_question_answer の月内件数 = アンケートに回答した人の総数
  // dev バイパス時は generateMockStats で固定値を表示し UI を目視確認できるようにする
  const [monthlyStats, setMonthlyStats] = useState(null)
  useEffect(() => {
    if (!currentStore?.store_id) {
      setMonthlyStats(null)
      return
    }
    const ym = currentYearMonth()
    let cancelled = false
    ;(async () => {
      if (DEV_STATS_MOCK_ENABLED) {
        setMonthlyStats(generateMockStats(ym))
        return
      }
      const { data, error } = await supabase.functions.invoke('response-stats', {
        body: { store_id: currentStore.store_id, year_month: ym }
      })
      if (cancelled) return
      if (!error && data?.success) setMonthlyStats(data)
      else setMonthlyStats(null)
    })()
    return () => { cancelled = true }
  }, [currentStore?.store_id])

  const monthlySummaryLabel = useMemo(() => {
    const ym = currentYearMonth()
    const [y, m] = ym.split('-').map(Number)
    const cnt = monthlyStats?.total_response
    return `${y}年${m}月 アンケート回答 ${cnt != null ? cnt.toLocaleString() : '—'}件`
  }, [monthlyStats])

  // LINE 公式アカウント接続状態
  // 信頼できる判定として 実際に LINE API へ到達できる (quota が取れる) かをチェック
  // get-line-message-quota は line_messaging_enabled=false のとき enabled:false を返し
  // token が無効なら 例外を投げる - どちらも未接続として扱う
  const [isLineConnected, setIsLineConnected] = useState(false)
  const broadcastCompanyId = currentStore?.company_id || currentStore?.stores?.company_id
  useEffect(() => {
    if (!broadcastCompanyId || isStaff) { setIsLineConnected(false); return }
    let cancelled = false
    fetchLineQuota(broadcastCompanyId)
      .then(d => { if (!cancelled) setIsLineConnected(!!d?.enabled) })
      .catch(() => { if (!cancelled) setIsLineConnected(false) })
    return () => { cancelled = true }
  }, [broadcastCompanyId, isStaff])

  // 接続が外れた / 未接続なのに broadcast タブにいる場合は コメントタブへ戻す
  useEffect(() => {
    if (activeTab === 'broadcast' && !isLineConnected) setActiveTab('comments')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLineConnected])

  // レポートタブ切り替え時にデータ取得
  useEffect(() => {
    if (activeTab !== 'reports' || !currentStore?.store_id || reportsFetched) return

    const fetchReports = async () => {
      setReportsLoading(true)
      try {
        const { data, error } = await supabase
          .from('published_reports')
          .select('*')
          .eq('store_id', currentStore.store_id)
          .eq('is_published', true)
          .order('year_month', { ascending: false })

        if (error) {
          console.error('レポート取得エラー:', error)
          return
        }
        setReports(data || [])
      } catch (err) {
        console.error('レポート取得エラー:', err)
      } finally {
        setReportsLoading(false)
        setReportsFetched(true)
      }
    }

    fetchReports()
  }, [activeTab, currentStore?.store_id, reportsFetched])

  // 店舗切り替え時にレポートをリセット
  useEffect(() => {
    setReportsFetched(false)
    setReports([])
  }, [currentStore?.store_id])

  // コメント以外のタブではスクロールバーを非表示にする (body にクラス付与)
  useEffect(() => {
    if (activeTab === 'comments') {
      document.body.classList.remove('hide-scrollbar')
    } else {
      document.body.classList.add('hide-scrollbar')
    }
    return () => document.body.classList.remove('hide-scrollbar')
  }, [activeTab])

  // レポートPDFを開く
  const handleOpenReport = async (report) => {
    setPdfLoading(true)
    setSelectedPdfTitle(formatYearMonth(report.year_month))

    try {
      const { data, error } = await supabase.storage
        .from('report-pdfs')
        .createSignedUrl(report.pdf_storage_path, 3600)

      if (error) {
        console.error('PDF URL取得エラー:', error)
        setPdfLoading(false)
        return
      }
      setSelectedPdfUrl(data.signedUrl)
    } catch (err) {
      console.error('PDF URL取得エラー:', err)
    } finally {
      setPdfLoading(false)
    }
  }

  // PDFビューアを閉じる
  const handleClosePdf = () => {
    setSelectedPdfUrl(null)
    setSelectedPdfTitle('')
  }

  // 年月フォーマット
  const formatYearMonth = (ym) => {
    const [year, month] = ym.split('-')
    return `${year}年${parseInt(month)}月`
  }

  // 公開日フォーマット
  const formatPublishedDate = (dateStr) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  }

  // 日本時間で現在の日時を取得
  // 旧実装は new Date() (= UTC ms) に +9h を加算しており、その結果を getDay()/
  // getDate() で読むと ブラウザのローカルタイムゾーン (= JST) でさらに +9h が
  // かかって 二重加算になっていた。週境界が来週月曜にズレ、weekly モードでも
  // 今週のコメントが '過去扱い' で表示されるバグの原因だったので 単純化。
  // ブラウザを JST 前提とする (店舗管理アプリは国内利用想定)。
  const getJSTDate = () => new Date()

  // 週の開始日（月曜日）を計算する関数（日本時間ベース）
  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 月曜日に調整
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const { recordCommentPageView, recordCommentPageLeave, getLastLeaveTime } = useUnreadCommentCount()

  // 保存済みコメントを取得
  useEffect(() => {
    const fetchSavedComments = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from('preset_question_answer_comment_favorite')
          .select('comment_id')
          .eq('business_user_id', user.id)

        if (error) {
          console.error('Failed to fetch saved comments:', error)
          return
        }

        const ids = new Set(data.map(item => item.comment_id))
        setSavedCommentIds(ids)
      } catch (err) {
        console.error('Error fetching saved comments:', err)
      }
    }

    fetchSavedComments()
  }, [user?.id])

  // 保存トグルハンドラー（楽観的UI）
  const handleSaveToggle = useCallback(async (commentId, shouldSave) => {
    if (!user?.id) return

    // 既に同じ操作が進行中の場合はスキップ
    const operationKey = `${commentId}-${shouldSave}`
    if (saveOperationsRef.current.has(operationKey)) return
    saveOperationsRef.current.set(operationKey, true)

    // 楽観的UIで即座に更新
    setSavedCommentIds(prev => {
      const newSet = new Set(prev)
      if (shouldSave) {
        newSet.add(commentId)
      } else {
        newSet.delete(commentId)
      }
      return newSet
    })

    try {
      if (shouldSave) {
        // 保存
        const { error } = await supabase
          .from('preset_question_answer_comment_favorite')
          .insert({
            business_user_id: user.id,
            comment_id: commentId
          })

        if (error) {
          console.error('Failed to save comment:', error)
          // 失敗した場合は元に戻す
          setSavedCommentIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(commentId)
            return newSet
          })
        }
      } else {
        // 削除
        const { error } = await supabase
          .from('preset_question_answer_comment_favorite')
          .delete()
          .eq('business_user_id', user.id)
          .eq('comment_id', commentId)

        if (error) {
          console.error('Failed to unsave comment:', error)
          // 失敗した場合は元に戻す
          setSavedCommentIds(prev => {
            const newSet = new Set(prev)
            newSet.add(commentId)
            return newSet
          })
        }
      }
    } catch (err) {
      console.error('Error toggling save:', err)
      // 失敗した場合は元に戻す
      setSavedCommentIds(prev => {
        const newSet = new Set(prev)
        if (shouldSave) {
          newSet.delete(commentId)
        } else {
          newSet.add(commentId)
        }
        return newSet
      })
    } finally {
      saveOperationsRef.current.delete(operationKey)
    }
  }, [user?.id])

  // 安定した参照のための定数
  const emptyDateRange = useMemo(() => ({ start: '', end: '' }), [])

  // 全期間のデータを取得 (weekOptions の生成・古い週も絞り込みで閲覧可能にするため
  // allComments = 全期間データ という設計を維持する)
  const { comments: allComments, loading, error, refetch } = usePresetComments(null, emptyDateRange, 'all')

  // 選択中の週
  const [selectedWeek, setSelectedWeek] = useState('all')

  // データから利用可能な週を抽出してオプションを生成
  const weekOptions = useMemo(() => {
    const options = []
    const jstNow = getJSTDate()
    const currentWeekStart = getWeekStart(jstNow)

    if (!allComments || allComments.length === 0) {
      // データがない場合は空の配列を返す
      return options
    }

    // コメントの日付から週を抽出
    const weekMap = new Map()

    allComments.forEach(comment => {
      const commentDate = new Date(comment.timestamp)
      const weekStart = getWeekStart(commentDate)
      const weekKey = formatDateInput(weekStart)

      // staff かつ weekly モードのときだけ今週のデータを除外
      if (staffWeeklyDelay) {
        if (weekStart >= currentWeekStart) {
          return // 今週以降はスキップ
        }
      }

      if (!weekMap.has(weekKey)) {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        weekMap.set(weekKey, {
          value: weekKey,
          label: `${formatDateDisplay(weekStart)}〜${formatDateDisplay(weekEnd)}`,
          start: weekStart,
          end: weekEnd
        })
      }
    })

    // 週を日付順（新しい順）にソート
    const sortedWeeks = Array.from(weekMap.values())
      .sort((a, b) => b.start - a.start)

    // 「全期間」オプションを先頭に追加
    options.push({
      value: 'all',
      label: '全期間',
      start: null,
      end: null
    })

    options.push(...sortedWeeks)

    return options
  }, [allComments, staffWeeklyDelay])

  // roleとデータが確定したら初期選択を設定
  useEffect(() => {
    if (weekOptions.length > 0) {
      // 現在の選択が無効な場合のみ更新
      const isValidSelection = weekOptions.some(w => w.value === selectedWeek)
      if (!isValidSelection) {
        setSelectedWeek(weekOptions[0].value)
      }
    }
  }, [weekOptions])

  // 選択中の週のデータを取得
  const selectedWeekData = useMemo(() => {
    return weekOptions.find(w => w.value === selectedWeek) || weekOptions[0]
  }, [selectedWeek, weekOptions])

  // 選択した週でコメントをフィルタリング
  const comments = useMemo(() => {
    if (!allComments) return []

    // 「全期間」の場合はすべて表示
    if (selectedWeek === 'all') {
      // staff かつ weekly モードのときだけ今週のデータを除外
      if (staffWeeklyDelay) {
        const jstNow = getJSTDate()
        const currentWeekStart = getWeekStart(jstNow)
        return allComments.filter(comment => {
          const commentDate = new Date(comment.timestamp)
          const weekStart = getWeekStart(commentDate)
          return weekStart < currentWeekStart
        })
      }
      return allComments
    }

    // 選択した週のデータのみフィルタリング
    if (!selectedWeekData?.start || !selectedWeekData?.end) {
      return allComments
    }

    return allComments.filter(comment => {
      const commentDate = new Date(comment.timestamp)
      return commentDate >= selectedWeekData.start && commentDate <= selectedWeekData.end
    })
  }, [allComments, selectedWeek, selectedWeekData, staffWeeklyDelay])

  // 最後の離脱時刻を取得
  useEffect(() => {
    const fetchLastLeaveTime = async () => {
      if (isInitialized && !authLoading && currentStore?.store_id) {
        setLastViewTimeLoading(true)
        try {
          const lastTime = await getLastLeaveTime()
          setLastViewTime(lastTime)
        } catch (error) {
          console.error('Failed to get last leave time:', error)
          setLastViewTime(null)
        } finally {
          setLastViewTimeLoading(false)
        }
      }
    }
    fetchLastLeaveTime()
  }, [isInitialized, authLoading, currentStore?.store_id])

  // コメントページのアクセス記録
  useEffect(() => {
    if (isInitialized && !authLoading && currentStore?.store_id) {
      recordCommentPageView()
    }

    const handleBeforeUnload = () => {
      if (isInitialized && !authLoading && currentStore?.store_id) {
        recordCommentPageLeave()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isInitialized && !authLoading && currentStore?.store_id) {
        recordCommentPageLeave()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (isInitialized && !authLoading && currentStore?.store_id) {
        recordCommentPageLeave()
      }
    }
  }, [isInitialized, authLoading, currentStore?.store_id])

  // 新規コメント判定
  const isNewComment = (comment) => {
    if (lastViewTimeLoading) return false
    if (!lastViewTime) return false
    return comment.timestamp > new Date(lastViewTime)
  }

  // コメントの非表示状態が変更されたときのコールバック
  const handleCommentVisibilityChange = useCallback((commentId, isHidden) => {
    console.log('Comment visibility changed:', commentId, isHidden)
    // 必要に応じてここでローカル状態を更新
  }, [])

  // 検索と各フィルターを適用
  const filteredComments = useMemo(() => {
    const filtered = comments.filter(comment => {
      // 検索フィルター
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesContent = comment.content?.toLowerCase().includes(query)
        const matchesQuestion = comment.questionText?.toLowerCase().includes(query)
        if (!matchesContent && !matchesQuestion) return false
      }

      // NPSフィルター
      if (npsFilter !== 'all') {
        if (comment.npsScore === null || comment.npsScore === undefined) return false
        const category = getNpsCategory(comment.npsScore)
        if (npsFilter === 'promoter' && category !== 'promoter') return false
        if (npsFilter === 'passive' && category !== 'passive') return false
        if (npsFilter === 'detractor' && category !== 'detractor') return false
      }

      // 再来店フィルター
      if (revisitFilter !== 'all') {
        const revisitAttr = comment.attributes?.find(a => a.questionId === 'revisit')
        if (revisitFilter === 'yes' && revisitAttr?.choiceName !== '再来店あり') return false
        if (revisitFilter === 'no' && revisitAttr?.choiceName !== '再来店なし') return false
      }

      // 新規/リピーターフィルター
      if (visitorTypeFilter !== 'all') {
        const visitorAttr = comment.attributes?.find(a => a.questionId === 'visitor_type')
        if (visitorTypeFilter === 'new' && visitorAttr?.choiceName !== '新規') return false
        if (visitorTypeFilter === 'repeat' && visitorAttr?.choiceName !== 'リピーター') return false
      }

      // 保存済みフィルター
      if (savedOnly && !savedCommentIds.has(comment.id)) {
        return false
      }

      return true
    })

    // 最新順でソート
    return [...filtered].sort((a, b) => b.timestamp - a.timestamp)
  }, [comments, searchQuery, npsFilter, revisitFilter, visitorTypeFilter, savedOnly, savedCommentIds])

  // 認証が完了していない場合（全 Hook 宣言の後で行う：React Hook 規則準拠）
  if (!isInitialized || authLoading || !currentStore) {
    return (
      <div className="comment-page">
        <div className="comment-loading-container">
          <SkeletonScreen type="comment-card" count={3} />
        </div>
      </div>
    )
  }

  const npsFilterButtons = [
    { type: 'all', label: 'すべて' },
    { type: 'promoter', label: '推奨者', className: 'filter-promoter' },
    { type: 'passive', label: '中立者', className: 'filter-passive' },
    { type: 'detractor', label: '批判者', className: 'filter-detractor' }
  ]

  // アクティブなフィルター数を計算
  const activeFilterCount =
    (npsFilter !== 'all' ? 1 : 0) +
    (revisitFilter !== 'all' ? 1 : 0) +
    (visitorTypeFilter !== 'all' ? 1 : 0) +
    (savedOnly ? 1 : 0)

  return (
    <div className="comment-page">
      {/* 固定ヘッダーエリア */}
      <div className="comment-header-area">
        {/* 店名 + 当月の回答獲得数 (コメントタブのみ・新井さん要望) */}
        {activeTab === 'comments' && currentStore?.stores?.name && (
          <div className="store-summary-row">
            <span className="store-summary-name">{currentStore.stores.name}</span>
            <span className="store-summary-sep" aria-hidden="true">·</span>
            <span className="store-summary-stat">{monthlySummaryLabel}</span>
          </div>
        )}
        {/* 検索バー + フィルター行 (コメントタブのみ) */}
        {activeTab === 'comments' && (
        <div className="search-filter-row">
          <div className="search-container">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="コメントを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>

          <button
            className={`filter-toggle-btn ${isFilterOpen ? 'active' : ''} ${activeFilterCount > 0 ? 'has-active' : ''}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <span className="material-symbols-outlined">tune</span>
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
          </button>
        </div>
        )}

        {/* 開閉可能なフィルターエリア (コメントタブのみ) */}
        {activeTab === 'comments' && (
        <div className={`collapsible-filters ${isFilterOpen ? 'open' : ''}`}>
          <div className="filter-wrapper">
            {/* 期間選択 */}
            <div className="filter-section">
              <span className="filter-section-label">期間</span>
              <select
                className="period-dropdown"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
              >
                {weekOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 推奨スコアフィルター */}
            <div className="filter-section">
              <span className="filter-section-label">推奨スコア</span>
              <div className="filter-chips">
                {npsFilterButtons.map(btn => (
                  <button
                    key={btn.type}
                    onClick={() => setNpsFilter(btn.type)}
                    className={`filter-chip ${npsFilter === btn.type ? 'active' : ''} ${btn.className || ''}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 再来店フィルター */}
            <div className="filter-section">
              <span className="filter-section-label">再来店意向</span>
              <div className="filter-chips">
                <button
                  onClick={() => setRevisitFilter('all')}
                  className={`filter-chip ${revisitFilter === 'all' ? 'active' : ''}`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setRevisitFilter('yes')}
                  className={`filter-chip ${revisitFilter === 'yes' ? 'active' : ''}`}
                >
                  あり
                </button>
                <button
                  onClick={() => setRevisitFilter('no')}
                  className={`filter-chip ${revisitFilter === 'no' ? 'active' : ''}`}
                >
                  なし
                </button>
              </div>
            </div>

            {/* 新規/リピーターフィルター */}
            <div className="filter-section">
              <span className="filter-section-label">来店タイプ</span>
              <div className="filter-chips">
                <button
                  onClick={() => setVisitorTypeFilter('all')}
                  className={`filter-chip ${visitorTypeFilter === 'all' ? 'active' : ''}`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setVisitorTypeFilter('new')}
                  className={`filter-chip ${visitorTypeFilter === 'new' ? 'active' : ''}`}
                >
                  新規
                </button>
                <button
                  onClick={() => setVisitorTypeFilter('repeat')}
                  className={`filter-chip ${visitorTypeFilter === 'repeat' ? 'active' : ''}`}
                >
                  リピーター
                </button>
              </div>
            </div>

            {/* 保存済みフィルター */}
            <div className="filter-section">
              <label className="saved-filter-checkbox">
                <input
                  type="checkbox"
                  checked={savedOnly}
                  onChange={(e) => setSavedOnly(e.target.checked)}
                />
                <span className="checkbox-custom">
                  <span className="material-symbols-outlined checkbox-icon">check</span>
                </span>
                <span className="checkbox-label">保存済みのみ表示</span>
              </label>
            </div>
          </div>
        </div>
        )}

        {/* 結果カウント (コメントタブのみ) */}
        {activeTab === 'comments' && (
        <div className="result-info">
          {!loading && !error && (
            <span className="result-count">{filteredComments.length}件のコメント</span>
          )}
          {!loading && !error && filteredComments.length > 0 && (
            <button
              type="button"
              className="csv-export-button"
              onClick={() => {
                const storeName = currentStore?.stores?.name || 'コメント'
                const today = new Date()
                const y = today.getFullYear()
                const mm = String(today.getMonth() + 1).padStart(2, '0')
                const dd = String(today.getDate()).padStart(2, '0')
                const safeName = storeName.replace(/[\\/:*?"<>|]/g, '_')
                const filename = `コメント_${safeName}_${y}-${mm}-${dd}.csv`
                downloadCsv(filename, commentsToCsv(filteredComments))
              }}
              style={{ color: themeColor, borderColor: themeColor }}
            >
              <span className="material-symbols-outlined csv-export-icon">download</span>
              CSV出力
            </button>
          )}
        </div>
        )}
      </div>

      {/* コメントタブのコンテンツ */}
      {activeTab === 'comments' && (
      <main className="comment-content">
        {loading ? (
          <SkeletonScreen type="comment-card" count={5} />
        ) : filteredComments.length > 0 ? (
          <div className="cards-container">
            {filteredComments.map((comment) => (
              <ReviewCard
                key={comment.id}
                comment={comment}
                isNew={isNewComment(comment)}
                isStaff={isStaff}
                storeId={currentStore?.store_id}
                onVisibilityChange={handleCommentVisibilityChange}
                isSaved={savedCommentIds.has(comment.id)}
                onSaveToggle={handleSaveToggle}
              />
            ))}
          </div>
        ) : error ? (
          <div className="empty-state">
            <span className="material-symbols-outlined empty-icon">chat_bubble</span>
            <p>コメントを読み込めませんでした</p>
            <p className="empty-state-sub">通信状況をご確認のうえ、もう一度お試しください</p>
            <button
              type="button"
              className="retry-button"
              onClick={() => refetch?.()}
              style={{ background: themeColor }}
            >
              再読み込み
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <span className="material-symbols-outlined empty-icon">chat_bubble</span>
            <p>該当するコメントがありません</p>
          </div>
        )}
      </main>
      )}

      {/* レポートタブのコンテンツ */}
      {activeTab === 'reports' && (
      <main className="comment-content reports-page">
        {reportsLoading ? (
          <SkList count={6} />
        ) : reports.length === 0 ? (
          <div className="reports-empty-state">
            <span className="material-symbols-outlined reports-empty-icon">analytics</span>
            <h3 className="reports-empty-title">公開中のレポートはありません</h3>
            <p className="reports-empty-text">レポートが公開されると、ここに表示されます</p>
          </div>
        ) : (
          <div className="reports-table-wrapper">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>期間</th>
                  <th>店舗</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} onClick={() => handleOpenReport(report)}>
                    <td>
                      <div className="reports-table-period">
                        <span className="material-symbols-outlined fill-icon reports-table-icon" style={{ color: themeColor }}>description</span>
                        {formatYearMonth(report.year_month)}
                      </div>
                    </td>
                    <td className="reports-table-store">{currentStore?.stores?.name || '-'}</td>
                    <td className="reports-table-action">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      )}

      {/* 回答状況タブのコンテンツ */}
      {activeTab === 'stats' && (
        <ResponseStatsPage
          storeId={currentStore?.store_id}
          themeColor={themeColor}
          isVisible={activeTab === 'stats'}
        />
      )}

      {/* LINE配信タブのコンテンツ (接続済 + 店舗責任者のみ) */}
      {activeTab === 'broadcast' && !isStaff && isLineConnected && (
        <BroadcastPage visible={activeTab === 'broadcast'} />
      )}

      {/* 設定タブのコンテンツ (STAFF は閲覧のみ) */}
      {activeTab === 'settings' && (
        <main className="comment-content settings-page">
          <StoreProfile
            store={currentStore}
            role={currentStore?.role}
          />

          <StoreSwitcher
            stores={userStores}
            currentStoreId={currentStore?.store_id}
            onSelect={selectStore}
            themeColor={themeColor}
          />

          {isStaff && (
            <div className="settings-readonly-notice">
              <span className="material-symbols-outlined">lock</span>
              設定の変更には店舗責任者の権限が必要です
            </div>
          )}

          <section className="settings-group">
            <h2 className="settings-group-title">公開設定</h2>
            <div className="settings-row">
              <div className="settings-row-text">
                <div className="settings-row-title">スタッフへの表示</div>
                <div className="settings-row-subtitle">
                  コメントをスタッフへ公開するタイミング
                </div>
              </div>
              <StaffViewModeControl
                storeId={currentStore?.store_id}
                currentMode={staffViewMode}
                themeColor={themeColor}
                readOnly={isStaff}
              />
            </div>
          </section>

          <section className="settings-group">
            <h2 className="settings-group-title">回答制限</h2>
            <div className="settings-row">
              <div className="settings-row-text">
                <div className="settings-row-title">再回答までの日数</div>
                <div className="settings-row-subtitle">
                  同じお客様が連続で回答するのを防ぎます
                </div>
              </div>
              <AnswerCooldownSelect
                storeId={currentStore?.store_id}
                currentDays={currentStore?.stores?.answer_cooldown_days || 5}
                themeColor={themeColor}
                readOnly={isStaff}
              />
            </div>
          </section>

        </main>
      )}

      {/* ボトムナビゲーション (LINE 配信は接続済み + 店舗責任者のときのみ) */}
      <BottomNav
        activeTab={activeTab}
        onChange={setActiveTab}
        themeColor={themeColor}
        isStaff={isStaff}
        isLineConnected={isLineConnected}
      />

      {/* PDFビューア（フルスクリーンオーバーレイ） */}
      {(selectedPdfUrl || pdfLoading) && (
        <div className="pdf-viewer-overlay">
          <div className="pdf-viewer-header">
            <button className="pdf-viewer-close" onClick={handleClosePdf}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="pdf-viewer-title-area">
              <span className="pdf-viewer-title">{selectedPdfTitle} レポート</span>
              <span className="pdf-viewer-badge">A4</span>
            </div>
            {selectedPdfUrl ? (
              <a
                href={selectedPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pdf-viewer-external"
              >
                <span className="material-symbols-outlined">open_in_new</span>
              </a>
            ) : (
              <div style={{ width: 40 }}></div>
            )}
          </div>
          <div className="pdf-viewer-body">
            {pdfLoading ? (
              <div className="pdf-viewer-loading">
                <div className="reports-loading-spinner" style={{ borderTopColor: '#a855f7' }}></div>
                <p className="pdf-viewer-loading-text">PDFを読み込み中...</p>
              </div>
            ) : (
              <iframe
                src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(selectedPdfUrl)}`}
                title="PDF Report"
                className="pdf-viewer-iframe"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CommentPage
