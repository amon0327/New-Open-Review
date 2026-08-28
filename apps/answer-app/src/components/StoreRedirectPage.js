import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import liff from '@line/liff';
import { getStoreRedirectUrl } from '../lib/supabase';
import { initializeLiff } from '../lib/liff';

const StoreRedirectPage = () => {
  const { storeCode } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [linePromptUrl, setLinePromptUrl] = useState(null);

  useEffect(() => {
    const fetchRedirectUrl = async () => {
      if (!storeCode) {
        navigate('/not-found');
        return;
      }

      try {
        // Edge Function 呼び出しと LIFF 初期化を並列で
        const [result, liffOk] = await Promise.all([
          getStoreRedirectUrl(storeCode),
          initializeLiff().catch(() => false)
        ]);

        if (!result.success || !result.formId) {
          setError('このURLは現在利用できません');
          setTimeout(() => navigate('/not-found'), 2000);
          return;
        }

        let inLineApp = false;
        if (liffOk) {
          try { inLineApp = liff.isInClient(); } catch (_) { inLineApp = false; }
        }
        if (!inLineApp) {
          inLineApp = /Line\//i.test(navigator.userAgent || '');
        }
        const liffUrl = result.lineMiniAppUrl;

        if (!inLineApp && liffUrl) {
          // 外部ブラウザ + 会社の LIFF URL あり → LINE で開くよう誘導
          const sep = liffUrl.includes('?') ? '&' : '?';
          setLinePromptUrl(`${liffUrl}${sep}storeCode=${encodeURIComponent(storeCode)}`);
          return;
        }

        // LINE 内ブラウザ、または LIFF URL 未設定の会社 → 通常遷移
        navigate(`/?reviewFormId=${result.formId}&storeCode=${storeCode}`, { replace: true });
      } catch (err) {
        console.error('Store redirect error:', err);
        setError('店舗情報の取得に失敗しました');
        setTimeout(() => navigate('/not-found'), 2000);
      }
    };

    fetchRedirectUrl();
  }, [storeCode, navigate]);

  if (linePromptUrl) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #06C755 0%, #4cd964 100%)',
          color: 'white',
          px: 3,
          py: 6
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
          LINE内でのみご利用いただけます
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95, textAlign: 'center', mb: 4, maxWidth: 360 }}>
          このアンケートは LINE アプリ内でのみ回答できます。下のボタンから LINE で開いてご回答ください。
        </Typography>
        <Button
          variant="contained"
          size="large"
          href={linePromptUrl}
          sx={{
            backgroundColor: 'white',
            color: '#06C755',
            fontWeight: 700,
            px: 5,
            py: 1.5,
            borderRadius: '999px',
            textTransform: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          LINEで開く
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}
    >
      {error ? (
        <Typography
          variant="h6"
          sx={{
            textAlign: 'center',
            px: 3
          }}
        >
          {error}
        </Typography>
      ) : (
        <>
          <CircularProgress
            size={48}
            sx={{
              color: 'white',
              mb: 3
            }}
          />
          <Typography
            variant="body1"
            sx={{
              opacity: 0.9
            }}
          >
            読み込み中...
          </Typography>
        </>
      )}
    </Box>
  );
};

export default StoreRedirectPage;
