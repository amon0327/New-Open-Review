import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoginPage from '../pages/LoginPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'

const ProtectedRoute = ({ children, requirePermission = true }) => {
  const { 
    user, 
    loading, 
    hasStorePermission, 
    permissionLoading, 
    isInitialized
  } = useAuth()

  // 初期化中またはローディング中
  if (!isInitialized || loading) {
    return <LoadingScreen />
  }

  // ユーザーがいない場合
  if (!user) {
    return <LoginPage />
  }

  // 権限チェックが不要な場合
  if (!requirePermission) {
    return children
  }

  // 権限チェック中
  if (permissionLoading) {
    return <LoadingScreen />
  }

  // 権限がない場合
  if (hasStorePermission === false) {
    return <UnauthorizedPage />
  }

  // 権限がある場合
  if (hasStorePermission === true) {
    return children
  }

  // その他の場合（権限状態が不明）
  return <LoadingScreen />
}

// 専用ローディングコンポーネント
const LoadingScreen = () => {
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
      <style>{`
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

export default ProtectedRoute