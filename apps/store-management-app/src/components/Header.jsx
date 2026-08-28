import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Header.css'

const Header = () => {
  const { partnerTheme, partnerThemeLoaded } = useAuth()

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const headerBg = partnerThemeLoaded
    ? (partnerTheme?.primary_color
        ? `linear-gradient(135deg, ${partnerTheme.primary_color} 0%, ${partnerTheme.primary_color}cc 100%)`
        : 'white')
    : 'white'

  return (
    <header className="header" style={{ background: headerBg, transition: 'background 0.3s ease' }}>
      <div className="header-left" />

      {partnerThemeLoaded && (
        <img
          src={partnerTheme?.logo_dark_url || '/assets/logos/header-logo.png'}
          alt="Logo"
          className="header-logo"
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        />
      )}

      <div className="header-right" />
    </header>
  )
}

export default Header
