import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography } from '@mui/material';

import WelcomePage from './components/WelcomePage';
import NotFoundPage from './components/NotFoundPage';
import CompletionPage from './components/CompletionPage';
import QuestionsPage from './components/QuestionsPage';
import RequiredQuestionsPage from './components/RequiredQuestionsPage';
import PreviewLoginPage from './components/PreviewLoginPage';
import WinnerPage from './components/WinnerPage';
import CooldownPage from './components/CooldownPage';
import UnauthorizedPage from './components/UnauthorizedPage';
import StoreRedirectPage from './components/StoreRedirectPage';
import LiffEntryPage from './components/LiffEntryPage';
import LiffRootHandler from './components/LiffRootHandler';
import SimpleLiffTest from './components/SimpleLiffTest';

// LIFF初期化
import { isInLineApp, getLineProfile, getLineIdToken } from './lib/liff';
import { signInWithLine } from './lib/supabase';
import { initializeLiffOnce } from './utils/liffGlobal';
import liff from '@line/liff';

// OpenReviewテーマ設定（Flutterアプリに基づく）
const theme = createTheme({
  palette: {
    primary: {
      main: '#8C52FF',
      dark: '#1800AD',
    },
    secondary: {
      main: '#1800AD',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#14181B',
      secondary: '#57636C',
    },
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem', // 20px
    },
    body1: {
      fontWeight: 400,
      fontSize: '0.875rem', // 14px
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '1rem', // 16px
    },
  },
  shape: {
    borderRadius: 24, // Flutter app uses 24px for buttons
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          height: 50,
          minWidth: 200,
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: 'none',
          textTransform: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(140, 82, 255, 0.3)',
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
  const [liffReady, setLiffReady] = useState(false);
  const [liffError, setLiffError] = useState(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        
        // LIFF SDKが読み込まれているか確認
        if (typeof liff === 'undefined') {
          setLiffError('LIFF SDKが読み込まれていません');
          setLiffReady(true); // エラーでも続行
          return;
        }
        
        try {
          const success = await initializeLiffOnce();
          
          if (success) {
            // liff.readyを待つ
            if (liff.ready) {
              await liff.ready;
            }
          }
        } catch (initError) {
          setLiffError('LIFF初期化エラー: ' + initError.message);
        }
        
        // エラーがあっても続行
        setLiffReady(true);
        
      } catch (error) {
        setLiffError('予期しないエラー: ' + error.message);
        setLiffReady(true); // エラーでも続行
      }
    };

    // 即座にLIFF初期化を開始
    initLiff();
  }, []);

  // LIFF初期化中の表示（5秒でタイムアウト）
  const [initTimeout, setInitTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!liffReady) {
        setInitTimeout(true);
        setLiffReady(true); // 強制的に続行
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [liffReady]);
  
  // LIFF初期化中は表示しない（すぐに処理を続行）


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<LiffRootHandler />} />
          <Route path="/test" element={<SimpleLiffTest />} />
          <Route path="/form/:storeCode" element={<StoreRedirectPage />} />
          <Route path="/liff" element={<LiffEntryPage />} />
          <Route path="/liff/:storeCode" element={<LiffEntryPage />} />
          <Route path="/preview" element={<PreviewLoginPage />} />
          <Route path="/required-questions" element={<RequiredQuestionsPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/completion" element={<CompletionPage />} />
          <Route path="/winner" element={<WinnerPage />} />
          <Route path="/cooldown" element={<CooldownPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
