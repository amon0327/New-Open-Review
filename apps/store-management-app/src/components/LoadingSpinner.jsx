import React from 'react'
import './LoadingSpinner.css'

/**
 * ローディングスピナーコンポーネント
 * @param {string} size - サイズ (small, medium, large)
 * @param {string} message - 表示するメッセージ
 * @param {string} color - スピナーの色
 * @param {boolean} overlay - オーバーレイ表示するかどうか
 */
const LoadingSpinner = ({ 
  size = 'medium', 
  message = '読み込み中...', 
  color = '#3b82f6',
  overlay = false 
}) => {
  const spinnerSize = {
    small: '20px',
    medium: '32px',
    large: '48px'
  }

  const containerClass = overlay ? 'loading-spinner-overlay' : 'loading-spinner-container'

  return (
    <div className={containerClass}>
      <div className="loading-spinner-content">
        <div 
          className="loading-spinner"
          style={{
            width: spinnerSize[size],
            height: spinnerSize[size],
            borderTopColor: color
          }}
        ></div>
        {message && (
          <p className="loading-message">{message}</p>
        )}
      </div>
    </div>
  )
}

export default LoadingSpinner