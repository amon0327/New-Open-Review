import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import './UnauthorizedPage.css'

const UnauthorizedPage = () => {
  const { signOut, partnerTheme } = useAuth()
  const primaryColor = partnerTheme?.primary_color || '#5e17eb'

  const handleContactSupport = () => {
    window.location.href = 'mailto:info@openreview.jp?subject=店舗アクセス権限について'
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="auth-page" style={{ '--primary-color': primaryColor }}>
      <div className="auth-card">
        <div className="auth-icon">
          <span className="material-symbols-outlined">lock</span>
        </div>

        <h1 className="auth-title">アクセス権限がありません</h1>
        <p className="auth-description">
          この店舗の管理者にアクセス権限の付与を依頼してください。
        </p>

        <div className="auth-actions">
          <button className="btn-primary" onClick={handleContactSupport}>
            管理者に問い合わせる
          </button>
          <button className="btn-text" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedPage
