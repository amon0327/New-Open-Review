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
  CircularProgress
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
  Warning
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';
import { supabase } from '../../../lib/supabase';

export default function FormPublishPage({ user, companyId: propCompanyId, companyName: propCompanyName }) {
  // ローディング・エラー状態
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 今月のロック状態（回答があった場合、設定変更は来月から適用）
  const [currentMonthLock, setCurrentMonthLock] = useState(null);
  const [isCurrentMonthLocked, setIsCurrentMonthLocked] = useState(false);

  // アンケートサイクル設定
  const [surveyCycleConfig, setSurveyCycleConfig] = useState({
    groupA: 'Quality',      // 1月, 4月, 7月, 10月
    groupB: 'Service',      // 2月, 5月, 8月, 11月
    groupC: 'Cleanliness'   // 3月, 6月, 9月, 12月
  });
  const [showCycleSettings, setShowCycleSettings] = useState(false);
  const [cycleConfirmDialogOpen, setCycleConfirmDialogOpen] = useState(false);

  // 各QSCテーマに紐づくレビューフォーム選択
  const [selectedForms, setSelectedForms] = useState({
    Quality: '',
    Service: '',
    Cleanliness: ''
  });
  const [showFormSettings, setShowFormSettings] = useState(false);

  // レビューフォームデータ（Supabaseから取得）
  const [reviewForms, setReviewForms] = useState([]);

  // 抽選設定
  const [showLotterySettings, setShowLotterySettings] = useState(false);
  const [lotterySettings, setLotterySettings] = useState({
    maxWinsPerMonth: 1,
    winRateDivisor: 1000
  });

  // 今月の抽選統計（ダミーデータ）
  const [lotteryStats, setLotteryStats] = useState({
    totalAttempts: 245,
    totalWins: 0
  });

  // 店舗データ（Supabaseから取得）
  const [stores, setStores] = useState([]);

  const surveyTypes = [
    { id: 'Quality', label: 'Q', fullLabel: 'クオリティ', color: '#6366f1', bgColor: '#eef2ff' },
    { id: 'Service', label: 'S', fullLabel: 'サービス', color: '#10b981', bgColor: '#ecfdf5' },
    { id: 'Cleanliness', label: 'C', fullLabel: 'クリンリネス', color: '#f59e0b', bgColor: '#fffbeb' }
  ];

  const cycleGroups = [
    { key: 'groupA', months: [1, 4, 7, 10], label: '1・4・7・10月' },
    { key: 'groupB', months: [2, 5, 8, 11], label: '2・5・8・11月' },
    { key: 'groupC', months: [3, 6, 9, 12], label: '3・6・9・12月' }
  ];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // ============================================================================
  // Supabaseからデータ取得
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
        const fetchedCompanyId = propCompanyId;

        // 1. 会社のレビューフォーム一覧を取得
        const { data: forms, error: formsError } = await supabase
          .from('company_review_forms')
          .select(`
            review_form_id,
            review_forms:review_form_id (
              id,
              title,
              is_deleted
            )
          `)
          .eq('company_id', fetchedCompanyId);

        if (!formsError && forms) {
          const activeFormsData = forms
            .filter(f => f.review_forms && !f.review_forms.is_deleted)
            .map(f => ({
              id: f.review_forms.id,
              name: f.review_forms.title,
              description: ''
            }));
          setReviewForms(activeFormsData);
        }

        // 3. 会社の店舗一覧を取得
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('id, name, address, is_active')
          .eq('company_id', fetchedCompanyId);

        console.log('店舗データ取得:', { storesData, storesError, fetchedCompanyId });

        if (!storesError && storesData) {
          // is_activeがnullまたはtrueの店舗のみフィルタ（is_activeが設定されていない店舗も表示）
          const activeStores = storesData.filter(s => s.is_active !== false);
          setStores(activeStores.map(s => ({
            ...s,
            companyName: propCompanyName || ''
          })));
        }

        // 4. QSCフォーム設定を取得（テーブルが存在しない場合はスキップ）
        try {
          const { data: formSettings, error: formSettingsError } = await supabase
            .from('company_qsc_form_settings')
            .select('*')
            .eq('company_id', fetchedCompanyId)
            .single();

          if (!formSettingsError && formSettings) {
            setSelectedForms({
              Quality: formSettings.quality_form_id || '',
              Service: formSettings.service_form_id || '',
              Cleanliness: formSettings.cleanliness_form_id || ''
            });
          }
        } catch (e) {
          console.log('QSCフォーム設定テーブルが未作成:', e);
        }

        // 5. QSCローテーション設定を取得（テーブルが存在しない場合はスキップ）
        try {
          const { data: rotationSettings, error: rotationError } = await supabase
            .from('company_qsc_rotation_settings')
            .select('*')
            .eq('company_id', fetchedCompanyId)
            .single();

          if (!rotationError && rotationSettings) {
            setSurveyCycleConfig({
              groupA: rotationSettings.group_a_type,
              groupB: rotationSettings.group_b_type,
              groupC: rotationSettings.group_c_type
            });
          }
        } catch (e) {
          console.log('QSCローテーション設定テーブルが未作成:', e);
        }

        // 6. 今月のロック状態を確認（テーブルが存在しない場合はスキップ）
        try {
          const { data: monthLock, error: lockError } = await supabase
            .from('company_qsc_monthly_locks')
            .select('*')
            .eq('company_id', fetchedCompanyId)
            .eq('target_year', currentYear)
            .eq('target_month', currentMonth)
            .single();

          if (!lockError && monthLock) {
            setCurrentMonthLock(monthLock);
            setIsCurrentMonthLocked(true);
          }
        } catch (e) {
          console.log('QSC月次ロックテーブルが未作成:', e);
        }

      } catch (error) {
        console.error('データ取得エラー:', error);
        toast.error('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [propCompanyId, propCompanyName, currentYear, currentMonth]);

  // ============================================================================
  // QSCフォーム設定を保存
  // ============================================================================
  const saveQscFormSettings = useCallback(async () => {
    if (!propCompanyId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('company_qsc_form_settings')
        .upsert({
          company_id: propCompanyId,
          quality_form_id: selectedForms.Quality || null,
          service_form_id: selectedForms.Service || null,
          cleanliness_form_id: selectedForms.Cleanliness || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });

      if (error) throw error;

      if (isCurrentMonthLocked) {
        toast.success('設定を保存しました（来月から適用されます）');
      } else {
        toast.success('設定を保存しました');
      }
    } catch (error) {
      console.error('QSCフォーム設定保存エラー:', error);
      toast.error('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [propCompanyId, selectedForms, isCurrentMonthLocked]);

  // ============================================================================
  // QSCローテーション設定を保存
  // ============================================================================
  const saveQscRotationSettings = useCallback(async () => {
    if (!propCompanyId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('company_qsc_rotation_settings')
        .upsert({
          company_id: propCompanyId,
          group_a_type: surveyCycleConfig.groupA,
          group_b_type: surveyCycleConfig.groupB,
          group_c_type: surveyCycleConfig.groupC,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });

      if (error) throw error;

      if (isCurrentMonthLocked) {
        toast.success('設定を保存しました（来月から適用されます）');
      } else {
        toast.success('設定を保存しました');
      }
    } catch (error) {
      console.error('QSCローテーション設定保存エラー:', error);
      toast.error('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  }, [propCompanyId, surveyCycleConfig, isCurrentMonthLocked]);

  // 現在の月からアンケートタイプを取得（ロック状態を考慮）
  const getCurrentSurveyType = () => {
    // 今月ロックされている場合はロック時の設定を使用
    if (isCurrentMonthLocked && currentMonthLock) {
      return surveyTypes.find(t => t.id === currentMonthLock.locked_qsc_type);
    }

    const group = cycleGroups.find(g => g.months.includes(currentMonth));
    if (group) {
      const typeId = surveyCycleConfig[group.key];
      return surveyTypes.find(t => t.id === typeId);
    }
    return null;
  };

  const currentSurveyType = getCurrentSurveyType();

  // ベースURL（店舗IDベース）
  const baseUrl = 'https://review.example.com/store';

  // 店舗のレビューフォームURLを生成（店舗IDベース）
  const getStoreFormUrl = (store) => {
    return `${baseUrl}/${store.id}`;
  };

  // URLをクリップボードにコピー
  const handleCopyUrl = (store) => {
    const url = getStoreFormUrl(store);
    navigator.clipboard.writeText(url).then(() => {
      toast.success(`${store.name}のURLをコピーしました`);
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

  // サイクル設定変更ハンドラー（重複を許さない）
  const handleCycleChange = (groupKey, newType) => {
    const otherGroupWithSameType = Object.entries(surveyCycleConfig).find(
      ([key, type]) => key !== groupKey && type === newType
    );

    if (otherGroupWithSameType) {
      const [otherGroupKey] = otherGroupWithSameType;
      const currentType = surveyCycleConfig[groupKey];
      setSurveyCycleConfig(prev => ({
        ...prev,
        [groupKey]: newType,
        [otherGroupKey]: currentType
      }));
    } else {
      setSurveyCycleConfig(prev => ({
        ...prev,
        [groupKey]: newType
      }));
    }
  };

  // フォーム選択変更ハンドラー
  const handleFormSelect = (themeId, formId) => {
    setSelectedForms(prev => ({
      ...prev,
      [themeId]: formId
    }));
  };

  // 選択されたフォーム情報を取得
  const getSelectedFormInfo = (themeId) => {
    const formId = selectedForms[themeId];
    if (!formId) return null;
    return reviewForms.find(f => f.id === formId);
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
        {/* ローディング表示 */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress sx={{ color: '#5e17eb' }} />
          </Box>
        )}

        {/* メインコンテンツ（ローディング完了後に表示） */}
        {!isLoading && (
          <>
        {/* 今月の評価項目セクション */}
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
              今月の評価項目
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem'
              }}
            >
              3ヶ月サイクルで クオリティ・サービス・クリンリネス を順番に評価
            </Typography>
          </Box>

          {/* 評価項目カード */}
          {currentSurveyType && (
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
                      bgcolor: currentSurveyType.color
                    }}
                  />

                  {/* 年月と評価項目 */}
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                      {currentYear}年{currentMonth}月
                    </Typography>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: currentSurveyType.color }}>
                      {currentSurveyType.fullLabel}
                    </Typography>
                  </Box>
                </Box>

                {/* 設定ボタン */}
                <IconButton
                  onClick={() => setShowCycleSettings(!showCycleSettings)}
                  sx={{
                    color: showCycleSettings ? '#5e17eb' : '#94a3b8',
                    bgcolor: showCycleSettings ? 'rgba(94, 23, 235, 0.08)' : 'transparent',
                    '&:hover': {
                      color: '#5e17eb',
                      bgcolor: 'rgba(94, 23, 235, 0.08)'
                    }
                  }}
                >
                  {showCycleSettings ? <Close /> : <Settings />}
                </IconButton>
              </Box>

              {/* 設定パネル（開閉式） */}
              {showCycleSettings && (
                <Box sx={{ borderTop: '1px solid #e5e7eb' }}>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {cycleGroups.map((group) => {
                        const selectedType = surveyTypes.find(t => t.id === surveyCycleConfig[group.key]);
                        return (
                          <Box
                            key={group.key}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              p: 1.5,
                              borderRadius: 0.5,
                              bgcolor: '#fafafa'
                            }}
                          >
                            {/* 月表示 */}
                            <Box sx={{ display: 'flex', gap: 0.5, minWidth: 140 }}>
                              {group.months.map((month) => (
                                <Box
                                  key={month}
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 0.5,
                                    bgcolor: month === currentMonth ? '#1a202c' : '#fff',
                                    border: month === currentMonth ? 'none' : '1px solid #e5e7eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      color: month === currentMonth ? '#fff' : '#374151'
                                    }}
                                  >
                                    {month}月
                                  </Typography>
                                </Box>
                              ))}
                            </Box>

                            {/* 矢印 */}
                            <Typography sx={{ color: '#d1d5db', fontSize: '1rem' }}>→</Typography>

                            {/* アンケート種類選択 */}
                            <Box sx={{ display: 'flex', gap: 0.75 }}>
                              {surveyTypes.map((type) => {
                                const isSelected = surveyCycleConfig[group.key] === type.id;
                                return (
                                  <Box
                                    key={type.id}
                                    onClick={() => handleCycleChange(group.key, type.id)}
                                    sx={{
                                      px: 1.5,
                                      py: 0.75,
                                      borderRadius: 0.5,
                                      cursor: 'pointer',
                                      bgcolor: isSelected ? type.color : '#fff',
                                      border: `1.5px solid ${isSelected ? type.color : '#e5e7eb'}`,
                                      transition: 'all 0.15s',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.75,
                                      '&:hover': {
                                        borderColor: type.color,
                                        bgcolor: isSelected ? type.color : type.bgColor
                                      }
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        bgcolor: isSelected ? '#fff' : type.color
                                      }}
                                    />
                                    <Typography
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: isSelected ? '#fff' : type.color
                                      }}
                                    >
                                      {type.fullLabel}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>

                    {/* ロック状態の警告 */}
                    {isCurrentMonthLocked && (
                      <Alert
                        severity="warning"
                        icon={<Warning sx={{ fontSize: 18 }} />}
                        sx={{
                          mt: 2,
                          borderRadius: 1,
                          bgcolor: '#fffbeb',
                          border: '1px solid #fbbf24',
                          '& .MuiAlert-message': {
                            fontSize: '0.8rem',
                            color: '#92400e'
                          }
                        }}
                      >
                        今月は既に回答があるため、設定変更は来月から適用されます
                      </Alert>
                    )}

                    {/* 説明文と確定ボタン */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        ※ 各項目は重複不可。選択すると自動で入れ替わります。
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={isSaving}
                        onClick={() => {
                          if (isCurrentMonthLocked) {
                            setCycleConfirmDialogOpen(true);
                          } else {
                            saveQscRotationSettings();
                            setShowCycleSettings(false);
                          }
                        }}
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
          )}
        </Container>

        {/* 公開フォーム選択セクション */}
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
              公開フォーム設定
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem'
              }}
            >
              各QSCテーマで公開するレビューフォームを選択
            </Typography>
          </Box>

          {/* QSCフォーム選択カード */}
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

                {/* フォーム設定情報 */}
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                    レビューフォーム
                  </Typography>
                  <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#8b5cf6' }}>
                    QSC別フォーム設定
                  </Typography>
                </Box>

                {/* 選択状況 */}
                <Box sx={{ ml: 4, display: 'flex', gap: 1 }}>
                  {surveyTypes.map((type) => {
                    const selectedForm = getSelectedFormInfo(type.id);
                    return (
                      <Chip
                        key={type.id}
                        label={`${type.label}: ${selectedForm ? selectedForm.name : '未設定'}`}
                        size="small"
                        sx={{
                          bgcolor: selectedForm ? type.bgColor : '#f1f5f9',
                          color: selectedForm ? type.color : '#94a3b8',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          border: `1px solid ${selectedForm ? type.color : '#e5e7eb'}`,
                          '& .MuiChip-label': {
                            px: 1
                          },
                          maxWidth: 200,
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>

              {/* 設定ボタン */}
              <IconButton
                onClick={() => setShowFormSettings(!showFormSettings)}
                sx={{
                  color: showFormSettings ? '#5e17eb' : '#94a3b8',
                  bgcolor: showFormSettings ? 'rgba(94, 23, 235, 0.08)' : 'transparent',
                  '&:hover': {
                    color: '#5e17eb',
                    bgcolor: 'rgba(94, 23, 235, 0.08)'
                  }
                }}
              >
                {showFormSettings ? <Close /> : <Settings />}
              </IconButton>
            </Box>

            {/* フォーム選択パネル（開閉式） */}
            {showFormSettings && (
              <Box sx={{ borderTop: '1px solid #e5e7eb' }}>
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {surveyTypes.map((type) => (
                      <Box
                        key={type.id}
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          bgcolor: '#fafafa',
                          border: `1px solid ${selectedForms[type.id] ? type.color : '#e5e7eb'}`,
                          transition: 'all 0.2s'
                        }}
                      >
                        {/* テーマヘッダー */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              bgcolor: type.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                              {type.label}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a202c' }}>
                              {type.fullLabel}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                              このテーマで公開するフォームを選択
                            </Typography>
                          </Box>
                        </Box>

                        {/* フォーム選択ドロップダウン */}
                        <FormControl fullWidth size="small">
                          <Select
                            value={selectedForms[type.id]}
                            onChange={(e) => handleFormSelect(type.id, e.target.value)}
                            displayEmpty
                            IconComponent={KeyboardArrowDown}
                            sx={{
                              bgcolor: '#fff',
                              borderRadius: 0.5,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#e5e7eb'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: type.color
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: type.color
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
                                  <Description sx={{ fontSize: 16, color: type.color }} />
                                  <Box>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                      {form.name}
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                      </Box>
                    ))}
                  </Box>

                  {/* ロック状態の警告 */}
                  {isCurrentMonthLocked && (
                    <Alert
                      severity="warning"
                      icon={<Warning sx={{ fontSize: 18 }} />}
                      sx={{
                        mt: 2,
                        borderRadius: 1,
                        bgcolor: '#fffbeb',
                        border: '1px solid #fbbf24',
                        '& .MuiAlert-message': {
                          fontSize: '0.8rem',
                          color: '#92400e'
                        }
                      }}
                    >
                      今月は既に回答があるため、設定変更は来月から適用されます
                    </Alert>
                  )}

                  {/* 保存ボタン */}
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={isSaving}
                      onClick={async () => {
                        await saveQscFormSettings();
                        setShowFormSettings(false);
                      }}
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
                      onClick={() => {
                        toast.success('抽選設定を保存しました');
                        setShowLotterySettings(false);
                      }}
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
                        }
                      }}
                    >
                      保存
                    </Button>
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
                  <TableCell>フォームURL</TableCell>
                  <TableCell align="center" sx={{ width: 180 }}>アクション</TableCell>
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

                    {/* URL */}
                    <TableCell sx={{ py: 2 }}>
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
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        {getStoreFormUrl(store)}
                      </Typography>
                    </TableCell>

                    {/* アクションボタン */}
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContentCopy sx={{ fontSize: 14 }} />}
                          onClick={() => handleCopyUrl(store)}
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
                          コピー
                        </Button>
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

        {/* サイクル設定確認ダイアログ */}
        <Dialog
          open={cycleConfirmDialogOpen}
          onClose={() => setCycleConfirmDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
              maxWidth: 440
            }
          }}
        >
          <DialogTitle sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#1a202c',
            pb: 1
          }}>
            設定変更の確認
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{
              color: '#4b5563',
              fontSize: '0.9rem',
              lineHeight: 1.7
            }}>
              今月（{currentYear}年{currentMonth}月）は既に「<strong style={{ color: currentSurveyType?.color }}>{currentSurveyType?.fullLabel}</strong>」の項目で回答が収集されています。
              <br /><br />
              この設定は<strong>来月から</strong>適用されます。よろしいですか？
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button
              onClick={() => setCycleConfirmDialogOpen(false)}
              sx={{
                color: '#6b7280',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(107, 114, 128, 0.08)'
                }
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={async () => {
                await saveQscRotationSettings();
                setCycleConfirmDialogOpen(false);
                setShowCycleSettings(false);
              }}
              disabled={isSaving}
              sx={{
                background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1,
                borderRadius: 1,
                '&:hover': {
                  background: 'linear-gradient(135deg, #4c0dbf 0%, #5a6fd8 100%)',
                },
                '&:disabled': {
                  opacity: 0.7
                }
              }}
            >
              {isSaving ? '保存中...' : '保存する'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}
