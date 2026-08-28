import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { initGA, trackPageView } from './utils/analytics'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import ScrollToTop from './components/ScrollToTop'
import AppInitializer from './components/AppInitializer'
import AppDataProvider from './components/AppDataProvider'
import CommentPage from './pages/CommentPage'
import LoginPage from './pages/LoginPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import StaffInvitationLogin from './components/StaffInvitationLogin'
import StaffInvitationComplete from './components/StaffInvitationComplete'
import LineCallbackPage from './components/LineCallbackPage'
import { appLifecycleManager } from './utils/appLifecycleManager'
import './App.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '20px', textAlign: 'center'}}>
          <h2>アプリケーションエラーが発生しました</h2>
          <pre style={{color: 'red', fontSize: '12px'}}>{this.state.error?.message}</pre>
          <button onClick={() => window.location.reload()}>リロード</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// メインレイアウトコンポーネント
const MainLayout = ({ children }) => (
  <>
    <Header />
    <main className="main-content">
      {children}
    </main>
  </>
)

// ページビュー追跡コンポーネント
const PageTracker = () => {
  const location = useLocation()

  useEffect(() => {
    const getPageTitle = (pathname) => {
      const routes = {
        '/': 'コメント一覧',
        '/comment': 'コメント一覧',
        '/login': 'ログイン',
        '/unauthorized': '認証エラー'
      }

      if (pathname.startsWith('/staff-invitation/')) {
        return pathname.includes('/complete') ? 'スタッフ招待完了' : 'スタッフ招待ログイン'
      }

      return routes[pathname] || 'Unknown Page'
    }

    const pageTitle = getPageTitle(location.pathname)
    trackPageView(location.pathname + location.search, pageTitle)
  }, [location])

  return null
}

// アプリケーションのメインコンテンツ
const AppContent = () => {
  useEffect(() => {
    initGA()
  }, [])

  useEffect(() => {
    console.log('🚀 App: Initializing systems...')
    console.log('✅ App: Systems initialized successfully')
  }, [])

  return (
    <Router>
      <AppDataProvider>
        <PageTracker />
        <ScrollToTop />
        <div className="app">
        <Routes>
          {/* パブリックルート（認証不要） */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* スタッフ招待関連ルート（認証不要） */}
          <Route path="/staff-invitation/:token" element={<StaffInvitationLogin />} />
          <Route path="/staff-invitation/:token/complete" element={<StaffInvitationComplete />} />

          {/* LINEログインコールバックルート（認証不要） */}
          <Route path="/auth/line/callback" element={<LineCallbackPage />} />

          {/* プロテクトされたルート（認証と権限が必要） */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout>
                <CommentPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/comment" element={
            <ProtectedRoute>
              <MainLayout>
                <CommentPage />
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* 404などの未定義ルートは全てホームにリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </AppDataProvider>
    </Router>
  )
}

// メインアプリケーションコンポーネント
function App() {
  return (
    <ErrorBoundary>
      <AppInitializer>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AppInitializer>
    </ErrorBoundary>
  )
}

export default App
