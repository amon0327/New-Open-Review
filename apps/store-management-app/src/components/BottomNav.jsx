import React from 'react'
import './BottomNav.css'

const NAV_ITEMS = [
  { key: 'stats',     label: '回答状況', icon: 'bar_chart' },
  { key: 'comments',  label: 'コメント', icon: 'chat_bubble' },
  { key: 'broadcast', label: 'LINE配信', icon: 'send', managerOnly: true, requiresLine: true },
  { key: 'reports',   label: 'レポート', icon: 'analytics' },
  { key: 'settings',  label: '設定',     icon: 'settings' }
]

const BottomNav = ({ activeTab, onChange, themeColor, isStaff, isLineConnected }) => {
  const items = NAV_ITEMS.filter(item => {
    // STAFF には managerOnly な項目を出さない
    if (item.managerOnly && isStaff) return false
    // LINE 未接続なら LINE 配信タブを出さない (店舗責任者でも)
    if (item.requiresLine && !isLineConnected) return false
    return true
  })

  return (
    <nav className="bottom-nav" aria-label="メインナビゲーション">
      {items.map(item => {
        const isActive = activeTab === item.key
        return (
          <button
            key={item.key}
            type="button"
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            style={isActive && themeColor ? { color: themeColor } : undefined}
            onClick={() => onChange(item.key)}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={`material-symbols-outlined bottom-nav-icon ${isActive ? 'fill-icon' : ''}`}>
              {item.icon}
            </span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav
