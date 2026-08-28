import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button, Snackbar } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { getStoreRedirectUrl } from '../lib/supabase';
import { isInLineApp } from '../lib/liff';
import { extractStoreCodeFromLiffUrl } from '../utils/liffUrlHelper';

const LiffEntryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { storeCode: pathStoreCode } = useParams();
  const [error, setError] = useState(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  useEffect(() => {
    const handleLiffEntry = async () => {
      // 詳細なデバッグ情報を表示
      console.log('=== LIFF Entry Debug Info ===');
      console.log('window.location.href:', window.location.href);
      console.log('window.location.origin:', window.location.origin);
      console.log('window.location.pathname:', window.location.pathname);
      console.log('window.location.search:', window.location.search);
      console.log('window.location.hash:', window.location.hash);
      console.log('searchParams entries:', Array.from(searchParams.entries()));
      console.log('pathStoreCode from useParams:', pathStoreCode);
      
      // reviewFormIdパラメータをチェック
      const reviewFormId = searchParams.get('reviewFormId');
      if (reviewFormId) {
        console.log('Found reviewFormId parameter:', reviewFormId);
        // 少し遅延させて直接WelcomePageにリダイレクト
        setTimeout(() => {
          navigate(`/?reviewFormId=${reviewFormId}`, { replace: true });
        }, 100);
        return;
      }
      
      // ヘルパー関数を使用して店舗コードを取得
      const storeCode = extractStoreCodeFromLiffUrl(
        location.pathname,
        searchParams,
        window.location
      ) || pathStoreCode;
      
      if (!storeCode) {
        console.error('No store code provided in LIFF URL');
        console.error('Current URL:', window.location.href);
        console.error('Available params:', Array.from(searchParams.keys()));
        
        // デバッグ情報を詳しく表示
        const debugInfo = {
          currentURL: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
          searchParams: Array.from(searchParams.entries()),
          pathStoreCode: pathStoreCode || 'なし'
        };
        
        setError(`店舗情報が指定されていません`);
        // リダイレクトを削除
        return;
      }
      
      console.log('Store code found:', storeCode);

      // LINEアプリ内でない場合は通常のform URLにリダイレクト
      if (!isInLineApp()) {
        window.location.href = `https://reviewform.openreview.jp/form/${storeCode}`;
        return;
      }

      try {
        console.log('Calling getStoreRedirectUrl with storeCode:', storeCode);
        
        // もしstoreCodeがUUID形式なら、直接reviewFormIdとして使用することも試す
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(storeCode)) {
          console.log('Store code looks like a UUID, trying as reviewFormId...');
          // 直接reviewFormIdとして試す
          navigate(`/?reviewFormId=${storeCode}`, { replace: true });
          return;
        }
        
        // 店舗コードからreviewFormIdを取得
        const result = await getStoreRedirectUrl(storeCode);
        console.log('Store redirect result:', result);

        if (result.success && result.formId) {
          // WelcomePageにリダイレクト（LINEログインが自動的に処理される）
          console.log(`Redirecting to /?reviewFormId=${result.formId}&storeCode=${storeCode}`);
          navigate(`/?reviewFormId=${result.formId}&storeCode=${storeCode}`, { replace: true });
        } else {
          console.error('Store redirect failed:', result);
          console.error('Store code used:', storeCode);
          console.error('Full URL:', window.location.href);
          
          // エラーの詳細情報を含める
          let errorDetail = 'このURLは現在利用できません';
          if (result.error) {
            errorDetail += `\n\nエラー: ${result.error}`;
          }
          if (result.details) {
            errorDetail += `\n詳細: ${JSON.stringify(result.details, null, 2)}`;
          }
          errorDetail += `\n\nStore: ${storeCode}`;
          
          setError(errorDetail);
          // リダイレクトを削除
        }
      } catch (err) {
        console.error('LIFF entry error:', err);
        console.error('Error details:', err.message, err.stack);
        console.error('Store code used:', storeCode);
        setError(`店舗情報の取得に失敗しました\nStore: ${storeCode}\nError: ${err.message}`);
        // リダイレクトを削除
      }
    };

    handleLiffEntry();
  }, []); // 依存関係を空にして初回のみ実行

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShowCopySuccess(true);
    }).catch(err => {
      console.error('Failed to copy URL:', err);
    });
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
      }}
    >
      {error ? (
        <Box sx={{ textAlign: 'center', p: 3 }}>
          <Typography 
            variant="h6" 
            color="error" 
            sx={{ mb: 2, whiteSpace: 'pre-line' }}
          >
            {error}
          </Typography>
          <Box 
            sx={{ 
              p: 2, 
              mb: 2, 
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
              wordBreak: 'break-all',
              userSelect: 'text',
              cursor: 'text'
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
              現在のURL:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                userSelect: 'text'
              }}
            >
              {window.location.href}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyUrl}
            sx={{ mb: 2 }}
          >
            URLをコピー
          </Button>
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              正しいURLの例:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                mb: 1,
                color: 'text.secondary'
              }}
            >
              店舗コード: ?storeCode=店舗コード
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}
            >
              フォームID: ?reviewFormId=フォームID
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          <CircularProgress size={48} sx={{ mb: 3 }} />
          <Typography variant="body1" color="text.secondary">
            読み込み中...
          </Typography>
        </>
      )}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={showCopySuccess}
        autoHideDuration={2000}
        onClose={() => setShowCopySuccess(false)}
        message="URLをコピーしました"
      />
    </Box>
  );
};

export default LiffEntryPage;