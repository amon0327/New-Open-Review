import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { signInWithLine } from '../lib/supabase'
import './UnauthorizedPage.css'
import './LoginPage.css'

const LoginPage = () => {
  const [isLineLoading, setIsLineLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user, loading } = useAuth()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [])

  useEffect(() => {
    if (!loading && user) {
      window.location.href = '/'
    }
  }, [user, loading])

  const handleLineLogin = async () => {
    try {
      setIsLineLoading(true)
      setError(null)
      await signInWithLine('/')
    } catch (err) {
      setError('ログインに失敗しました。もう一度お試しください。')
      setIsLineLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-loading">
            <div className="btn-spinner" style={{ color: '#5e17eb', width: 28, height: 28, borderWidth: 3 }} />
            <p className="auth-loading-text">読み込み中</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page login-page">
      <div className="login-stack">
        <div className="login-brand">
          <img src="/assets/logos/login-logo.png" alt="店舗管理" className="login-logo" />
          <h1 className="login-title">店舗管理</h1>
          <p className="login-tagline">サインインして始めましょう</p>
        </div>

        {error && (
          <div className="auth-error-inline" role="alert">{error}</div>
        )}

        <button
          className="btn-line login-cta"
          onClick={handleLineLogin}
          disabled={isLineLoading}
        >
          {isLineLoading ? (
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

        <p className="login-footnote">
          続行することで、利用規約とプライバシーポリシーに同意したものとみなされます。
        </p>
      </div>
    </div>
  )
}

export default LoginPage
