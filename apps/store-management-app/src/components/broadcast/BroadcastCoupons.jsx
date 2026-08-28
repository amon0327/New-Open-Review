import React, { useState, useEffect, useCallback } from 'react'
import { fetchCoupons, upsertCoupon, deleteCoupon, uploadLineImage, syncLineCoupon } from '../../lib/lineMessaging'
import { SkCouponList } from '../Skeleton'

const REWARD_TYPES = [
  { value: 'discount', label: '割引' },
  { value: 'free', label: '無料提供' }
]

const CURRENCY_OPTIONS = [
  { value: 'JPY', label: 'JPY (円)' },
  { value: 'USD', label: 'USD' },
  { value: 'KRW', label: 'KRW' },
  { value: 'TWD', label: 'TWD' },
  { value: 'THB', label: 'THB' }
]

const LOTTERY_PROBABILITY_OPTIONS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 99]
const MAX_ACQUIRE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 50, 100, 200, 500, 1000, 2000, 5000, 10000]

const empty = {
  id: null,
  title: '',
  description: '',
  image_url: '',
  has_start_at: false,
  start_at: '',
  expires_at: '',
  reward_type: 'discount',
  reward_price_info_type: 'fixed',
  reward_fixed_amount: '',
  reward_percentage: '',
  reward_currency: 'JPY',
  acquisition_type: 'normal',
  acquisition_lottery_probability: '',
  acquisition_max_acquire_count: '',
  max_use_count_per_ticket: 1,
  usage_condition: ''
}

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const toDatetimeLocalValue = (iso) => {
  if (!iso) return ''
  return iso.slice(0, 16)
}

const Required = () => <span className="bc-required">*</span>
const Optional = () => <span className="bc-optional">(任意)</span>

const BroadcastCoupons = ({ companyId, userId, onFormMode }) => {
  const [view, setView] = useState('list')

  useEffect(() => {
    onFormMode?.(view === 'edit')
    return () => onFormMode?.(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!companyId) return
    try {
      setLoading(true)
      const data = await fetchCoupons(companyId)
      setCoupons(data)
    } catch (e) {
      setError('読み込み失敗')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { load() }, [load])

  const openNew = () => { setEditing({ ...empty }); setView('edit'); setError(null) }
  const openEdit = (c) => {
    setEditing({
      ...empty,
      id: c.id,
      title: c.title || c.name || '',
      description: c.description || '',
      image_url: c.image_url || '',
      has_start_at: !!c.start_at,
      start_at: toDatetimeLocalValue(c.start_at),
      expires_at: toDatetimeLocalValue(c.expires_at),
      reward_type: ['discount', 'free'].includes(c.reward_type) ? c.reward_type : 'discount',
      reward_price_info_type: c.reward_price_info_type || 'fixed',
      reward_fixed_amount: c.reward_fixed_amount ?? '',
      reward_percentage: c.reward_percentage ?? '',
      reward_currency: c.reward_currency || 'JPY',
      acquisition_type: c.acquisition_type || 'normal',
      acquisition_lottery_probability: c.acquisition_lottery_probability ?? '',
      acquisition_max_acquire_count: c.acquisition_max_acquire_count ?? '',
      max_use_count_per_ticket: c.max_use_count_per_ticket ?? 1,
      usage_condition: c.usage_condition || c.terms_text || ''
    })
    setView('edit'); setError(null)
  }
  const back = () => { setEditing(null); setView('list'); setError(null) }

  const handleImageUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadLineImage({ companyId, file })
      setEditing(prev => ({ ...prev, image_url: url }))
    } catch (e) {
      setError(e?.message || 'アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const validate = () => {
    if (!editing.title.trim()) return 'クーポンタイトルを入力してください'
    if (editing.has_start_at && !editing.start_at) return '開始日時を指定してください'
    if (!editing.expires_at) return '終了日時を指定してください'
    if (editing.reward_type === 'discount') {
      if (editing.reward_price_info_type === 'fixed' && !editing.reward_fixed_amount) return '割引金額を入力してください'
      if (editing.reward_price_info_type === 'percentage' && !editing.reward_percentage) return '割引率を入力してください'
    }
    if (editing.acquisition_type === 'lottery') {
      if (!editing.acquisition_lottery_probability) return '当選確率を選択してください'
      if (!editing.acquisition_max_acquire_count) return '当選上限数を選択してください'
    }
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true); setError(null)
    try {
      const saved = await upsertCoupon({
        ...editing,
        companyId,
        start_at: editing.has_start_at && editing.start_at
          ? new Date(editing.start_at).toISOString()
          : null,
        expires_at: editing.expires_at ? new Date(editing.expires_at).toISOString() : null
      })

      // LINE 公式 Coupon API に登録 (失敗しても保存は完了する)
      try {
        if (saved?.id) await syncLineCoupon(saved.id)
      } catch (syncErr) {
        console.error('LINE クーポン同期失敗:', syncErr)
      }

      back()
      await load()
    } catch (e) {
      setError('保存失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c) => {
    if (!window.confirm(`「${c.title || c.name}」を削除しますか?`)) return
    try { await deleteCoupon(c.id); await load() }
    catch (e) { setError('削除失敗') }
  }

  const formatReward = (c) => {
    if (c.reward_type === 'free') return '無料'
    if (c.reward_price_info_type === 'percentage' && c.reward_percentage != null) return `${c.reward_percentage}% OFF`
    if (c.reward_price_info_type === 'fixed' && c.reward_fixed_amount != null) {
      const cur = c.reward_currency === 'JPY' ? '円' : ` ${c.reward_currency || ''}`
      return `${c.reward_fixed_amount}${cur} OFF`
    }
    return ''
  }

  // ============ EDIT (フルページ) ============
  if (view === 'edit' && editing) {
    const isDiscount = editing.reward_type === 'discount'
    const isPercentage = editing.reward_price_info_type === 'percentage'
    const isLottery = editing.acquisition_type === 'lottery'

    return (
      <div className="bc-form-page">
        {/* sticky ヘッダ */}
        <div className="bc-form-header">
          <button className="bc-icon-btn" onClick={back} aria-label="戻る">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="bc-form-title">{editing.id ? 'クーポンを編集' : '新規クーポン'}</div>
        </div>

        <div className="bc-form-body">
          {/* === 基本情報 === */}
          <section className="bc-form-section">
            <h3 className="bc-form-section-title">クーポンの内容</h3>
            <p className="bc-form-section-help">お客様に表示される名前と説明を入力します。</p>
            <div className="bc-field">
              <label className="bc-field-label">タイトル <Required /></label>
              <input className="bc-input" type="text" maxLength={50}
                placeholder="例: 来店ありがとうクーポン"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              <div className="bc-field-help">お客様の LINE に最初に表示される名前です</div>
            </div>
            <div className="bc-field">
              <label className="bc-field-label">説明文 <Optional /></label>
              <textarea className="bc-textarea" rows={3} maxLength={300}
                placeholder="例: いつもご来店ありがとうございます。次回ご利用いただける割引クーポンです。"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
          </section>

          {/* === カバー画像 === */}
          <section className="bc-form-section">
            <h3 className="bc-form-section-title">カバー画像 <Optional /></h3>
            <p className="bc-form-section-help">クーポンの目を引く画像を設定できます。</p>
            {editing.image_url ? (
              <div className="bc-image-preview">
                <img src={editing.image_url} alt="" />
                <button className="bc-icon-btn-sm danger image-remove"
                  onClick={() => setEditing({ ...editing, image_url: '' })}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ) : (
              <label className="bc-image-upload">
                <input type="file" accept="image/*" disabled={uploading}
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                  style={{ display: 'none' }} />
                <span className="material-symbols-outlined">add_photo_alternate</span>
                {uploading ? 'アップロード中…' : '画像を選択'}
              </label>
            )}
          </section>

          {/* === 特典内容 === */}
          <section className="bc-form-section">
            <h3 className="bc-form-section-title">特典の内容</h3>
            <p className="bc-form-section-help">どのような割引・サービスを提供しますか?</p>
            <div className="bc-field">
              <label className="bc-field-label">特典タイプ</label>
              <div className="bc-segmented">
                {REWARD_TYPES.map(opt => (
                  <button key={opt.value} type="button"
                    className={`bc-segmented-item ${editing.reward_type === opt.value ? 'active' : ''}`}
                    onClick={() => setEditing({ ...editing, reward_type: opt.value })}>{opt.label}</button>
                ))}
              </div>
            </div>

            {isDiscount && (
              <div className="bc-sub-card">
                <div className="bc-field">
                  <label className="bc-field-label">割引方法</label>
                  <div className="bc-radio-row">
                    <label className={`bc-radio ${!isPercentage ? 'active' : ''}`}>
                      <input type="radio" value="fixed" checked={!isPercentage}
                        onChange={() => setEditing({ ...editing, reward_price_info_type: 'fixed' })} />
                      <span>定額</span>
                    </label>
                    <label className={`bc-radio ${isPercentage ? 'active' : ''}`}>
                      <input type="radio" value="percentage" checked={isPercentage}
                        onChange={() => setEditing({ ...editing, reward_price_info_type: 'percentage' })} />
                      <span>パーセンテージ</span>
                    </label>
                  </div>
                </div>

                {!isPercentage ? (
                  <div className="bc-field-row">
                    <div className="bc-field">
                      <label className="bc-field-label">割引金額 <Required /></label>
                      <div className="bc-input-with-suffix">
                        <input className="bc-input" type="number" min="1"
                          value={editing.reward_fixed_amount}
                          onChange={(e) => setEditing({ ...editing, reward_fixed_amount: e.target.value })} />
                        <span className="bc-suffix">{editing.reward_currency === 'JPY' ? '円' : editing.reward_currency}</span>
                      </div>
                    </div>
                    <div className="bc-field">
                      <label className="bc-field-label">通貨</label>
                      <div className="bc-select-wrap">
                        <select className="bc-select" value={editing.reward_currency}
                          onChange={(e) => setEditing({ ...editing, reward_currency: e.target.value })}>
                          {CURRENCY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                        <span className="material-symbols-outlined bc-select-chevron">expand_more</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bc-field">
                    <label className="bc-field-label">割引率 <Required /></label>
                    <div className="bc-input-with-suffix">
                      <input className="bc-input" type="number" min="1" max="99"
                        value={editing.reward_percentage}
                        onChange={(e) => setEditing({ ...editing, reward_percentage: e.target.value })} />
                      <span className="bc-suffix">%</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* === 獲得条件 === */}
          <section className="bc-form-section">
            <h3 className="bc-form-section-title">配り方</h3>
            <p className="bc-form-section-help">全員に配布するか、抽選にするかを選びます。</p>
            <div className="bc-radio-row">
              <label className={`bc-radio ${!isLottery ? 'active' : ''}`}>
                <input type="radio" value="normal" checked={!isLottery}
                  onChange={() => setEditing({ ...editing, acquisition_type: 'normal' })} />
                <span>通常 (誰でも獲得可)</span>
              </label>
              <label className={`bc-radio ${isLottery ? 'active' : ''}`}>
                <input type="radio" value="lottery" checked={isLottery}
                  onChange={() => setEditing({ ...editing, acquisition_type: 'lottery' })} />
                <span>抽選</span>
              </label>
            </div>

            {isLottery && (
              <div className="bc-sub-card">
                <div className="bc-field-row">
                  <div className="bc-field">
                    <label className="bc-field-label">当選確率 <Required /></label>
                    <div className="bc-select-wrap">
                      <select className="bc-select" value={editing.acquisition_lottery_probability}
                        onChange={(e) => setEditing({ ...editing, acquisition_lottery_probability: e.target.value })}>
                        <option value="">選択してください</option>
                        {LOTTERY_PROBABILITY_OPTIONS.map(n => <option key={n} value={n}>{n} %</option>)}
                      </select>
                      <span className="material-symbols-outlined bc-select-chevron">expand_more</span>
                    </div>
                  </div>
                  <div className="bc-field">
                    <label className="bc-field-label">当選上限数 <Required /></label>
                    <div className="bc-select-wrap">
                      <select className="bc-select" value={editing.acquisition_max_acquire_count}
                        onChange={(e) => setEditing({ ...editing, acquisition_max_acquire_count: e.target.value })}>
                        <option value="">選択してください</option>
                        {MAX_ACQUIRE_OPTIONS.map(n => <option key={n} value={n}>{n.toLocaleString()} 件</option>)}
                        <option value={-1}>無制限</option>
                      </select>
                      <span className="material-symbols-outlined bc-select-chevron">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* === 有効期間 === */}
          <section className="bc-form-section">
            <h3 className="bc-form-section-title">いつまで使える?</h3>
            <p className="bc-form-section-help">クーポンが利用できる期間を指定します。</p>
            <label className="bc-checkbox-row">
              <input type="checkbox" checked={editing.has_start_at}
                onChange={(e) => setEditing({
                  ...editing,
                  has_start_at: e.target.checked,
                  ...(e.target.checked ? {} : { start_at: '' })
                })} />
              <span className="bc-checkbox-box">
                <span className="material-symbols-outlined bc-checkbox-tick">check</span>
              </span>
              <span className="bc-checkbox-text">
                <span className="bc-checkbox-title">開始日時を指定する</span>
              </span>
            </label>
            {editing.has_start_at && (
              <div className="bc-field">
                <label className="bc-field-label">開始日時 <Required /></label>
                <input className="bc-input" type="datetime-local" value={editing.start_at}
                  onChange={(e) => setEditing({ ...editing, start_at: e.target.value })} />
              </div>
            )}
            <div className="bc-field">
              <label className="bc-field-label">終了日時 <Required /></label>
              <input className="bc-input" type="datetime-local" value={editing.expires_at}
                onChange={(e) => setEditing({ ...editing, expires_at: e.target.value })} />
            </div>
          </section>

          {/* === その他 === */}
          <section className="bc-form-section">
            <h3 className="bc-form-section-title">使用ルール</h3>
            <p className="bc-form-section-help">何回まで使えるか、利用時の注意事項を設定します。</p>
            <div className="bc-field">
              <label className="bc-field-label">1人あたり使用回数</label>
              <div className="bc-radio-row">
                <label className={`bc-radio ${editing.max_use_count_per_ticket === 1 ? 'active' : ''}`}>
                  <input type="radio" value={1} checked={editing.max_use_count_per_ticket === 1}
                    onChange={() => setEditing({ ...editing, max_use_count_per_ticket: 1 })} />
                  <span>1回のみ</span>
                </label>
                <label className={`bc-radio ${editing.max_use_count_per_ticket === -1 ? 'active' : ''}`}>
                  <input type="radio" value={-1} checked={editing.max_use_count_per_ticket === -1}
                    onChange={() => setEditing({ ...editing, max_use_count_per_ticket: -1 })} />
                  <span>無制限</span>
                </label>
              </div>
            </div>
            <div className="bc-field">
              <label className="bc-field-label">利用条件 <Optional /></label>
              <textarea className="bc-textarea" rows={2} maxLength={500}
                placeholder="例: 1,000円以上のご注文時にご利用いただけます"
                value={editing.usage_condition}
                onChange={(e) => setEditing({ ...editing, usage_condition: e.target.value })} />
            </div>
          </section>

          {error && <div className="bc-error">{error}</div>}

          <div className="bc-action-bar single">
            <button className="bc-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============ LIST ============
  return (
    <div className="bc-section">
      <div className="bc-list-head">
        <h3 className="bc-list-title">クーポン</h3>
        <button className="bc-btn-primary bc-btn-sm" onClick={openNew}>
          <span className="material-symbols-outlined">add</span>新規
        </button>
      </div>

      {error && <div className="bc-error">{error}</div>}

      {loading ? (
        <SkCouponList count={3} />
      ) : coupons.length === 0 ? (
        <div className="bc-empty">
          <span className="material-symbols-outlined bc-empty-icon">local_offer</span>
          <p>クーポンがまだありません</p>
          <button className="bc-btn-primary bc-btn-sm" onClick={openNew}>最初のクーポンを作成</button>
        </div>
      ) : (
        <ul className="bc-card-list">
          {coupons.map(c => (
            <li key={c.id} className="bc-card coupon-card" onClick={() => openEdit(c)}>
              {c.image_url && <div className="coupon-thumb"><img src={c.image_url} alt="" /></div>}
              <div className="coupon-body">
                <h4 className="bc-card-title">{c.title || c.name}</h4>
                <div className="coupon-reward">{formatReward(c)}</div>
                <div className="bc-card-meta">
                  {c.expires_at ? `期限: ${formatDate(c.expires_at)}` : '期限なし'}
                </div>
              </div>
              <button className="bc-card-delete" onClick={(e) => { e.stopPropagation(); handleDelete(c) }}>
                <span className="material-symbols-outlined">delete</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BroadcastCoupons
