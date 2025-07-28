import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AnimatePresence } from 'framer-motion';
import { Box, CircularProgress } from '@mui/material';

import { supabase } from './supabaseClient';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import CreatePage from './components/CreatePage';

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

function App() {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'dashboard', 'create'
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const ensureBusinessUserExists = async (user) => {
    try {
      // business_usersテーブルにエントリが存在するかチェック
      const { data: existingUser, error: selectError } = await supabase
        .from('business_users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (selectError && selectError.code === 'PGRST116') {
        // エントリが存在しない場合は作成
        const { error: insertError } = await supabase
          .from('business_users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || '',
            company_name: user.user_metadata?.company || ''
          });

        if (insertError) {
          console.error('business_users自動作成エラー:', insertError);
        }
      } else if (selectError) {
        console.error('business_usersチェックエラー:', selectError);
      }
    } catch (error) {
      console.error('ensureBusinessUserExists エラー:', error);
    }
  };

  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await ensureBusinessUserExists(session.user);
        setCurrentView('dashboard');
      }
      setLoading(false);
    });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await ensureBusinessUserExists(session.user);
        setCurrentView('dashboard');
      } else {
        setCurrentView('login');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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

  const handleCreateClick = () => {
    setCurrentView('create');
  };

  const handleBackToDashboard = () => {
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
        return <CreatePage onBackClick={handleBackToDashboard} user={user} />;
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AnimatePresence mode="wait">
        {renderCurrentView()}
      </AnimatePresence>
    </ThemeProvider>
  );
}

export default App;