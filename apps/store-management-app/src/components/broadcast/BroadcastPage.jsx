import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { fetchLineQuota, requestLineConnection, fetchLineConnectionState } from '../../lib/lineMessaging'
import BroadcastMessages from './BroadcastMessages'
import BroadcastCoupons from './BroadcastCoupons'
import BroadcastSegments from './BroadcastSegments'
import { SkBroadcast } from '../Skeleton'
import './BroadcastPage.css'

// 開発時 (DEV バイパス有効) はオンボーディングをスキップして配信 UI を表示
const DEV_BROADCAST_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true'

const TABS = [
  { key: 'messages', label: 'メッセージ', icon: 'mail' },
  { key: 'coupons', label: 'クーポン', icon: 'local_offer' },
  { key: 'segments', label: 'ターゲット', icon: 'group' }
]

const QuotaBar = ({ quota }) => {
  // データ未着 または 取得失敗 の状態でも 配信枠の存在は伝える
  if (!quota) {
    return (
      <div className="quota-bar loading">
        <div className="quota-bar-head">
          <span className="quota-bar-label">今月の配信枠</span>
          <span className="quota-bar-value">取得中…</span>
        </div>
      </div>
    )
  }
  if (quota.unlimited) return (
    <div className="quota-bar unlimited">
      <span className="material-symbols-outlined">all_inclusive</span>
      <span className="quota-bar-text">配信枠 無制限</span>
    </div>
  )
  const remaining = quota.remaining ?? 0
  const limit = quota.limit ?? 0
  // 残り通数の割合を表示 (最初満タン → 使うと減っていく)
  const pct = limit > 0 ? Math.max(0, Math.min(100, (remaining / limit) * 100)) : 0
  const lowMargin = limit > 0 && remaining < limit * 0.2
  return (
    <div className={`quota-bar ${lowMargin ? 'warning' : ''}`}>
      <div className="quota-bar-head">
        <span className="quota-bar-label">今月の残り配信数</span>
        <span className="quota-bar-value">
          <strong>{remaining.toLocaleString()}</strong> / {limit.toLocaleString()} 通
        </span>
      </div>
      <div className="quota-bar-track">
        <div className="quota-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const NotConnectedView = ({ storeId, requestedAtInitial }) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(!!requestedAtInitial)
  const [error, setError] = useState(null)
  const [requestedAt, setRequestedAt] = useState(requestedAtInitial || null)

  const handleSend = async () => {
    if (!storeId) return
    setSending(true); setError(null)
    try {
      const res = await requestLineConnection(storeId)
      setConfirmOpen(false)
      setRequestedAt(res?.requested_at || new Date().toISOString())
      setDone(true)
    } catch (e) {
      setError('依頼の送信に失敗しました')
    } finally {
      setSending(false)
    }
  }

  const formatRequestedAt = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <div className="bc-onboard">
      <div className="bc-onboard-icon">
        <span className="material-symbols-outlined">chat</span>
      </div>
      <h2 className="bc-onboard-title">LINE 公式アカウントで配信</h2>
      <p className="bc-onboard-text">
        LINE公式アカウントを接続すると、アンケートに回答いただいたお客様
        一人ひとりに合わせて、クーポンやメッセージを送れるようになります。
      </p>

      {done ? (
        <div className="bc-onboard-done">
          <span className="material-symbols-outlined">check_circle</span>
          {requestedAt ? `依頼済み (${formatRequestedAt(requestedAt)})。5営業日以内にご連絡いたします。`
            : '依頼を送信しました。5営業日以内にご連絡いたします。'}
        </div>
      ) : (
        <button
          type="button"
          className="bc-onboard-cta"
          onClick={() => setConfirmOpen(true)}
          disabled={!storeId}
        >
          接続を依頼する
        </button>
      )}

      {confirmOpen && (
        <div className="bc-modal-overlay" onClick={() => !sending && setConfirmOpen(false)}>
          <div className="bc-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="bc-modal-title">接続を依頼しますか?</h3>
            <p className="bc-modal-text">
              LINE 公式アカウントの作成・接続を担当者へ依頼します。<br />
              送信後、5営業日以内にご連絡いたします。
            </p>
            {error && <div className="bc-error">{error}</div>}
            <div className="bc-modal-actions">
              <button type="button" className="bc-btn-secondary"
                onClick={() => setConfirmOpen(false)} disabled={sending}>
                キャンセル
              </button>
              <button type="button" className="bc-btn-primary"
                onClick={handleSend} disabled={sending}>
                {sending ? '送信中…' : '依頼する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const BroadcastPage = ({ visible }) => {
  const { currentStore, userStores, user, partnerTheme } = useAuth()
  const [tab, setTab] = useState('messages')
  const [formMode, setFormMode] = useState(false)
  const [connState, setConnState] = useState(null) // { enabled, requested_at }
  const [quota, setQuota] = useState(null)
  // 古いキャッシュ等で company_id 直下に無い場合は stores 経由で fallback
  const companyId = currentStore?.company_id || currentStore?.stores?.company_id
  const storeId = currentStore?.store_id

  // 接続状態は companies テーブルを直読みする (Edge Function を介さない)
  useEffect(() => {
    let cancelled = false
    if (!companyId) {
      if (DEV_BROADCAST_BYPASS) {
        setConnState({ enabled: true, requested_at: null })
      } else {
        setConnState({ enabled: false, requested_at: null })
      }
      return
    }
    fetchLineConnectionState(companyId)
      .then(s => { if (!cancelled) setConnState(s) })
      .catch(() => { if (!cancelled) setConnState({ enabled: false, requested_at: null }) })
    return () => { cancelled = true }
  }, [companyId])

  // 接続済みのときだけ quota を取得 (非ブロッキング)
  useEffect(() => {
    if (!connState?.enabled || !companyId) return
    let cancelled = false
    fetchLineQuota(companyId)
      .then(d => { if (!cancelled) setQuota(d) })
      .catch(e => {
        console.warn('[broadcast] quota fetch failed:', e?.message)
        if (DEV_BROADCAST_BYPASS && !cancelled) {
          setQuota({ enabled: true, unlimited: false, limit: 1000, used: 234, remaining: 766 })
        }
      })
    return () => { cancelled = true }
  }, [connState?.enabled, companyId])

  if (!visible) return null

  // 接続状態の読み込み中はスケルトン
  if (connState === null) {
    return (
      <main className="comment-content broadcast-page-v2">
        <SkBroadcast />
      </main>
    )
  }

  // 接続されていなければオンボーディング (依頼済の状態は companies の値から取得)
  if (!connState.enabled) {
    return (
      <main className="comment-content broadcast-page-v2 onboard-mode">
        <NotConnectedView storeId={storeId} requestedAtInitial={connState.requested_at} />
      </main>
    )
  }

  return (
    <main className={`comment-content broadcast-page-v2 ${formMode ? 'form-mode' : ''}`}>
      {!formMode && <QuotaBar quota={quota} />}

      {!formMode && (
        <div className="broadcast-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`broadcast-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <span className="material-symbols-outlined broadcast-tab-icon">{t.icon}</span>
              <span className="broadcast-tab-label">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="broadcast-body">
        {tab === 'messages' && (
          <BroadcastMessages
            companyId={companyId} storeId={storeId} userId={user?.id}
            onFormMode={setFormMode}
          />
        )}
        {tab === 'coupons' && (
          <BroadcastCoupons
            companyId={companyId} userId={user?.id}
            onFormMode={setFormMode}
          />
        )}
        {tab === 'segments' && (
          <BroadcastSegments
            companyId={companyId} storeId={storeId} userId={user?.id}
            userStores={userStores}
            onFormMode={setFormMode}
          />
        )}
      </div>
    </main>
  )
}

export default BroadcastPage
