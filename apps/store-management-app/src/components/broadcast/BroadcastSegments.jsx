import React, { useState, useEffect, useCallback } from 'react'
import {
  fetchSegments, upsertSegment, deleteSegment,
  previewAudience
} from '../../lib/lineMessaging'
import { SkCardList } from '../Skeleton'

const NPS_OPTIONS = [
  { value: 'promoter', label: '推奨者' },
  { value: 'passive', label: '中立者' },
  { value: 'detractor', label: '批判者' }
]
const GENDERS = ['男性', '女性', 'その他']
const AGE_GROUPS = [
  '~19歳', '20歳~24歳', '25歳~29歳', '30歳~34歳', '35歳~39歳',
  '40歳~44歳', '45歳~49歳', '50歳~54歳', '55歳~59歳',
  '60歳~69歳', '70歳~79歳', '80歳~'
]
const VISIT_COUNTS = ['初めて', '2回目', '3回目', '4回目', '5回目', '6回目~10回目', '11回目以上']
const COMPANIONS = [
  'お一人', 'ご家族', 'ご友人', '恋人・パートナー',
  '職場の同僚', 'お取引先・ビジネス関係', 'その他'
]
const REVISIT_PERIODS = ['1ヶ月以内', '3ヶ月以内', '6ヶ月以内', '10ヶ月以内', '1年以内', '1年以上']

const empty = {
  id: null,
  name: '',
  description: '',
  conditions: {
    store_ids: [],
    nps_segments: [],
    genders: [],
    age_groups: [],
    visit_counts: [],
    companions: [],
    revisit_periods: [],
    answered_from: '',
    answered_to: ''
  }
}

const Required = () => <span className="bc-required">*</span>
const Optional = () => <span className="bc-optional">(任意)</span>

const ChipMultiSelect = ({ options, selected, onChange }) => {
  const safe = Array.isArray(selected) ? selected : []
  const toggle = (v) => onChange(safe.includes(v) ? safe.filter(x => x !== v) : [...safe, v])
  return (
    <div className="bc-chips">
      {options.map(opt => {
        const v = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        const active = safe.includes(v)
        return (
          <button key={v} type="button"
            className={`bc-chip ${active ? 'active' : ''}`}
            onClick={() => toggle(v)}>{label}</button>
        )
      })}
    </div>
  )
}

// 折りたたみグループ (タップでチップ群を展開/閉じる)
const FilterToggle = ({ label, options, selected, onChange, getLabel }) => {
  const [open, setOpen] = useState(false)
  const safe = Array.isArray(selected) ? selected : []
  const summary = safe.length === 0
    ? '指定なし'
    : (getLabel ? safe.map(getLabel).join(' / ') : safe.join(' / '))
  return (
    <div className="bc-toggle">
      <button type="button"
        className={`bc-toggle-head ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}>
        <span className="bc-toggle-label">{label}</span>
        <span className={`bc-toggle-summary ${safe.length === 0 ? 'empty' : ''}`}>{summary}</span>
        <span className="material-symbols-outlined bc-toggle-chevron">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && (
        <div className="bc-toggle-body">
          <ChipMultiSelect options={options} selected={safe} onChange={onChange} />
        </div>
      )}
    </div>
  )
}

const BroadcastSegments = ({ companyId, storeId, userStores, onFormMode }) => {
  const [view, setView] = useState('list')

  useEffect(() => {
    onFormMode?.(view === 'edit')
    return () => onFormMode?.(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [estimate, setEstimate] = useState(0)
  const [estimating, setEstimating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!companyId) return
    try {
      setLoading(true)
      const data = await fetchSegments(companyId)
      setSegments(data)
    } catch (e) {
      setError('読み込み失敗')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { load() }, [load])

  // 自分が管理するすべての店舗の ID 一覧
  const allOwnStoreIds = (userStores || []).map(s => s.store_id)

  // 編集中の条件が変わったら推定対象人数を再計算 (debounced)
  useEffect(() => {
    if (view !== 'edit' || !editing || !companyId) return
    const timer = setTimeout(async () => {
      setEstimating(true)
      try {
        const c = editing.conditions || {}
        const effectiveStoreIds = (c.store_ids && c.store_ids.length > 0)
          ? c.store_ids
          : allOwnStoreIds
        const scoped = { ...c, store_ids: effectiveStoreIds }
        const count = await previewAudience({ companyId, conditions: scoped })
        setEstimate(count)
      } catch (e) {
        console.warn('[segments] previewAudience failed:', e?.message, e)
        setEstimate(0)
      } finally {
        setEstimating(false)
      }
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, editing, companyId, allOwnStoreIds.join(',')])

  const openNew = () => {
    setEditing({
      ...empty,
      conditions: {
        ...empty.conditions,
        // デフォルトは現在の店舗のみ
        store_ids: storeId ? [storeId] : []
      }
    })
    setView('edit'); setError(null)
  }
  const openEdit = (s) => {
    setEditing({
      id: s.id,
      name: s.name || '',
      description: s.description || '',
      conditions: {
        store_ids: s.conditions?.store_ids || [],
        nps_segments: s.conditions?.nps_segments || [],
        genders: s.conditions?.genders || [],
        age_groups: s.conditions?.age_groups || [],
        visit_counts: s.conditions?.visit_counts || [],
        companions: s.conditions?.companions || [],
        revisit_periods: s.conditions?.revisit_periods || [],
        answered_from: s.conditions?.answered_from || '',
        answered_to: s.conditions?.answered_to || ''
      }
    })
    setView('edit'); setError(null)
  }
  const back = () => { setEditing(null); setView('list'); setError(null) }

  const setCondition = (key, val) => setEditing({
    ...editing,
    conditions: { ...editing.conditions, [key]: val }
  })

  const handleSave = async () => {
    if (!editing.name.trim()) { setError('セグメント名を入力してください'); return }
    setSaving(true); setError(null)
    try {
      // 空の配列・空文字は条件から除く (jsonb をスッキリ)
      const c = editing.conditions
      const cleaned = {}
      if (c.store_ids?.length) cleaned.store_ids = c.store_ids
      if (c.nps_segments?.length) cleaned.nps_segments = c.nps_segments
      if (c.genders?.length) cleaned.genders = c.genders
      if (c.age_groups?.length) cleaned.age_groups = c.age_groups
      if (c.visit_counts?.length) cleaned.visit_counts = c.visit_counts
      if (c.companions?.length) cleaned.companions = c.companions
      if (c.revisit_periods?.length) cleaned.revisit_periods = c.revisit_periods
      if (c.answered_from) cleaned.answered_from = c.answered_from
      if (c.answered_to) cleaned.answered_to = c.answered_to

      await upsertSegment({
        id: editing.id,
        companyId,
        name: editing.name.trim(),
        description: editing.description.trim() || null,
        conditions: cleaned
      })
      back(); await load()
    } catch (e) {
      setError('保存失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (s) => {
    if (!window.confirm(`「${s.name}」を削除しますか?`)) return
    try { await deleteSegment(s.id); await load() }
    catch (e) { setError('削除失敗') }
  }

  if (view === 'edit' && editing) {
    return (
      <div className="bc-form-page">
        <div className="bc-form-header">
          <button className="bc-icon-btn" onClick={back} aria-label="戻る">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="bc-form-title">{editing.id ? 'ターゲットを編集' : '新規ターゲット'}</div>
        </div>

        <div className="bc-form-body">
          <section className="bc-form-section">
            <h3 className="bc-form-section-title">ターゲットの名前</h3>
            <p className="bc-form-section-help">どんなお客様に向けたものか、後で分かるよう名前を付けます。</p>
            <div className="bc-field">
              <label className="bc-field-label">名前 <Required /></label>
              <input className="bc-input" type="text" maxLength={50}
                placeholder="例: リピーター女性"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="bc-field">
              <label className="bc-field-label">メモ <Optional /></label>
              <input className="bc-input" type="text" maxLength={120}
                placeholder="例: 30代以上の女性のリピーター向け"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
          </section>

          <section className="bc-form-section">
            <h3 className="bc-form-section-title">対象店舗</h3>
            <p className="bc-form-section-help">どの店舗の回答者に配信するかを選択。何も選ばないと、あなたが管理するすべての店舗が対象になります。</p>
            <div className="bc-chips">
              <button type="button"
                className={`bc-chip ${editing.conditions.store_ids.length === 0 ? 'active' : ''}`}
                onClick={() => setCondition('store_ids', [])}>
                すべての店舗
              </button>
              {(userStores || []).map(s => {
                const id = s.store_id
                const name = s.stores?.name || `店舗 ${id}`
                const active = editing.conditions.store_ids.includes(id)
                return (
                  <button key={id} type="button"
                    className={`bc-chip ${active ? 'active' : ''}`}
                    onClick={() => {
                      const cur = editing.conditions.store_ids
                      const next = active ? cur.filter(x => x !== id) : [...cur, id]
                      setCondition('store_ids', next)
                    }}>
                    {name}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="bc-form-section">
            <h3 className="bc-form-section-title">絞り込み条件 <Optional /></h3>
            <p className="bc-form-section-help">タップして条件を選択。複数選んだ場合は OR (どれかに当てはまる人) になります。</p>

            {/* NPS option ラベル取得用 (value -> label) */}
            <FilterToggle
              label="推奨度"
              options={NPS_OPTIONS}
              selected={editing.conditions.nps_segments}
              onChange={(v) => setCondition('nps_segments', v)}
              getLabel={(v) => NPS_OPTIONS.find(o => o.value === v)?.label || v}
            />
            <FilterToggle label="性別" options={GENDERS}
              selected={editing.conditions.genders}
              onChange={(v) => setCondition('genders', v)} />
            <FilterToggle label="年代" options={AGE_GROUPS}
              selected={editing.conditions.age_groups}
              onChange={(v) => setCondition('age_groups', v)} />
            <FilterToggle label="来店回数" options={VISIT_COUNTS}
              selected={editing.conditions.visit_counts}
              onChange={(v) => setCondition('visit_counts', v)} />
            <FilterToggle label="同行者" options={COMPANIONS}
              selected={editing.conditions.companions}
              onChange={(v) => setCondition('companions', v)} />
            <FilterToggle label="再来店時期" options={REVISIT_PERIODS}
              selected={editing.conditions.revisit_periods}
              onChange={(v) => setCondition('revisit_periods', v)} />
          </section>

          <section className="bc-form-section">
            <h3 className="bc-form-section-title">回答日 <Optional /></h3>
            <p className="bc-form-section-help">アンケートに回答した期間で絞り込めます。</p>
            <div className="bc-field">
              <label className="bc-field-label">開始日</label>
              <input className="bc-input" type="date"
                value={editing.conditions.answered_from}
                onChange={(e) => setCondition('answered_from', e.target.value)} />
            </div>
            <div className="bc-field">
              <label className="bc-field-label">終了日</label>
              <input className="bc-input" type="date"
                value={editing.conditions.answered_to}
                onChange={(e) => setCondition('answered_to', e.target.value)} />
            </div>
          </section>

          {/* 推定人数を sticky で表示 */}
          <div className="bc-estimate-sticky">
            <span className="material-symbols-outlined">group</span>
            <span>
              {estimating ? '推定中…' :
                <>このターゲットには <strong>{estimate.toLocaleString()}</strong> 名が該当</>
              }
            </span>
          </div>

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

  return (
    <div className="bc-section">
      <div className="bc-list-head">
        <h3 className="bc-list-title">ターゲット</h3>
        <button className="bc-btn-primary bc-btn-sm" onClick={openNew}>
          <span className="material-symbols-outlined">add</span>新規
        </button>
      </div>

      {error && <div className="bc-error">{error}</div>}

      {loading ? (
        <SkCardList count={3} />
      ) : segments.length === 0 ? (
        <div className="bc-empty">
          <span className="material-symbols-outlined bc-empty-icon">group</span>
          <p>ターゲットがまだありません</p>
          <button className="bc-btn-primary bc-btn-sm" onClick={openNew}>最初のターゲットを作成</button>
        </div>
      ) : (
        <ul className="bc-card-list">
          {segments.map(s => {
            const c = s.conditions || {}
            const npsLabels = (c.nps_segments || []).map(v => NPS_OPTIONS.find(o => o.value === v)?.label || v)
            const tags = [
              ...npsLabels,
              ...(c.genders || []),
              ...(c.age_groups || []),
              ...(c.visit_counts || []),
              ...(c.companions || []),
              ...(c.revisit_periods || [])
            ]
            return (
              <li key={s.id} className="bc-card" onClick={() => openEdit(s)}>
                <h4 className="bc-card-title">{s.name}</h4>
                {tags.length > 0 && (
                  <div className="bc-card-tags">
                    {tags.map((t, i) => <span key={i} className="bc-card-tag">{t}</span>)}
                  </div>
                )}
                <button className="bc-card-delete" onClick={(e) => { e.stopPropagation(); handleDelete(s) }}>
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

export default BroadcastSegments
