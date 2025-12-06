import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AnimatePresence } from 'framer-motion';
import { Box, CircularProgress } from '@mui/material';
import { Toaster } from 'react-hot-toast';

import { supabase } from './supabaseClient';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import CreatePage from './components/CreatePage';
import StaffInvitationLogin from './components/StaffInvitationLogin';
import StaffInvitationComplete from './components/StaffInvitationComplete';
import PartnerInvitationLogin from './components/PartnerInvitationLogin';
import PartnerInvitationComplete from './components/PartnerInvitationComplete';
import CompanyInvitationLogin from './components/CompanyInvitationLogin';
import CompanyInvitationComplete from './components/CompanyInvitationComplete';

// カスタムテーマ設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#5e17eb',
      light: '#764ba2',
      dark: '#4c0db8',
    },
    secondary: {
      main: '#667eea',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.95rem',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(94, 23, 235, 0.3)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 8px 25px rgba(94, 23, 235, 0.4)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },
  },
});

// CreatePage ラッパー - URL パラメータから formId を取得
function CreatePageWrapper({ user, onBackClick }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const formId = searchParams.get('formId');

  console.log('🔍 CreatePageWrapper - formId from URL:', formId);

  // 戻る処理 - ブラウザの履歴で一つ前に戻る
  const handleBack = () => {
    console.log('⬅️ CreatePageWrapper - Going back to previous page');
    navigate(-1);
  };

  return <CreatePage user={user} formId={formId} onBackClick={handleBack} />;
}

function App() {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'dashboard', 'create'
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentFormId, setCurrentFormId] = useState(null);


  const ensureBusinessUserExists = async (user) => {
    try {
      // タイムアウト時間を延長（10秒）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database timeout')), 10000);
      });

      const selectPromise = supabase
        .from('business_users')
        .select('id')
        .eq('id', user.id)
        .single();

      const { data: existingUser, error: selectError } = await Promise.race([
        selectPromise,
        timeoutPromise
      ]);

      if (selectError && selectError.code === 'PGRST116') {
        // エントリが存在しない場合は作成（短縮タイムアウト）
        const insertPromise = supabase
          .from('business_users')
          .insert([{
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || ''
          }]);

        const insertTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Insert timeout')), 10000);
        });

        const { error: insertError } = await Promise.race([
          insertPromise,
          insertTimeoutPromise
        ]);

        if (insertError) {
          console.error('business_users自動作成エラー:', insertError);
        }
      } else if (selectError && selectError.message !== 'Database timeout') {
        console.error('business_usersチェックエラー:', selectError);
      }
    } catch (error) {
      // Database timeoutはログのみ出力して、アプリケーションの動作は継続
      if (error.message.includes('timeout')) {
        console.warn('⚠️ Database connection timeout - アプリケーションは継続動作します');
      } else {
        console.error('ensureBusinessUserExists エラー:', error);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    let isInitialLoad = true;

    // 認証状態の変更を監視（初回セッション取得も含む）
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;


      try {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // URLに招待トークンが含まれているかチェック
          const currentPath = window.location.pathname;
          const isInvitationFlow = currentPath.includes('/staff-invitation/') || currentPath.includes('/partner-invitation/') || currentPath.includes('/company-invitation/');

          console.log('App.js - currentPath:', currentPath);
          console.log('App.js - isInvitationFlow:', isInvitationFlow);
          
          // 初回ロード時のみダッシュボードに遷移（招待フロー以外）
          if (isMounted && isInitialLoad && !isInvitationFlow) {
            setCurrentView('dashboard');
          }
          
          // business_usersチェックを非同期で実行（UIブロッキングを避ける）
          if (isInitialLoad) {
            // 初回ロード時は高速化のため非同期実行
            ensureBusinessUserExists(session.user).catch(error => {
              console.error('初回business_users処理エラー:', error);
            });
          } else {
            // 初回以外は同期実行
            try {
              await ensureBusinessUserExists(session.user);
            } catch (error) {
              console.error('business_users処理エラー:', error);
            }
          }
        } else {
          if (isMounted) {
            setCurrentView('login');
          }
        }
      } catch (error) {
        console.error('認証状態変更エラー:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          isInitialLoad = false;
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (user) => {
    setUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('login');
  };

  const handleCreateClick = (formId) => {
    console.log('🔍 App.js - handleCreateClickが呼ばれました');
    console.log('🔍 App.js - 受け取ったformId:', formId);
    setCurrentFormId(formId);
    console.log('🔍 App.js - currentFormIdを設定:', formId);
    setCurrentView('create');
    console.log('🔍 App.js - currentViewをcreateに設定');
  };

  const handleBackToDashboard = () => {
    setCurrentFormId(null);
    setCurrentView('dashboard');
  };

  const renderCurrentView = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <CircularProgress sx={{ color: 'white' }} />
        </Box>
      );
    }

    switch (currentView) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'dashboard':
        return <Dashboard onCreateClick={handleCreateClick} onLogout={handleLogout} user={user} />;
      case 'create':
        return <CreatePage onBackClick={handleBackToDashboard} user={user} formId={currentFormId} />;
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            maxWidth: '400px'
          },
          success: {
            style: {
              background: '#5e17eb',
              color: '#fff'
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#fff'
            },
          },
        }}
        containerStyle={{
          bottom: '80px',
        }}
      />
      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            {/* 店舗スタッフ招待ログインページ */}
            <Route path="/staff-invitation/:token" element={<StaffInvitationLogin />} />

            {/* 店舗スタッフ招待完了ページ */}
            <Route path="/staff-invitation/:token/complete" element={<StaffInvitationComplete />} />

            {/* パートナーメンバー招待ログインページ */}
            <Route path="/partner-invitation/:token" element={<PartnerInvitationLogin />} />

            {/* パートナーメンバー招待完了ページ */}
            <Route path="/partner-invitation/:token/complete" element={<PartnerInvitationComplete />} />

            {/* 企業メンバー招待ログインページ */}
            <Route path="/company-invitation/:token" element={<CompanyInvitationLogin />} />

            {/* 企業メンバー招待完了ページ */}
            <Route path="/company-invitation/:token/complete" element={<CompanyInvitationComplete />} />

            {/* メインアプリケーション */}
            <Route path="/*" element={
              loading ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  <CircularProgress sx={{ color: 'white' }} />
                </Box>
              ) : (
                <Routes>
                  <Route path="/" element={
                    !user ? (
                      <LoginPage onLogin={handleLogin} />
                    ) : currentView === 'dashboard' ? (
                      <Dashboard onCreateClick={handleCreateClick} onLogout={handleLogout} user={user} />
                    ) : currentView === 'create' ? (
                      <CreatePage onBackClick={handleBackToDashboard} user={user} formId={currentFormId} />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } />
                  <Route path="/dashboard" element={
                    user ? (
                      <Dashboard onCreateClick={handleCreateClick} onLogout={handleLogout} user={user} />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } />
                  {/* パートナー企業ダッシュボード - URLパラメータで企業を指定 */}
                  <Route path="/company/:companyId/dashboard" element={
                    user ? (
                      <Dashboard onCreateClick={handleCreateClick} onLogout={handleLogout} user={user} />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } />
                  <Route path="/create" element={
                    user ? (
                      <CreatePageWrapper user={user} onBackClick={handleBackToDashboard} />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  } />
                </Routes>
              )
            } />
          </Routes>
        </AnimatePresence>
      </Router>
    </ThemeProvider>
  );
}

export default App;