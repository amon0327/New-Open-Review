import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for pending OAuth redirect
  useEffect(() => {
    const checkOAuthRedirect = () => {
      
      // Check if reviewFormId is in URL parameters
      const urlReviewFormId = searchParams.get('reviewFormId');
      if (urlReviewFormId) {
        navigate(`/questions?reviewFormId=${urlReviewFormId}&page=1`, { replace: true });
        return;
      }
      
      // Check localStorage
      const pendingReviewFormId = localStorage.getItem('pendingReviewFormId');
      
      if (pendingReviewFormId) {
        localStorage.removeItem('pendingReviewFormId');
        navigate(`/questions?reviewFormId=${pendingReviewFormId}&page=1`, { replace: true });
      } else {
        // Check referrer URL for reviewFormId
        const referrer = document.referrer;
        if (referrer) {
          const referrerUrl = new URL(referrer);
          const referrerReviewFormId = referrerUrl.searchParams.get('reviewFormId');
          if (referrerReviewFormId) {
            navigate(`/questions?reviewFormId=${referrerReviewFormId}&page=1`, { replace: true });
          }
        }
      }
    };

    // Check immediately and after delays
    checkOAuthRedirect();
    const timer1 = setTimeout(checkOAuthRedirect, 1000);
    const timer2 = setTimeout(checkOAuthRedirect, 3000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [navigate, searchParams]);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        padding: 3
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 480, width: '100%' }}>
        <Typography
          variant="h4"
          sx={{
            color: '#14181B',
            fontWeight: 600,
            mb: 2
          }}
        >
          アンケートが見つかりません
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#57636C',
            lineHeight: 1.6
          }}
        >
          このアンケートはLINEアプリ内でのみご利用いただけます。
          LINEがインストールされていない場合はインストールのうえ、改めてQRを読み込んでください。
        </Typography>
      </Box>
    </Box>
  );
};

export default NotFoundPage;