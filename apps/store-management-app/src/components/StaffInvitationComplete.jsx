import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import '../pages/UnauthorizedPage.css'
import './StaffInvitationComplete.css'

const StaffInvitationComplete = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, partnerTheme } = useAuth()
  const primaryColor = partnerTheme?.primary_color || '#5e17eb'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [errorKind, setErrorKind] = useState(null)
  const [success, setSuccess] = useState(false)
  const [storeData, setStoreData] = useState(null)

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        completeInvitation()
      } else {
        navigate(`/staff-invitation/${token}`)
      }
    }
  }, [user, authLoading, token, navigate])

  const completeInvitation = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.access_token) {
        throw new Error('認証セッションが見つかりません')
      }

      // supabase.functions.invoke は 非 2xx 時 data が null になる場合がある。
      // Edge Function は 410 でも JSON ボディを返すので fetch で直接叩いて
      // ステータスに関わらず body を読む。
      const supabaseUrl = supabase.supabaseUrl || import.meta.env.VITE_SUPABASE_URL
      const anonKey = supabase.supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(`${supabaseUrl}/functions/v1/complete-staff-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ invitationToken: token }),
      })
      let data = null
      try { data = await res.json() } catch (_) { /* ignore */ }

      // 1) 既メンバーならホームへ
      if (data?.alreadyMember) {
        window.location.href = '/'
        return
      }

      // 2) 招待 URL が使用済 + どこにもメンバーじゃない → 専用エラー文言
      if (data?.alreadyUsed) {
        setErrorKind('alreadyUsed')
        setError(data?.error || 'この招待 URL は既に使用済みです')
        return
      }

      // 3) その他エラー
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || '招待完了に失敗しました')
      }

      setStoreData(data.store)
      setSuccess(true)
    } catch (err) {
      console.error('招待完了エラー:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToApp = () => {
    // フルリロードして AuthContext を再初期化する
    window.location.href = '/'
  }

  // ローディング
  if (authLoading || loading) {
    return (
      <div className="auth-page" style={{ '--primary-color': primaryColor }}>
        <div className="auth-card">
          <div className="auth-loading">
            <div className="btn-spinner" style={{ color: primaryColor, width: 28, height: 28, borderWidth: 3 }} />
            <p className="auth-loading-text">登録を完了しています</p>
          </div>
        </div>
      </div>
    )
  }

  // エラー
  if (error) {
    const isAlreadyUsed = errorKind === 'alreadyUsed'
    return (
      <div className="auth-page" style={{ '--primary-color': primaryColor }}>
        <div className="auth-card">
          <div className="auth-icon error">
            <span className="material-symbols-outlined">error</span>
          </div>
          <h1 className="auth-title">
            {isAlreadyUsed ? '使用済みの招待 URL です' : '登録できませんでした'}
          </h1>
          <p className="auth-description">
            {isAlreadyUsed
              ? 'この招待 URL は既に使用されています。新しい招待が必要な場合は店舗管理者にご連絡ください。'
              : '原因を確認しますので、お手数ですが、この画面の写真を店舗の管理者にお送りください。'}
          </p>
        </div>
      </div>
    )
  }

  // 成功
  if (success) {
    return (
      <div className="auth-page" style={{ '--primary-color': primaryColor }}>
        <div className="auth-card">
          <div className="auth-icon success">
            <span className="material-symbols-outlined">check</span>
          </div>
          <h1 className="auth-title">登録が完了しました</h1>
          <p className="auth-description">
            {storeData?.name} のスタッフとして登録されました
          </p>
          <div className="auth-actions">
            <button onClick={handleGoToApp} className="btn-primary">
              アプリを開始
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default StaffInvitationComplete
