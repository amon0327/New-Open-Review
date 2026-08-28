import React from 'react'
import './SkeletonScreen.css'

/**
 * モダンなスケルトンスクリーンコンポーネント
 * @param {string} type - スケルトンのタイプ
 * @param {number} count - 表示する項目数
 * @param {Object} customStyles - カスタムスタイル
 */
const SkeletonScreen = ({ type = 'card', count = 3, customStyles = {} }) => {
  const renderSkeleton = (index) => {
    switch (type) {
      case 'staff-score-cards':
        return (
          <div
            key="skeleton-staff-scores"
            className="skeleton-staff-score-container"
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              overflowY: 'hidden',
              paddingBottom: '8px',
              paddingLeft: 'calc(16px + env(safe-area-inset-left))',
              paddingRight: 'calc(16px + env(safe-area-inset-right))',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              position: 'relative',
              left: 'calc(-32px - env(safe-area-inset-left))',
              width: '100vw',
              maxWidth: 'none',
              ...customStyles
            }}
          >
            {Array.from({ length: count }, (_, i) => (
              <div
                key={i}
                className="skeleton-staff-score-card"
                style={{
                  width: '140px',
                  height: '140px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'center',
                  borderRadius: '12px',
                  padding: '16px 12px',
                  background: 'linear-gradient(to right, #f9fafb, #f3f4f6)',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div className="skeleton-line" style={{ height: '14px', width: '80px' }}></div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <div className="skeleton-line" style={{ height: '48px', width: '60px', borderRadius: '8px' }}></div>
                  <div className="skeleton-line" style={{ height: '16px', width: '20px' }}></div>
                </div>
                <div className="skeleton-line" style={{ height: '16px', width: '90px' }}></div>
              </div>
            ))}
          </div>
        )

      case 'score-card':
        return (
          <div key={index} className="skeleton-score-card-container" style={customStyles}>
            <div className="skeleton-score-card-item">
              <div className="skeleton-score-card-content">
                <div className="skeleton-score-left">
                  <div className="skeleton-line skeleton-indicator"></div>
                  <div className="skeleton-score-info">
                    <div className="skeleton-line skeleton-score-title"></div>
                    <div className="skeleton-score-date-info">
                      <div className="skeleton-line skeleton-score-date"></div>
                      <div className="skeleton-line skeleton-score-responses"></div>
                    </div>
                  </div>
                </div>
                <div className="skeleton-score-right">
                  <div className="skeleton-score-value-area">
                    <div className="skeleton-line skeleton-score-number"></div>
                    <div className="skeleton-line skeleton-score-unit"></div>
                  </div>
                </div>
              </div>
              <div className="skeleton-staff-section">
                <div className="skeleton-line skeleton-staff-label"></div>
                <div className="skeleton-staff-list">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="skeleton-staff-item">
                      <div className="skeleton-circle skeleton-staff-avatar"></div>
                      <div className="skeleton-line skeleton-staff-name"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'comment-card':
        return (
          <div key={index} className="skeleton-comment-card" style={customStyles}>
            <div className="skeleton-comment-header">
              <div className="skeleton-line skeleton-comment-date"></div>
              <div className="skeleton-line skeleton-comment-rating"></div>
            </div>
            <div className="skeleton-comment-content">
              <div className="skeleton-line skeleton-comment-text-1"></div>
              <div className="skeleton-line skeleton-comment-text-2"></div>
              <div className="skeleton-line skeleton-comment-text-3"></div>
            </div>
          </div>
        )

      case 'review-timeline-item':
        return (
          <div key={index} className="skeleton-review-timeline-item" style={customStyles}>
            <div className="skeleton-review-header">
              <div className="skeleton-review-tags">
                <div className="skeleton-line skeleton-attribute-tag"></div>
                <div className="skeleton-line skeleton-category-tag"></div>
              </div>
              <div className="skeleton-line skeleton-review-datetime"></div>
            </div>
            <div className="skeleton-review-rating">
              <div className="skeleton-rating-blocks">
                {Array.from({ length: 11 }, (_, i) => (
                  <div key={i} className="skeleton-rating-block"></div>
                ))}
              </div>
            </div>
            <div className="skeleton-review-text">
              <div className="skeleton-line skeleton-review-text-1"></div>
              <div className="skeleton-line skeleton-review-text-2"></div>
            </div>
          </div>
        )

      case 'alert-card':
        return (
          <div key={index} className="skeleton-alert-card" style={customStyles}>
            <div className="skeleton-alert-content">
              <div className="skeleton-line skeleton-alert-icon"></div>
              <div className="skeleton-alert-info">
                <div className="skeleton-line skeleton-alert-title"></div>
                <div className="skeleton-line skeleton-alert-subtitle"></div>
                <div className="skeleton-line skeleton-alert-time"></div>
              </div>
            </div>
          </div>
        )

      case 'staff-card':
        return (
          <div key={index} className="skeleton-staff-card" style={customStyles}>
            <div className="skeleton-staff-content">
              <div className="skeleton-circle skeleton-staff-photo"></div>
              <div className="skeleton-staff-info">
                <div className="skeleton-line skeleton-staff-name"></div>
                <div className="skeleton-line skeleton-staff-time"></div>
              </div>
            </div>
          </div>
        )

      case 'chart':
        return (
          <div key={index} className="skeleton-chart" style={customStyles}>
            <div className="skeleton-chart-header">
              <div className="skeleton-line skeleton-chart-title"></div>
              <div className="skeleton-line skeleton-chart-period"></div>
            </div>
            <div className="skeleton-chart-content">
              <div className="skeleton-chart-area"></div>
              <div className="skeleton-chart-legend">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="skeleton-line skeleton-legend-item"></div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'stats':
        return (
          <div key={index} className="skeleton-stats" style={customStyles}>
            <div className="skeleton-stats-row">
              <div className="skeleton-stat-item">
                <div className="skeleton-line skeleton-stat-label"></div>
                <div className="skeleton-line skeleton-stat-value"></div>
              </div>
              <div className="skeleton-stat-divider"></div>
              <div className="skeleton-stat-item">
                <div className="skeleton-line skeleton-stat-label"></div>
                <div className="skeleton-line skeleton-stat-value"></div>
              </div>
            </div>
          </div>
        )

      case 'list-item':
        return (
          <div key={index} className="skeleton-list-item" style={customStyles}>
            <div className="skeleton-line skeleton-list-title"></div>
            <div className="skeleton-line skeleton-list-subtitle"></div>
          </div>
        )

      case 'calendar':
        return (
          <div key={index} className="skeleton-calendar" style={customStyles}>
            <div className="skeleton-calendar-header">
              <div className="skeleton-line skeleton-calendar-title"></div>
            </div>
            <div className="skeleton-calendar-days">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="skeleton-calendar-day">
                  <div className="skeleton-line skeleton-day-number"></div>
                  <div className="skeleton-line skeleton-day-label"></div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'card':
      default:
        return (
          <div key={index} className="skeleton-card" style={customStyles}>
            <div className="skeleton-line skeleton-card-title"></div>
            <div className="skeleton-line skeleton-card-content"></div>
            <div className="skeleton-line skeleton-card-footer"></div>
          </div>
        )
    }
  }

  // staff-score-cards の場合は横スクロールコンテナを直接返す
  if (type === 'staff-score-cards') {
    return renderSkeleton(0)
  }

  return (
    <div className="skeleton-container">
      {Array.from({ length: count }, (_, index) => renderSkeleton(index))}
    </div>
  )
}

export default SkeletonScreen