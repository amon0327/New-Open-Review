import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Container,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  Chip,
  TextField,
  Alert,
  CircularProgress,
  Skeleton,
  Tooltip
} from '@mui/material';
import {
  Settings,
  Close,
  ContentCopy,
  Download,
  QrCode2,
  Store,
  Description,
  KeyboardArrowDown,
  Warning,
  HelpOutline
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';
import { supabase } from '../../../lib/supabase';

export default function FormPublishPage({ user, companyId: propCompanyId, companyName: propCompanyName }) {
  // 抽選設定を取得する関数（Edge Function経由）
  const fetchLotterySettings = useCallback(async (formId) => {
    try {
      // セッションを取得して認証ヘッダーを設定
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('セッションが見つかりません。');
      }

      // Edge Function経由でデータを再取得
      const { data, error } = await supabase.functions.invoke('get-form-publish-data', {
        body: {
          companyId: propCompanyId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'データの取得に失敗しました');
      }

      const { lotterySettings: lotteryData } = data.data;

      // 抽選設定をセット
      setLotterySettings({
        maxWinsPerMonth: lotteryData.maxWinsPerMonth,
        winRateDivisor: lotteryData.winRateDivisor
      });
      
      setLotteryStats({
        totalAttempts: lotteryData.currentTrials,
        totalWins: lotteryData.currentWins
      });
    } catch (e) {
      console.error('抽選設定取得エラー:', e);
      toast.error('抽選設定の取得に失敗しました');
    }
  }, [propCompanyId]);
  // ローディング・エラー状態
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


  // レビューフォームデータ（Supabaseから取得）
  const [reviewForms, setReviewForms] = useState([]);

  // 抽選設定
  const [showLotterySettings, setShowLotterySettings] = useState(false);
  const [lotterySettings, setLotterySettings] = useState({
    maxWinsPerMonth: 1,
    winRateDivisor: 1000
  });

  // 今月の抽選統計
  const [lotteryStats, setLotteryStats] = useState({
    totalAttempts: 0,
    totalWins: 0
  });
  // 抽選設定保存状態
  const [isSavingLottery, setIsSavingLottery] = useState(false);

  // 店舗データ（Supabaseから取得）
  const [stores, setStores] = useState([]);

  // 公開フォーム選択
  const [selectedPublicFormId, setSelectedPublicFormId] = useState('');
  const [savedPublicFormId, setSavedPublicFormId] = useState(''); // 保存済みのフォームID
  const [showPublicFormSettings, setShowPublicFormSettings] = useState(false);

  // LINEミニアプリURL
  const [lineMiniAppUrl, setLineMiniAppUrl] = useState('');
  const [savedLineMiniAppUrl, setSavedLineMiniAppUrl] = useState('');
  const [showLineMiniAppSettings, setShowLineMiniAppSettings] = useState(false);
  const [isSavingLineMiniApp, setIsSavingLineMiniApp] = useState(false);




  // ============================================================================
  // Edge Function経由でデータ取得
  // ============================================================================
  useEffect(() => {
    const fetchData = async () => {
      // propsからcompanyIdを取得（Dashboardから渡される）
      if (!propCompanyId) {
        console.log('companyIdがpropsから渡されていません');
        return;
      }

      setIsLoading(true);
      try {
        // セッションを取得して認証ヘッダーを設定
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('セッションが見つかりません。再度ログインしてください。');
        }

        // Edge Function経由でデータを取得
        const { data, error } = await supabase.functions.invoke('get-form-publish-data', {
          body: {
            companyId: propCompanyId
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) throw error;

        if (!data.success) {
          throw new Error(data.error || 'データの取得に失敗しました');
        }

        const { forms, stores: storesData, publishedFormId, selectedFormId, lotterySettings: lotteryData } = data.data;

        // フォームデータをセット
        const activeFormsData = forms.map(f => ({
          id: f.id,
          name: f.title,
          description: '',
          is_published: f.is_published
        }));
        setReviewForms(activeFormsData);

        // 選択されたフォームをセット
        if (publishedFormId) {
          setSelectedPublicFormId(publishedFormId);
          setSavedPublicFormId(publishedFormId);
        } else if (selectedFormId) {
          setSelectedPublicFormId(selectedFormId);
        }

        // 店舗データをセット
        setStores(storesData.map(s => ({
          ...s,
          companyName: propCompanyName || ''
        })));

        // 抽選設定をセット
        setLotterySettings({
          maxWinsPerMonth: lotteryData.maxWinsPerMonth,
          winRateDivisor: lotteryData.winRateDivisor
        });
        
        setLotteryStats({
          totalAttempts: lotteryData.currentTrials,
          totalWins: lotteryData.currentWins
        });

      } catch (error) {
        console.error('データ取得エラー:', error);
        toast.error(error.message || 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [propCompanyId, propCompanyName]);


  // ============================================================================
  // 企業抽選設定を保存
  // ============================================================================
  const saveLotterySettings = useCallback(async () => {
    if (!propCompanyId || !selectedPublicFormId) return;

    setIsSavingLottery(true);
    try {
      // セッションを取得して認証ヘッダーを設定
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('セッションが見つかりません。再度ログインしてください。');
      }

      // Edge Functionを呼び出して抽選設定を更新
      const { data, error } = await supabase.functions.invoke('update-lottery-settings', {
        body: {
          review_form_id: selectedPublicFormId,
          max_wins_per_month: lotterySettings.maxWinsPerMonth,
          win_rate_divisor: lotterySettings.winRateDivisor,
          reset_monthly_stats: false
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || '抽選設定の更新に失敗しました');
      }

      toast.success('抽選設定を保存しました');

      // 保存後に最新の設定を再取得
      await fetchLotterySettings(selectedPublicFormId);
    } catch (error) {
      console.error('抽選設定保存エラー:', error);
      toast.error(error.message || '抽選設定の保存に失敗しました');
    } finally {
      setIsSavingLottery(false);
    }
  }, [propCompanyId, selectedPublicFormId, lotterySettings, fetchLotterySettings]);

  // ============================================================================
  // 公開フォーム設定を保存
  // ============================================================================
  const savePublicFormSettings = useCallback(async () => {
    if (!propCompanyId || !selectedPublicFormId) return;

    setIsSaving(true);
    try {
      // 各店舗に対してEdge Functionを呼び出してフォーム公開設定を更新
      for (const store of stores) {
        console.log('Updating form publication for store:', { storeId: store.id, reviewFormId: selectedPublicFormId });

        // セッションを取得して認証ヘッダーを設定
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('セッションが見つかりません。再度ログインしてください。');
        }

        const { data, error } = await supabase.functions.invoke('update-form-publication', {
          body: {
            storeId: store.id,
            reviewFormId: selectedPublicFormId
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) {
          console.error('Edge function error for store:', store.id, error);
          throw error;
        }
        
        if (!data.success) {
          throw new Error(data.error || `店舗 ${store.name} のフォーム公開設定の更新に失敗しました`);
        }

        console.log('Form publication updated for store:', store.id, data);
      }

      // 以前に選択されていたフォームがあれば、review_formsテーブルで非公開に
      if (savedPublicFormId && savedPublicFormId !== selectedPublicFormId) {
        const { error: unpublishFormError } = await supabase
          .from('review_forms')
          .update({ 
            is_published: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', savedPublicFormId);

        if (unpublishFormError) {
          console.error('Unpublish form error:', unpublishFormError);
        }
      }

      // company_public_form_settingsテーブルも更新（互換性のため）
      const { error: settingsError } = await supabase
        .from('company_public_form_settings')
        .upsert({
          company_id: propCompanyId,
          public_form_id: selectedPublicFormId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });

      if (settingsError) {
        console.error('Settings update error:', settingsError);
        // エラーをログに記録するが、処理は続行
      }

      toast.success('公開フォーム設定を保存しました');
      setSavedPublicFormId(selectedPublicFormId);
      setShowPublicFormSettings(false);
    } catch (error) {
      console.error('公開フォーム設定保存エラー:', error);
      toast.error('公開フォーム設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [propCompanyId, selectedPublicFormId, savedPublicFormId, stores]);

  // 店舗のレビューフォームURLを生成（store_url_codeベース）
  // QSCローテーションに基づいて自動的に適切なフォームにリダイレクトされる
  const getStoreFormUrl = (store) => {
    if (store.store_url_code) {
      return `https://reviewform.openreview.jp/form/${store.store_url_code}`;
    }
    // store_url_codeがない場合はフォールバック（通常は発生しない）
    return `https://reviewform.openreview.jp/form/${store.id}`;
  };

  // LINEミニアプリURLを生成
  const getLineMiniAppUrl = (store) => {
    if (savedLineMiniAppUrl && store.store_url_code) {
      return `${savedLineMiniAppUrl}?storeCode=${store.store_url_code}`;
    }
    return '';
  };

  // URLをクリップボードにコピー
  const handleCopyUrl = (store, isLineMiniApp = false) => {
    const url = isLineMiniApp ? getLineMiniAppUrl(store) : getStoreFormUrl(store);
    if (!url) {
      toast.error('URLが設定されていません');
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      const urlType = isLineMiniApp ? 'LINEミニアプリ' : 'フォーム';
      toast.success(`${store.name}の${urlType}URLをコピーしました`);
    }).catch(() => {
      toast.error('コピーに失敗しました');
    });
  };

  // QRコードをダウンロード
  const handleDownloadQR = async (store) => {
    try {
      const url = getStoreFormUrl(store);
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // ダウンロードリンクを作成
      const link = document.createElement('a');
      link.download = `${store.name}_${store.companyName}_QR.png`;
      link.href = qrDataUrl;
      link.click();

      toast.success(`${store.name}のQRコードをダウンロードしました`);
    } catch (error) {
      console.error('QR code generation error:', error);
      toast.error('QRコードの生成に失敗しました');
    }
  };


  // 抽選設定変更ハンドラー
  const handleLotterySettingChange = (field, value) => {
    setLotterySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 当選確率を計算
  const calculateWinRate = () => {
    if (lotterySettings.winRateDivisor <= 0) return 0;
    return (1 / lotterySettings.winRateDivisor * 100).toFixed(3);
  };

  // LINEミニアプリURL保存
  const saveLineMiniAppUrl = useCallback(async () => {
    if (!propCompanyId) {
      toast.error('企業IDが取得できません');
      return;
    }

    setIsSavingLineMiniApp(true);
    try {
      // TODO: 実際のデータベーステーブルが必要です
      // 仮実装として、ローカルステートを更新
      setSavedLineMiniAppUrl(lineMiniAppUrl);
      toast.success('LINEミニアプリURLを保存しました');
      setShowLineMiniAppSettings(false);
    } catch (error) {
      console.error('LINEミニアプリURL保存エラー:', error);
      toast.error('設定の保存に失敗しました');
    } finally {
      setIsSavingLineMiniApp(false);
    }
  }, [propCompanyId, lineMiniAppUrl]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{ width: '100%' }}
    >
      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 2,
          px: 0
        }}
      >
        {/* ローディング表示（スケルトンスクリーン） */}
        {isLoading && (
          <Container maxWidth="xl" sx={{ mt: 2 }}>

            {/* 抽選設定セクション スケルトン */}
            <Box sx={{ mb: 4 }}>
              <Skeleton variant="text" width={120} height={36} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width={280} height={20} />
            </Box>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 0.5,
                border: '1px solid rgba(0, 0, 0, 0.06)',
                p: 2,
                mb: 4
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant="text" width={100} height={24} />
                  <Skeleton variant="text" width={150} height={24} />
                </Box>
                <Skeleton variant="circular" width={40} height={40} />
              </Box>
            </Paper>

            {/* 店舗別QRコードセクション スケルトン */}
            <Box sx={{ mb: 4 }}>
              <Skeleton variant="text" width={160} height={36} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width={320} height={20} />
            </Box>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 0.5,
                border: '1px solid rgba(0, 0, 0, 0.06)',
                overflow: 'hidden'
              }}
            >
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell><Skeleton variant="text" width={60} height={20} /></TableCell>
                      <TableCell><Skeleton variant="text" width={80} height={20} /></TableCell>
                      <TableCell align="center"><Skeleton variant="text" width={60} height={20} sx={{ mx: 'auto' }} /></TableCell>
                      <TableCell align="center"><Skeleton variant="text" width={80} height={20} sx={{ mx: 'auto' }} /></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton variant="text" width={120} height={24} /></TableCell>
                        <TableCell><Skeleton variant="text" width={200} height={20} /></TableCell>
                        <TableCell align="center"><Skeleton variant="rectangular" width={80} height={32} sx={{ mx: 'auto', borderRadius: 1 }} /></TableCell>
                        <TableCell align="center"><Skeleton variant="rectangular" width={100} height={32} sx={{ mx: 'auto', borderRadius: 1 }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Container>
        )}

        {/* メインコンテンツ（ローディング完了後に表示） */}
        {!isLoading && (
          <>

        {/* 公開フォーム選択セクション */}
        <Container maxWidth="xl" sx={{ mt: 2, mb: 3 }}>
          {/* セクションヘッダー */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1a202c',
                mb: 0.5,
                fontSize: '1.75rem'
              }}
            >
              公開フォーム設定
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem'
              }}
            >
              店舗URLで公開するレビューフォームを選択
            </Typography>
          </Box>

          {/* 公開フォーム選択カード */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 0.5,
              border: '1px solid rgba(0, 0, 0, 0.06)',
              overflow: 'hidden'
            }}
          >
            {/* メイン表示部分 */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* カラーインジケーター */}
                <Box
                  sx={{
                    width: 4,
                    height: 40,
                    borderRadius: 0.5,
                    bgcolor: '#8b5cf6'
                  }}
                />

                {/* フォーム情報 */}
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                    レビューフォーム
                  </Typography>
                  <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#8b5cf6' }}>
                    {reviewForms.find(f => f.id === savedPublicFormId)?.name || '未選択'}
                  </Typography>
                </Box>
              </Box>

              {/* 設定ボタン */}
              <IconButton
                onClick={() => {
                  if (showPublicFormSettings) {
                    // 設定を閉じる時は保存済みのIDに戻す
                    setSelectedPublicFormId(savedPublicFormId);
                  }
                  setShowPublicFormSettings(!showPublicFormSettings);
                }}
                sx={{
                  color: showPublicFormSettings ? '#5e17eb' : '#94a3b8',
                  bgcolor: showPublicFormSettings ? 'rgba(94, 23, 235, 0.08)' : 'transparent',
                  '&:hover': {
                    color: '#5e17eb',
                    bgcolor: 'rgba(94, 23, 235, 0.08)'
                  }
                }}
              >
                {showPublicFormSettings ? <Close /> : <Settings />}
              </IconButton>
            </Box>

            {/* 設定パネル（開閉式） */}
            {showPublicFormSettings && (
              <Box sx={{ borderTop: '1px solid #e5e7eb' }}>
                <Box sx={{ p: 2 }}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                        公開するレビューフォームを選択
                      </Typography>
                      <Tooltip 
                        title="このフォームが全ての店舗URLで公開されます"
                        placement="top"
                        arrow
                        sx={{
                          '& .MuiTooltip-tooltip': {
                            fontSize: '0.75rem',
                            backgroundColor: '#374151',
                            color: 'white',
                            py: 1,
                            px: 1.5
                          },
                          '& .MuiTooltip-arrow': {
                            color: '#374151'
                          }
                        }}
                      >
                        <HelpOutline 
                          sx={{ 
                            fontSize: 16, 
                            color: '#94a3b8',
                            cursor: 'help',
                            '&:hover': {
                              color: '#64748b'
                            }
                          }} 
                        />
                      </Tooltip>
                    </Box>
                    <FormControl fullWidth size="small">
                      <Select
                        value={selectedPublicFormId}
                        onChange={(e) => setSelectedPublicFormId(e.target.value)}
                        displayEmpty
                        IconComponent={KeyboardArrowDown}
                        sx={{
                          bgcolor: '#fff',
                          borderRadius: 0.5,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#e5e7eb'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#8b5cf6'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#8b5cf6'
                          }
                        }}
                      >
                        <MenuItem value="" disabled>
                          <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                            フォームを選択してください
                          </Typography>
                        </MenuItem>
                        {reviewForms.map((form) => (
                          <MenuItem key={form.id} value={form.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Description sx={{ fontSize: 16, color: '#8b5cf6' }} />
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                {form.name}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* 保存ボタン */}
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedPublicFormId(savedPublicFormId);
                        setShowPublicFormSettings(false);
                      }}
                      sx={{
                        borderRadius: 0.5,
                        px: 2.5,
                        py: 0.75,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: '#6b7280',
                        borderColor: '#e5e7eb',
                        '&:hover': {
                          borderColor: '#d1d5db',
                          bgcolor: 'rgba(107, 114, 128, 0.04)'
                        }
                      }}
                    >
                      キャンセル
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={savePublicFormSettings}
                      disabled={isSaving || !selectedPublicFormId}
                      sx={{
                        background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                        borderRadius: 0.5,
                        px: 2.5,
                        py: 0.75,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        boxShadow: 'none',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4c0dbf 0%, #5a6fd8 100%)',
                          boxShadow: '0 2px 8px rgba(94, 23, 235, 0.3)',
                        },
                        '&:disabled': {
                          opacity: 0.7
                        }
                      }}
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        </Container>

        {/* 抽選設定セクション */}
        <Container maxWidth="xl" sx={{ mb: 3 }}>
          {/* セクションヘッダー */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1a202c',
                mb: 0.5,
                fontSize: '1.75rem'
              }}
            >
              抽選設定
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem'
              }}
            >
              レビュー回答者への抽選プレゼントの設定
            </Typography>
          </Box>

          {/* 抽選設定カード */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 0.5,
              border: '1px solid rgba(0, 0, 0, 0.06)',
              overflow: 'hidden'
            }}
          >
            {/* メイン表示部分 */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* カラーインジケーター */}
                <Box
                  sx={{
                    width: 4,
                    height: 40,
                    borderRadius: 0.5,
                    bgcolor: '#f59e0b'
                  }}
                />

                {/* 抽選情報 */}
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                    当選確率
                  </Typography>
                  <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>
                    1/{lotterySettings.winRateDivisor}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    ({calculateWinRate()}%)
                  </Typography>
                </Box>

                {/* 月間当選上限 */}
                <Box sx={{ ml: 4 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                    月間上限
                  </Typography>
                  <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#374151' }}>
                    {lotterySettings.maxWinsPerMonth}名
                  </Typography>
                </Box>

                {/* 今月の試行回数 */}
                <Box sx={{ ml: 4 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                    今月の試行回数
                  </Typography>
                  <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>
                    {lotteryStats.totalAttempts}回
                  </Typography>
                </Box>

                {/* 今月の当選回数 */}
                <Box sx={{ ml: 4 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                    今月の当選回数
                  </Typography>
                  <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>
                    {lotteryStats.totalWins}回
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    (残り{lotterySettings.maxWinsPerMonth - lotteryStats.totalWins}回)
                  </Typography>
                </Box>
              </Box>

              {/* 設定ボタン */}
              <IconButton
                onClick={() => setShowLotterySettings(!showLotterySettings)}
                sx={{
                  color: showLotterySettings ? '#5e17eb' : '#94a3b8',
                  bgcolor: showLotterySettings ? 'rgba(94, 23, 235, 0.08)' : 'transparent',
                  '&:hover': {
                    color: '#5e17eb',
                    bgcolor: 'rgba(94, 23, 235, 0.08)'
                  }
                }}
              >
                {showLotterySettings ? <Close /> : <Settings />}
              </IconButton>
            </Box>

            {/* 設定パネル（開閉式） */}
            {showLotterySettings && (
              <Box sx={{ borderTop: '1px solid #e5e7eb' }}>
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* 月間当選上限 */}
                    <Box>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', mb: 1.5 }}>
                        月間当選上限（0〜20名）
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 1 }}>
                        <Slider
                          value={lotterySettings.maxWinsPerMonth}
                          onChange={(e, value) => handleLotterySettingChange('maxWinsPerMonth', value)}
                          min={0}
                          max={20}
                          step={1}
                          marks
                          sx={{
                            flex: 1,
                            color: '#5e17eb',
                            '& .MuiSlider-thumb': {
                              width: 16,
                              height: 16,
                              '&:hover, &.Mui-focusVisible': {
                                boxShadow: '0 0 0 8px rgba(94, 23, 235, 0.16)'
                              }
                            },
                            '& .MuiSlider-track': {
                              height: 4
                            },
                            '& .MuiSlider-rail': {
                              height: 4,
                              bgcolor: '#e5e7eb'
                            },
                            '& .MuiSlider-mark': {
                              bgcolor: '#d1d5db',
                              height: 8,
                              width: 2
                            }
                          }}
                        />
                        <Box
                          sx={{
                            minWidth: 60,
                            px: 1.5,
                            py: 0.75,
                            bgcolor: '#f3f4f6',
                            borderRadius: 0.5,
                            border: '1px solid #e5e7eb',
                            textAlign: 'center'
                          }}
                        >
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>
                            {lotterySettings.maxWinsPerMonth}名
                          </Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 1 }}>
                        毎月この人数まで当選が可能
                      </Typography>
                    </Box>

                    {/* 当選確率 */}
                    <Box>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', mb: 1.5 }}>
                        当選確率
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 1 }}>
                        <Slider
                          value={Math.min(Math.max(lotterySettings.winRateDivisor, 1), 10000)}
                          onChange={(e, value) => handleLotterySettingChange('winRateDivisor', value)}
                          min={1}
                          max={10000}
                          step={1}
                          sx={{
                            flex: 1,
                            color: '#f59e0b',
                            '& .MuiSlider-thumb': {
                              width: 16,
                              height: 16,
                              '&:hover, &.Mui-focusVisible': {
                                boxShadow: '0 0 0 8px rgba(245, 158, 11, 0.16)'
                              }
                            },
                            '& .MuiSlider-track': {
                              height: 4
                            },
                            '& .MuiSlider-rail': {
                              height: 4,
                              bgcolor: '#e5e7eb'
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b' }}>
                            1/
                          </Typography>
                          <TextField
                            type="number"
                            value={lotterySettings.winRateDivisor}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10);
                              if (!isNaN(value) && value >= 1) {
                                handleLotterySettingChange('winRateDivisor', value);
                              }
                            }}
                            inputProps={{
                              min: 1,
                              style: { textAlign: 'center' }
                            }}
                            sx={{
                              width: 80,
                              '& .MuiOutlinedInput-root': {
                                height: 36,
                                bgcolor: '#fffbeb',
                                '& fieldset': {
                                  borderColor: '#fbbf24'
                                },
                                '&:hover fieldset': {
                                  borderColor: '#f59e0b'
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#f59e0b'
                                }
                              },
                              '& input': {
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: '#f59e0b',
                                padding: '6px 8px',
                                MozAppearance: 'textfield'
                              },
                              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                WebkitAppearance: 'none',
                                margin: 0
                              }
                            }}
                          />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          数値が大きいほど当選確率が下がります（1以上の整数）
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b' }}>
                          ({calculateWinRate()}%)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* 保存ボタン */}
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={saveLotterySettings}
                      disabled={isSavingLottery}
                      sx={{
                        background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                        borderRadius: 0.5,
                        px: 2.5,
                        py: 0.75,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        boxShadow: 'none',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4c0dbf 0%, #5a6fd8 100%)',
                          boxShadow: '0 2px 8px rgba(94, 23, 235, 0.3)',
                        },
                        '&:disabled': {
                          opacity: 0.7
                        }
                      }}
                    >
                      {isSavingLottery ? '保存中...' : '保存'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        </Container>

        {/* LINEミニアプリURL設定セクション */}
        <Container maxWidth="xl" sx={{ mb: 6 }}>
          {/* セクションヘッダー */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1a202c',
                mb: 0.5,
                fontSize: '1.75rem'
              }}
            >
              LINEミニアプリURL設定
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem'
              }}
            >
              LINEミニアプリのベースURLを設定し、店舗別のURLを生成
            </Typography>
          </Box>

          {/* LINEミニアプリURL設定カード */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 0.5,
              border: '1px solid rgba(0, 0, 0, 0.06)',
              overflow: 'hidden'
            }}
          >
            {/* メイン表示部分 */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                {/* カラーインジケーター */}
                <Box
                  sx={{
                    width: 4,
                    height: 40,
                    borderRadius: 0.5,
                    bgcolor: '#00b900'
                  }}
                />

                {/* URL表示 */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                      LINEミニアプリベースURL
                    </Typography>
                    <Tooltip 
                      title="例: https://miniapp.line.me/xxxxxxxxxxxx-xxxxxxxxxx"
                      arrow
                      placement="top"
                    >
                      <HelpOutline sx={{ fontSize: 16, color: '#94a3b8', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  {savedLineMiniAppUrl ? (
                    <Typography sx={{ 
                      fontSize: '0.9rem', 
                      color: '#374151',
                      fontFamily: 'monospace',
                      bgcolor: '#f8fafc',
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 0.5,
                      border: '1px solid #e5e7eb'
                    }}>
                      {savedLineMiniAppUrl}
                    </Typography>
                  ) : (
                    <Typography sx={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                      未設定
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* 設定ボタン */}
              <IconButton
                onClick={() => setShowLineMiniAppSettings(!showLineMiniAppSettings)}
                sx={{
                  color: showLineMiniAppSettings ? '#5e17eb' : '#94a3b8',
                  bgcolor: showLineMiniAppSettings ? 'rgba(94, 23, 235, 0.08)' : 'transparent',
                  '&:hover': {
                    color: '#5e17eb',
                    bgcolor: 'rgba(94, 23, 235, 0.08)'
                  }
                }}
              >
                {showLineMiniAppSettings ? <Close /> : <Settings />}
              </IconButton>
            </Box>

            {/* 設定パネル（開閉式） */}
            {showLineMiniAppSettings && (
              <Box sx={{ borderTop: '1px solid #e5e7eb' }}>
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* URL入力フィールド */}
                    <Box>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', mb: 1 }}>
                        LINEミニアプリのベースURL
                      </Typography>
                      <TextField
                        fullWidth
                        value={lineMiniAppUrl}
                        onChange={(e) => setLineMiniAppUrl(e.target.value)}
                        placeholder="https://miniapp.line.me/xxxxxxxxxxxx-xxxxxxxxxx"
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.9rem',
                            fontFamily: 'monospace',
                            bgcolor: '#f8fafc',
                            '& fieldset': {
                              borderColor: '#e5e7eb',
                            },
                            '&:hover fieldset': {
                              borderColor: '#5e17eb',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#5e17eb',
                            }
                          }
                        }}
                      />
                    </Box>

                    {/* 保存ボタン */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={saveLineMiniAppUrl}
                        disabled={isSavingLineMiniApp || !lineMiniAppUrl}
                        sx={{
                          background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                          borderRadius: 0.5,
                          px: 2.5,
                          py: 0.75,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          boxShadow: 'none',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #4c0dbf 0%, #5a6fd8 100%)',
                            boxShadow: '0 2px 8px rgba(94, 23, 235, 0.3)',
                          },
                          '&:disabled': {
                            opacity: 0.7
                          }
                        }}
                      >
                        {isSavingLineMiniApp ? '保存中...' : '保存'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        </Container>

        {/* 店舗別フォームURLセクション */}
        <Container maxWidth="xl" sx={{ mb: 6 }}>
          {/* セクションヘッダー */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1a202c',
                mb: 0.5,
                fontSize: '1.75rem'
              }}
            >
              店舗別フォームURL
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem'
              }}
            >
              各店舗のレビューフォームURLとQRコードを管理
            </Typography>
          </Box>

          {/* 店舗一覧テーブル */}
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 0.5,
              border: '1px solid rgba(0, 0, 0, 0.06)',
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: '#f8fafc',
                    '& .MuiTableCell-head': {
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      py: 1.5
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Store sx={{ fontSize: 16, color: '#64748b' }} />
                      店舗名
                    </Box>
                  </TableCell>
                  <TableCell>住所</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell align="center" sx={{ width: 240 }}>アクション</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stores.map((store) => (
                  <TableRow
                    key={store.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(94, 23, 235, 0.02)'
                      },
                      '&:last-child td': {
                        border: 0
                      },
                      borderBottom: '1px solid rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    {/* 店舗名 */}
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          color: '#1a202c'
                        }}
                      >
                        {store.name}
                      </Typography>
                    </TableCell>

                    {/* 住所 */}
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontSize: '0.8rem',
                          color: '#64748b'
                        }}
                      >
                        {store.address}
                      </Typography>
                    </TableCell>

                    {/* URL（縦配置） */}
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* フォームURL */}
                        <Box>
                          <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500, mb: 0.25 }}>
                            フォームURL
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              color: '#64748b',
                              fontFamily: 'monospace',
                              bgcolor: '#f8fafc',
                              px: 1,
                              py: 0.5,
                              borderRadius: 0.5,
                              display: 'inline-block',
                              border: '1px solid #e5e7eb',
                              maxWidth: '400px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {getStoreFormUrl(store)}
                          </Typography>
                        </Box>
                        
                        {/* LINEミニアプリURL */}
                        <Box>
                          <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500, mb: 0.25 }}>
                            LINEミニアプリ本番用LIFF URL
                          </Typography>
                          {savedLineMiniAppUrl ? (
                            <Typography
                              sx={{
                                fontSize: '0.75rem',
                                color: '#64748b',
                                fontFamily: 'monospace',
                                bgcolor: '#e6f7e6',
                                px: 1,
                                py: 0.5,
                                borderRadius: 0.5,
                                display: 'inline-block',
                                border: '1px solid #b8e0b8',
                                maxWidth: '400px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {getLineMiniAppUrl(store)}
                            </Typography>
                          ) : (
                            <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              未設定
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* アクションボタン */}
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContentCopy sx={{ fontSize: 14 }} />}
                          onClick={() => handleCopyUrl(store, false)}
                          sx={{
                            color: '#64748b',
                            borderColor: '#e5e7eb',
                            borderRadius: 0.5,
                            textTransform: 'none',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            px: 1,
                            py: 0.5,
                            minWidth: 'auto',
                            '&:hover': {
                              color: '#5e17eb',
                              borderColor: '#5e17eb',
                              bgcolor: 'rgba(94, 23, 235, 0.04)'
                            }
                          }}
                        >
                          フォーム
                        </Button>
                        {savedLineMiniAppUrl && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ContentCopy sx={{ fontSize: 14 }} />}
                            onClick={() => handleCopyUrl(store, true)}
                            sx={{
                              color: '#00b900',
                              borderColor: '#b8e0b8',
                              borderRadius: 0.5,
                              textTransform: 'none',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              px: 1,
                              py: 0.5,
                              minWidth: 'auto',
                              '&:hover': {
                                color: '#00a000',
                                borderColor: '#00a000',
                                bgcolor: 'rgba(0, 185, 0, 0.04)'
                              }
                            }}
                          >
                            LINE
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<QrCode2 sx={{ fontSize: 14 }} />}
                          onClick={() => handleDownloadQR(store)}
                          sx={{
                            color: '#64748b',
                            borderColor: '#e5e7eb',
                            borderRadius: 0.5,
                            textTransform: 'none',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            px: 1,
                            py: 0.5,
                            minWidth: 'auto',
                            '&:hover': {
                              color: '#10b981',
                              borderColor: '#10b981',
                              bgcolor: 'rgba(16, 185, 129, 0.04)'
                            }
                          }}
                        >
                          QR
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 一括ダウンロードボタン */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={async () => {
                for (const store of stores) {
                  await handleDownloadQR(store);
                  // 少し待機して連続ダウンロードを安定させる
                  await new Promise(resolve => setTimeout(resolve, 300));
                }
              }}
              sx={{
                borderColor: '#e5e7eb',
                color: '#374151',
                borderRadius: 0.5,
                px: 2,
                py: 0.75,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                '&:hover': {
                  borderColor: '#5e17eb',
                  color: '#5e17eb',
                  bgcolor: 'rgba(94, 23, 235, 0.04)'
                }
              }}
            >
              全店舗のQRコードを一括ダウンロード
            </Button>
          </Box>
        </Container>

          </>
        )}

      </Box>
    </motion.div>
  );
}
