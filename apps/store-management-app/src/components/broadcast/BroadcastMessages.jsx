import React, { useState, useEffect, useCallback } from 'react'
import {
  fetchMessages, fetchMessageWithBlocks, saveMessage, deleteMessage,
  sendMessage, fetchSegments, fetchCoupons, uploadLineImage,
  previewAudience, withStoreScope, logDispatch
} from '../../lib/lineMessaging'
import { SkCardList } from '../Skeleton'

const STATUS = {
  draft:   { label: '下書き', cls: 'st-draft' },
  sending: { label: '送信中', cls: 'st-sending' },
  sent:    { label: '送信済', cls: 'st-sent' },
  failed:  { label: '失敗',   cls: 'st-failed' }
}

const newBlock = (type) => ({
  block_type: type,
  text_content: type === 'text' ? '' : null,
  image_url: type === 'image' ? '' : null,
  link_url: null,
  coupon_id: type === 'coupon' ? '' : null
})

const emptyMessage = { id: null, title: '', target_segment_id: '', blocks: [newBlock('text')] }

const BLOCK_LABEL = { text: 'テキスト', image: '画像', coupon: 'クーポン' }
const BLOCK_ICON = { text: 'text_fields', image: 'image', coupon: 'local_offer' }

const formatDateTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const BroadcastMessages = ({ companyId, storeId, userId, onFormMode }) => {
  const [view, setView] = useState('list') // 'list' | 'edit'

  useEffect(() => {
    onFormMode?.(view === 'edit')
    return () => onFormMode?.(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])
  const [messages, setMessages] = useState([])
  const [segments, setSegments] = useState([])
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [audience, setAudience] = useState(0)
  const [audienceLoading, setAudienceLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState(-1)
  const [error, setError] = useState(null)
  const [confirmSend, setConfirmSend] = useState(false)

  const load = useCallback(async () => {
    if (!companyId) return
    try {
      setLoading(true)
      const [m, s, c] = await Promise.all([
        fetchMessages(companyId),
        fetchSegments(companyId),
        fetchCoupons(companyId)
      ])
      setMessages(m); setSegments(s); setCoupons(c)
    } catch (e) {
      setError('読み込み失敗')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { load() }, [load])

  const refreshAudience = useCallback(async (segmentId) => {
    if (!companyId || !storeId) return
    setAudienceLoading(true)
    try {
      let conditions = {}
      if (segmentId) {
        const s = segments.find(x => x.id === segmentId)
        conditions = s?.conditions || {}
      }
      const scoped = withStoreScope(conditions, storeId)
      const count = await previewAudience({ companyId, conditions: scoped })
      setAudience(count)
    } catch (e) {
      setAudience(0)
    } finally {
      setAudienceLoading(false)
    }
  }, [companyId, storeId, segments])

  const openNew = () => {
    setEditing({ ...emptyMessage })
    setView('edit')
    refreshAudience('')
  }

  const openEdit = async (m) => {
    try {
      const full = await fetchMessageWithBlocks(m.id)
      setEditing({
        id: full.id,
        status: full.status,
        sent_at: full.sent_at,
        recipient_count: full.recipient_count,
        delivered_count: full.delivered_count,
        title: full.title || '',
        target_segment_id: full.target_segment_id || '',
        blocks: (full.blocks || []).filter(b => ['text', 'image', 'coupon'].includes(b.block_type)).length > 0
          ? full.blocks.filter(b => ['text', 'image', 'coupon'].includes(b.block_type))
          : [newBlock('text')]
      })
      setView('edit')
      refreshAudience(full.target_segment_id || '')
    } catch (e) {
      setError('読み込み失敗')
    }
  }

  const backToList = () => {
    setEditing(null)
    setView('list')
    setError(null)
  }

  const updateBlock = (i, patch) => {
    const blocks = [...editing.blocks]
    blocks[i] = { ...blocks[i], ...patch }
    setEditing({ ...editing, blocks })
  }
  const moveBlock = (i, dir) => {
    const blocks = [...editing.blocks]
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
    setEditing({ ...editing, blocks })
  }
  const removeBlock = (i) => setEditing({ ...editing, blocks: editing.blocks.filter((_, idx) => idx !== i) })
  const addBlock = (type) => setEditing({ ...editing, blocks: [...editing.blocks, newBlock(type)] })

  const handleImageUpload = async (i, file) => {
    if (!file) return
    setUploadingIdx(i)
    try {
      const url = await uploadLineImage({ companyId, file })
      updateBlock(i, { image_url: url })
    } catch (e) {
      setError(e?.message || 'アップロードに失敗しました')
    } finally {
      setUploadingIdx(-1)
    }
  }

  const validate = () => {
    if (!editing?.title?.trim()) return 'タイトルを入力してください'
    if (!editing.blocks?.length) return 'メッセージを 1 つ以上追加してください'
    if (editing.blocks.length > 5) return 'メッセージは最大 5 個までです'
    for (const b of editing.blocks) {
      if (b.block_type === 'text' && !b.text_content?.trim()) return 'テキストを入力してください'
      if (b.block_type === 'image' && !b.image_url) return '画像を選択してください'
      if (b.block_type === 'coupon' && !b.coupon_id) return 'クーポンを選択してください'
    }
    return null
  }

  const buildPayload = () => {
    const seg = segments.find(s => s.id === editing.target_segment_id)
    const baseConditions = seg?.conditions || {}
    return {
      id: editing.id,
      companyId,
      title: editing.title.trim(),
      target_segment_id: editing.target_segment_id || null,
      // 必ず自店舗にスコープ (誤配信防止)
      target_snapshot: withStoreScope(baseConditions, storeId),
      notification_disabled: false,
      blocks: editing.blocks,
      userId
    }
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true); setError(null)
    try {
      await saveMessage(buildPayload())
      backToList()
      await load()
    } catch (e) {
      setError('保存失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async () => {
    setConfirmSend(false)
    const err = validate()
    if (err) { setError(err); return }
    setSending(true); setError(null)
    try {
      const messageId = await saveMessage(buildPayload())
      const res = await sendMessage(messageId)
      // 履歴に追加
      await logDispatch({
        messageId, storeId, companyId, userId,
        recipientCount: res.recipient_count,
        deliveredCount: res.delivered_count,
        failedCount: res.failed_count,
        conditions: buildPayload().target_snapshot
      })
      backToList()
      await load()
    } catch (e) {
      setError('送信失敗')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (m) => {
    if (!window.confirm(`「${m.title}」を削除しますか?`)) return
    try {
      await deleteMessage(m.id)
      await load()
    } catch (e) {
      setError('削除失敗')
    }
  }

  // ============ RENDER: edit view ============
  if (view === 'edit' && editing) {
    const isReadonly = editing.status === 'sent' || editing.status === 'failed'
    return (
      <div className="bc-form-page">
        <div className="bc-form-header">
          <button className="bc-icon-btn" onClick={backToList} aria-label="戻る">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="bc-form-title">
            {!editing.id ? '新規メッセージ' : isReadonly ? '送信済みメッセージ' : 'メッセージを編集'}
          </div>
        </div>

        <div className="bc-form-body">

        {isReadonly && editing.sent_at && (
          <div className="bc-readonly-info">
            <span>{formatDateTime(editing.sent_at)} に送信</span>
            <span>配信 {editing.delivered_count} / {editing.recipient_count} 名</span>
          </div>
        )}

        <section className="bc-form-section">
        <h3 className="bc-form-section-title">配信の目的</h3>
        <p className="bc-form-section-help">後で振り返れるよう、メッセージに名前を付けます (お客様には表示されません)。</p>
        <div className="bc-field">
          <label className="bc-field-label">タイトル <span className="bc-required">*</span></label>
          <input
            className="bc-input"
            type="text"
            value={editing.title}
            disabled={isReadonly}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            placeholder="例: 5月の特別クーポン"
            maxLength={60}
          />
        </div>

        <div className="bc-field">
          <label className="bc-field-label">配信対象 <span className="bc-optional">(任意)</span></label>
          <div className="bc-select-wrap">
            <select
              className="bc-select"
              value={editing.target_segment_id}
              disabled={isReadonly}
              onChange={(e) => {
                setEditing({ ...editing, target_segment_id: e.target.value })
                refreshAudience(e.target.value)
              }}
            >
              <option value="">自店舗の全 LINE 連携回答者</option>
              {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <span className="material-symbols-outlined bc-select-chevron">expand_more</span>
          </div>
        </div>
        </section>

        <section className="bc-form-section">
        <h3 className="bc-form-section-title">メッセージ内容 <span className="bc-required">*</span></h3>
        <p className="bc-form-section-help">テキスト・画像・クーポンを最大 5 つ並べられます。上から順番に LINE に届きます。</p>
        <div className="bc-field">
          <label className="bc-field-label">ブロック ({editing.blocks.length}/5)</label>
          {editing.blocks.map((b, i) => (
            <div key={i} className="bc-block">
              <div className="bc-block-head">
                <span className="bc-block-num">{i + 1}</span>
                <span className="material-symbols-outlined bc-block-icon">{BLOCK_ICON[b.block_type]}</span>
                <span className="bc-block-type">{BLOCK_LABEL[b.block_type]}</span>
                {!isReadonly && (
                  <div className="bc-block-actions">
                    <button className="bc-icon-btn-sm" disabled={i === 0} onClick={() => moveBlock(i, -1)}>
                      <span className="material-symbols-outlined">arrow_upward</span>
                    </button>
                    <button className="bc-icon-btn-sm" disabled={i === editing.blocks.length - 1} onClick={() => moveBlock(i, 1)}>
                      <span className="material-symbols-outlined">arrow_downward</span>
                    </button>
                    <button className="bc-icon-btn-sm danger" onClick={() => removeBlock(i)}>
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                )}
              </div>

              {b.block_type === 'text' && (
                <textarea
                  className="bc-textarea"
                  rows={4}
                  disabled={isReadonly}
                  placeholder="本文を入力"
                  value={b.text_content || ''}
                  onChange={(e) => updateBlock(i, { text_content: e.target.value })}
                  maxLength={2000}
                />
              )}

              {b.block_type === 'image' && (
                <div className="bc-image-block">
                  {b.image_url ? (
                    <div className="bc-image-preview">
                      <img src={b.image_url} alt="" />
                      {!isReadonly && (
                        <button className="bc-icon-btn-sm danger image-remove" onClick={() => updateBlock(i, { image_url: '' })}>
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <label className="bc-image-upload">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isReadonly || uploadingIdx === i}
                        onChange={(e) => handleImageUpload(i, e.target.files?.[0])}
                        style={{ display: 'none' }}
                      />
                      <span className="material-symbols-outlined">add_photo_alternate</span>
                      {uploadingIdx === i ? 'アップロード中…' : '画像を選択'}
                    </label>
                  )}
                  <input
                    className="bc-input bc-input-sm"
                    type="url"
                    placeholder="リンク URL (任意)"
                    value={b.link_url || ''}
                    disabled={isReadonly}
                    onChange={(e) => updateBlock(i, { link_url: e.target.value || null })}
                  />
                </div>
              )}

              {b.block_type === 'coupon' && (
                <div className="bc-select-wrap">
                  <select
                    className="bc-select"
                    value={b.coupon_id || ''}
                    disabled={isReadonly}
                    onChange={(e) => updateBlock(i, { coupon_id: e.target.value })}
                  >
                    <option value="">選択してください</option>
                    {coupons.map(c => <option key={c.id} value={c.id}>{c.title || c.name}</option>)}
                  </select>
                  <span className="material-symbols-outlined bc-select-chevron">expand_more</span>
                </div>
              )}
            </div>
          ))}

          {!isReadonly && editing.blocks.length < 5 && (
            <div className="bc-add-block-row">
              {Object.entries(BLOCK_LABEL).map(([type, label]) => (
                <button key={type} className="bc-add-block-btn" onClick={() => addBlock(type)}>
                  <span className="material-symbols-outlined">{BLOCK_ICON[type]}</span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        </section>

        {error && <div className="bc-error">{error}</div>}

        {!isReadonly && (
          <div className="bc-action-bar">
            <button className="bc-btn-secondary" onClick={handleSave} disabled={saving || sending}>
              {saving ? '保存中…' : '下書き保存'}
            </button>
            <button className="bc-btn-primary" onClick={() => setConfirmSend(true)} disabled={saving || sending || audience === 0}>
              {sending ? '送信中…' : `送信 (${audience})`}
            </button>
          </div>
        )}

        </div>

        {confirmSend && (
          <div className="bc-modal-overlay" onClick={() => setConfirmSend(false)}>
            <div className="bc-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="bc-modal-title">配信を実行しますか?</h3>
              <p className="bc-modal-text">
                「{editing.title}」を <strong>{audience}</strong> 名に送信します。
                <br />
                送信後は取り消しできません。
              </p>
              <div className="bc-modal-actions">
                <button className="bc-btn-secondary" onClick={() => setConfirmSend(false)}>キャンセル</button>
                <button className="bc-btn-primary danger" onClick={handleSend}>送信する</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============ RENDER: list view ============
  return (
    <div className="bc-section">
      <div className="bc-list-head">
        <h3 className="bc-list-title">メッセージ</h3>
        <button className="bc-btn-primary bc-btn-sm" onClick={openNew}>
          <span className="material-symbols-outlined">add</span>
          新規
        </button>
      </div>

      {error && <div className="bc-error">{error}</div>}

      {loading ? (
        <SkCardList count={3} />
      ) : messages.length === 0 ? (
        <div className="bc-empty">
          <span className="material-symbols-outlined bc-empty-icon">mail</span>
          <p>メッセージがまだありません</p>
          <button className="bc-btn-primary bc-btn-sm" onClick={openNew}>最初のメッセージを作成</button>
        </div>
      ) : (
        <ul className="bc-card-list">
          {messages.map(m => {
            const status = STATUS[m.status] || STATUS.draft
            return (
              <li key={m.id} className="bc-card" onClick={() => openEdit(m)}>
                <div className="bc-card-head">
                  <h4 className="bc-card-title">{m.title}</h4>
                  <span className={`bc-card-status ${status.cls}`}>{status.label}</span>
                </div>
                <div className="bc-card-meta">
                  {m.status === 'sent' ? (
                    <>{formatDateTime(m.sent_at)} · 配信 {m.delivered_count}/{m.recipient_count} 名</>
                  ) : (
                    <>作成 {formatDateTime(m.created_at)}</>
                  )}
                </div>
                <button
                  className="bc-card-delete"
                  onClick={(e) => { e.stopPropagation(); handleDelete(m) }}
                  aria-label="削除"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default BroadcastMessages
