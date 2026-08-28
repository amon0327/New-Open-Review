import React, { useState, useEffect } from 'react'

const AppInitializer = ({ children }) => {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // 最初のレンダリング後に初期化完了とする
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'white'
      }}>
        {/* Loading bar with gray gradient */}
        <div style={{
          width: '240px',
          height: '6px',
          backgroundColor: '#f3f4f6',
          borderRadius: '3px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            background: 'linear-gradient(90deg, #9ca3af, #d1d5db, #9ca3af)',
            borderRadius: '3px',
            animation: 'loading-bar 2s ease-in-out infinite'
          }}></div>
        </div>
        
        {/* Loading text */}
        <div style={{
          marginTop: '20px',
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          読み込み中...
        </div>
        
        {/* CSS animation for loading bar */}
        <style jsx>{`
          @keyframes loading-bar {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    )
  }

  return children
}

export default AppInitializer