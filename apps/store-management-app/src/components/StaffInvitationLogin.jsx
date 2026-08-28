import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase, signInWithLine } from '../lib/supabase'
import '../pages/UnauthorizedPage.css'
import './StaffInvitationLogin.css'

const StaffInvitationLogin = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, partnerTheme } = useAuth()
  const primaryColor = partnerTheme?.primary_color || '#5e17eb'

  const [invitationData, setInvitationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLineLoggingIn, setIsLineLoggingIn] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        navigate(`/staff-invitation/${token}/complete`, { replace: true })
      } else {
        validateInvitation()
      }
    }
  }, [user, authLoading, token, navigate])

  const validateInvitation = async () => {
    try {
      setLoading(true)
      setError(null)

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const timeout = isMobile ? 15000 : 10000
      const maxRetries = isMobile ? 3 : 1

      let lastError = null

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (!navigator.onLine) {
            throw new Error('ネットワーク接続がありません')
          }

          const edgeFunctionPromise = supabase.functions.invoke('validate-staff-invitation', {
            body: { invitationToken: token }
          })

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database timeout')), timeout)
          })

          const { data, error } = await Promise.race([edgeFunctionPromise, timeoutPromise])

          if (error) {
            throw new Error(`招待情報の取得に失敗しました: ${error.message}`)
          }

          if (!data.success) {
            throw new Error(data.error || '招待情報の取得に失敗しました')
          }

          const invitationForState = {
            ...data.invitation,
            stores: {
              ...data.invitation.store,
              companies: data.invitation.store.company
            }
          }

          setInvitationData(invitationForState)
          return
        } catch (err) {
          lastError = err
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }
        }
      }

      throw lastError || new Error('接続に失敗しました')
    } catch (err) {
      console.error('招待検証エラー:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLineLogin = async () => {
    try {
      setIsLineLoggingIn(true)
      setError(null)
      await signInWithLine(`/staff-invitation/${token}/complete`)
    } catch (err) {
      setError(err.message)
      setIsLineLoggingIn(false)
    }
  }

  const getRoleLabel = (role) => (role === 'STORE' ? '店舗管理者' : 'スタッフ')

  // ローディング
  if (authLoading || loading) {
    return (
      <div className="auth-page" style={{ '--primary-color': primaryColor }}>
        <div className="auth-card">
          <div className="auth-loading">
            <div className="btn-spinner" style={{ color: primaryColor, width: 28, height: 28, borderWidth: 3 }} />
            <p className="auth-loading-text">招待を確認しています</p>
          </div>
        </div>
      </div>
    )
  }

  // エラー
  if (error) {
    return (
      <div className="auth-page" style={{ '--primary-color': primaryColor }}>
        <div className="auth-card">
          <div className="auth-icon error">
            <span className="material-symbols-outlined">error</span>
          </div>
          <h1 className="auth-title">招待が無効です</h1>
          <p className="auth-description">{error}</p>
          <div className="auth-actions">
            <button className="btn-primary" onClick={() => (window.location.href = '/')}>
              ホームへ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 招待詳細
  return (
    <div className="auth-page" style={{ '--primary-color': primaryColor }}>
      <div className="auth-card">
        <p className="auth-eyebrow">招待</p>
        <h1 className="auth-title">{invitationData?.name}さんへ</h1>
        <p className="auth-description">下記の店舗にスタッフとして招待されています</p>

        <div className="auth-detail">
          <div className="auth-detail-store">{invitationData?.stores?.name}</div>
          <p className="auth-detail-meta">{invitationData?.stores?.companies?.name}</p>
          {invitationData?.stores?.address && (
            <p className="auth-detail-meta">{invitationData.stores.address}</p>
          )}
          <span className="auth-role-tag">
            <span className="material-symbols-outlined">badge</span>
            {getRoleLabel(invitationData?.role)}
          </span>
        </div>

        <div className="auth-actions">
          <button
            onClick={handleLineLogin}
            disabled={isLineLoggingIn}
            className="btn-line"
          >
            {isLineLoggingIn ? (
              <span className="btn-spinner" />
            ) : (
              <>
                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 5.59 2 10c0 2.84 1.85 5.32 4.65 6.78-.2.66-.74 2.42-.85 2.79-.13.45.16.45.34.32.14-.1 2.27-1.55 3.18-2.17.88.13 1.78.21 2.68.21 5.52 0 10-3.59 10-8s-4.48-8-10-8zm-4.43 10.32H6.07V8.86c0-.18.15-.33.33-.33h.18c.18 0 .33.15.33.33v3.13H8.4c.18 0 .33.15.33.33v.18c0 .18-.15.32-.33.32H7.57zm1.96 0H9.41c-.18 0-.33-.14-.33-.32V8.86c0-.18.15-.33.33-.33h.12c.18 0 .33.15.33.33v3.46zm4.07 0h-.13a.31.31 0 0 1-.27-.16l-1.59-2.18v2.02c0 .18-.15.32-.33.32h-.18c-.18 0-.33-.14-.33-.32V8.86c0-.18.15-.33.33-.33h.13c.1 0 .19.05.26.13l1.6 2.18V8.86c0-.18.14-.33.32-.33h.19c.18 0 .33.15.33.33v3.13c0 .18-.15.33-.33.33zm3.45-2.62h-1.5v.55h1.5c.18 0 .32.15.32.33v.13c0 .18-.14.33-.32.33h-1.5v.59h1.5c.18 0 .32.15.32.33v.13c0 .18-.14.33-.32.33h-1.95c-.18 0-.33-.14-.33-.32V8.86c0-.18.15-.33.33-.33h1.95c.18 0 .32.15.32.33v.13c0 .18-.14.32-.32.32z"/>
                </svg>
                LINEでログイン
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StaffInvitationLogin
