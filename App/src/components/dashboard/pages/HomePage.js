import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Chip,
  Container,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Select,
  FormControl
} from '@mui/material';
import {
  Add,
  Description,
  Edit,
  MoreVert,
  Delete,
  Share,
  Analytics,
  ContentCopy,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Settings,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import FormDataService from '../../../services/FormDataService';
import { toast } from 'react-hot-toast';

export default function HomePage({ user, onCreateFormClick, onCreateForm, isCreatingForm }) {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  
  // ソート関連の状態
  const [sortField, setSortField] = useState('updated_at'); // デフォルトは更新日
  const [sortDirection, setSortDirection] = useState('desc'); // デフォルトは降順（最新順）

  // フォーム選択関連の状態
  const [selectedForms, setSelectedForms] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // アンケートサイクル設定の状態
  const [surveyCycleConfig, setSurveyCycleConfig] = useState({
    jan: 'Quality',
    apr: 'Service',
    jul: 'Cleanliness',
    oct: 'Quality'
  });
  const [showCycleSettings, setShowCycleSettings] = useState(false);
  const timelineRef = useRef(null);

  // サーベイタイプの定義
  const surveyTypes = [
    { id: 'Quality', label: 'Quality', color: '#5e17eb', bgColor: 'rgba(94, 23, 235, 0.1)' },
    { id: 'Service', label: 'Service', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.1)' },
    { id: 'Cleanliness', label: 'Cleanliness', color: '#0ea5e9', bgColor: 'rgba(14, 165, 233, 0.1)' }
  ];

  // 過去のサーベイデータ（実際はDBから取得）
  const [surveyHistory] = useState([
    { year: 2024, month: 1, type: 'Quality', completed: true },
    { year: 2024, month: 2, type: 'Quality', completed: true },
    { year: 2024, month: 3, type: 'Quality', completed: true },
    { year: 2024, month: 4, type: 'Service', completed: true },
    { year: 2024, month: 5, type: 'Service', completed: true },
    { year: 2024, month: 6, type: 'Service', completed: true },
    { year: 2024, month: 7, type: 'Cleanliness', completed: true },
    { year: 2024, month: 8, type: 'Cleanliness', completed: true },
    { year: 2024, month: 9, type: 'Cleanliness', completed: true },
    { year: 2024, month: 10, type: 'Quality', completed: true },
    { year: 2024, month: 11, type: 'Quality', completed: true },
    { year: 2024, month: 12, type: 'Quality', completed: true },
    { year: 2025, month: 1, type: 'Service', completed: true },
    { year: 2025, month: 2, type: 'Service', completed: true },
    { year: 2025, month: 3, type: 'Service', completed: true },
    { year: 2025, month: 4, type: 'Cleanliness', completed: true },
    { year: 2025, month: 5, type: 'Cleanliness', completed: true },
    { year: 2025, month: 6, type: 'Cleanliness', completed: true },
    { year: 2025, month: 7, type: 'Quality', completed: true },
    { year: 2025, month: 8, type: 'Quality', completed: true },
    { year: 2025, month: 9, type: 'Quality', completed: true },
    { year: 2025, month: 10, type: 'Service', completed: true },
    { year: 2025, month: 11, type: 'Service', completed: true },
  ]);

  // タイムラインデータを生成（過去2年〜未来1年）
  const timelineData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const data = [];

    // 過去2年から未来1年までのデータを生成
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      for (let month = 1; month <= 12; month++) {
        const isPast = year < currentYear || (year === currentYear && month < currentMonth);
        const isCurrent = year === currentYear && month === currentMonth;
        const isFuture = year > currentYear || (year === currentYear && month > currentMonth);

        // 過去のデータは履歴から取得
        const historyItem = surveyHistory.find(h => h.year === year && h.month === month);

        // 未来のデータはサイクル設定から予測
        let predictedType = null;
        if (isFuture || isCurrent) {
          if (month >= 1 && month <= 3) predictedType = surveyCycleConfig.jan;
          else if (month >= 4 && month <= 6) predictedType = surveyCycleConfig.apr;
          else if (month >= 7 && month <= 9) predictedType = surveyCycleConfig.jul;
          else predictedType = surveyCycleConfig.oct;
        }

        data.push({
          year,
          month,
          type: historyItem?.type || predictedType,
          completed: historyItem?.completed || false,
          isPast,
          isCurrent,
          isFuture
        });
      }
    }

    return data;
  }, [surveyHistory, surveyCycleConfig]);

  // タイムラインスクロール関数
  const scrollTimeline = (direction) => {
    if (timelineRef.current) {
      const scrollAmount = 300;
      timelineRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 現在の月にスクロール
  useEffect(() => {
    if (timelineRef.current) {
      const now = new Date();
      const currentIndex = timelineData.findIndex(
        d => d.year === now.getFullYear() && d.month === now.getMonth() + 1
      );
      if (currentIndex !== -1) {
        const itemWidth = 56; // 各月のアイテム幅
        const containerWidth = timelineRef.current.clientWidth;
        const scrollPosition = currentIndex * itemWidth - containerWidth / 2 + itemWidth / 2;
        timelineRef.current.scrollLeft = scrollPosition;
      }
    }
  }, [timelineData]);

  // フォーム一覧を取得
  useEffect(() => {
    const fetchForms = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const result = await FormDataService.getUserForms(user.id);
        if (result.success) {
          setForms(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('フォームの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [user?.id]);

  // メニューハンドラー
  const handleMenuClick = (event, form) => {
    setAnchorEl(event.currentTarget);
    setSelectedForm(form);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedForm(null);
  };


  // ソートハンドラー
  const handleSort = (field) => {
    if (sortField === field) {
      // 同じフィールドをクリックした場合は方向を切り替え
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 違うフィールドをクリックした場合は新しいフィールドを設定し、降順から開始
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // チェックボックス関連のハンドラー
  const handleSelectForm = (formId) => {
    const newSelected = new Set(selectedForms);
    if (newSelected.has(formId)) {
      newSelected.delete(formId);
    } else {
      newSelected.add(formId);
    }
    setSelectedForms(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedForms.size === sortedForms.length) {
      setSelectedForms(new Set());
    } else {
      setSelectedForms(new Set(sortedForms.map(form => form.id)));
    }
  };

  // 削除関連のハンドラー
  const handleBulkDelete = () => {
    if (selectedForms.size === 0) return;
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedForms).map(formId => 
        FormDataService.deleteForm(formId)
      );
      
      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(result => !result.success);
      
      if (failedDeletes.length === 0) {
        toast.success(`${selectedForms.size}件のフォームを削除しました`);
        // フォーム一覧を再取得
        const result = await FormDataService.getUserForms(user.id);
        if (result.success) {
          setForms(result.data);
        }
        setSelectedForms(new Set());
      } else {
        toast.error(`${failedDeletes.length}件のフォーム削除に失敗しました`);
        console.error('Failed deletes:', failedDeletes);
      }
    } catch (error) {
      toast.error('削除処理中にエラーが発生しました');
      console.error('Bulk delete error:', error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // フォームデータの変換
  const formatFormData = (form) => ({
    id: form.id,
    title: form.title || '名称未設定',
    description: 'レビューフォーム',
    status: form.is_published ? '公開中' : '下書き',
    responses: 0, // TODO: 実際の回答数を取得
    questionCount: form.review_questions ? form.review_questions.length : 0, // 質問数を追加
    lastModified: new Date(form.updated_at).toISOString().split('T')[0],
    category: 'レビュー',
    themeColor: form.review_form_settings?.[0]?.theme_color || '#5e17eb',
    createdAt: new Date(form.created_at).toLocaleDateString('ja-JP'),
    // ソート用の生データも保持
    created_at: form.created_at,
    updated_at: form.updated_at
  });

  // ソートされたフォームデータを生成
  const sortedForms = useMemo(() => {
    if (!forms.length) return [];
    
    const formattedFormsWithOriginal = forms.map(form => ({
      ...formatFormData(form),
      originalForm: form // 元のformオブジェクトも保持
    }));
    
    return [...formattedFormsWithOriginal].sort((a, b) => {
      let valueA, valueB;
      
      switch (sortField) {
        case 'responses':
          valueA = a.responses;
          valueB = b.responses;
          break;
        case 'created_at':
          valueA = new Date(a.created_at);
          valueB = new Date(b.created_at);
          break;
        case 'updated_at':
          valueA = new Date(a.updated_at);
          valueB = new Date(b.updated_at);
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }, [forms, sortField, sortDirection]);

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

        {/* アンケートサイクルセクション */}
        <Container maxWidth="xl" sx={{ mt: 2, mb: 3 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              bgcolor: '#fafafa'
            }}
          >
            {/* ヘッダー */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
                borderBottom: '1px solid #e5e7eb',
                bgcolor: '#fff'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a202c', fontSize: '0.9rem' }}>
                  Survey Cycle
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {surveyTypes.map(type => (
                    <Chip
                      key={type.id}
                      label={type.label}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        bgcolor: type.bgColor,
                        color: type.color,
                        border: `1px solid ${type.color}20`
                      }}
                    />
                  ))}
                </Box>
              </Box>
              <IconButton
                size="small"
                onClick={() => setShowCycleSettings(!showCycleSettings)}
                sx={{
                  color: showCycleSettings ? '#5e17eb' : '#64748b',
                  bgcolor: showCycleSettings ? 'rgba(94, 23, 235, 0.1)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(94, 23, 235, 0.1)' }
                }}
              >
                <Settings sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {/* サイクル設定パネル */}
            {showCycleSettings && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  px: 2,
                  py: 1.5,
                  bgcolor: '#fff',
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                {[
                  { key: 'jan', label: '1-3月', months: '1月〜' },
                  { key: 'apr', label: '4-6月', months: '4月〜' },
                  { key: 'jul', label: '7-9月', months: '7月〜' },
                  { key: 'oct', label: '10-12月', months: '10月〜' }
                ].map(period => (
                  <Box key={period.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', minWidth: 32 }}>
                      {period.months}
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={surveyCycleConfig[period.key]}
                        onChange={(e) => setSurveyCycleConfig(prev => ({ ...prev, [period.key]: e.target.value }))}
                        sx={{
                          fontSize: '0.75rem',
                          height: 28,
                          '& .MuiSelect-select': { py: 0.5, px: 1 },
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5e17eb' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#5e17eb' }
                        }}
                      >
                        {surveyTypes.map(type => (
                          <MenuItem key={type.id} value={type.id} sx={{ fontSize: '0.75rem' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: type.color }} />
                              {type.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                ))}
              </Box>
            )}

            {/* タイムライン */}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 1, py: 1 }}>
              <IconButton
                size="small"
                onClick={() => scrollTimeline('left')}
                sx={{ color: '#64748b', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
              >
                <ChevronLeft sx={{ fontSize: 20 }} />
              </IconButton>

              <Box
                ref={timelineRef}
                sx={{
                  display: 'flex',
                  overflowX: 'auto',
                  flex: 1,
                  gap: 0,
                  scrollBehavior: 'smooth',
                  '&::-webkit-scrollbar': { display: 'none' },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none'
                }}
              >
                {timelineData.map((item, index) => {
                  const typeInfo = surveyTypes.find(t => t.id === item.type);
                  const showYear = index === 0 || item.month === 1;

                  return (
                    <Box
                      key={`${item.year}-${item.month}`}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: 52,
                        py: 0.5,
                        position: 'relative',
                        opacity: item.isFuture ? 0.5 : 1,
                        transition: 'opacity 0.2s'
                      }}
                    >
                      {/* 年表示 */}
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.6rem',
                          color: '#94a3b8',
                          fontWeight: 500,
                          height: 14,
                          visibility: showYear ? 'visible' : 'hidden'
                        }}
                      >
                        {item.year}
                      </Typography>

                      {/* 月セル */}
                      <Tooltip
                        title={`${item.year}年${item.month}月: ${item.type || '未設定'}${item.isFuture ? ' (予定)' : ''}`}
                        arrow
                        placement="top"
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 32,
                            borderRadius: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: item.isCurrent
                              ? '#5e17eb'
                              : typeInfo?.bgColor || '#f1f5f9',
                            border: item.isCurrent
                              ? '2px solid #5e17eb'
                              : item.isFuture
                                ? `1px dashed ${typeInfo?.color || '#cbd5e1'}`
                                : `1px solid ${typeInfo?.color || '#e5e7eb'}30`,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: item.isCurrent ? '#fff' : '#374151',
                              lineHeight: 1
                            }}
                          >
                            {item.month}月
                          </Typography>
                          {typeInfo && (
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: item.isCurrent ? '#fff' : typeInfo.color,
                                mt: 0.25
                              }}
                            />
                          )}
                        </Box>
                      </Tooltip>

                      {/* タイプラベル（3ヶ月ごと） */}
                      {(item.month === 1 || item.month === 4 || item.month === 7 || item.month === 10) && typeInfo && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.55rem',
                            color: typeInfo.color,
                            fontWeight: 600,
                            mt: 0.25,
                            opacity: item.isFuture ? 0.6 : 1
                          }}
                        >
                          {typeInfo.label.charAt(0)}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>

              <IconButton
                size="small"
                onClick={() => scrollTimeline('right')}
                sx={{ color: '#64748b', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
              >
                <ChevronRight sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Paper>
        </Container>

        {/* フォーム一覧セクション */}
        <Container maxWidth="xl" sx={{ mt: 2, mb: 6 }}>
          {/* セクションヘッダー */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 4 
          }}>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#1a202c',
                  mb: 0.5,
                  fontSize: '1.75rem'
                }}
              >
                レビューフォーム一覧
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.875rem'
                }}
              >
                作成したレビューフォームを管理
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {selectedForms.size > 0 && (
                <Button
                  variant="outlined"
                  startIcon={isDeleting ? <CircularProgress size={16} /> : <Delete />}
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    borderRadius: 3,
                    px: 2.5,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      borderColor: '#dc2626',
                      color: '#dc2626',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.7,
                    }
                  }}
                >
                  {isDeleting ? '削除中...' : `選択した${selectedForms.size}件を削除`}
                </Button>
              )}

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={onCreateForm}
                disabled={isCreatingForm}
                sx={{
                  background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 20px rgba(94, 23, 235, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4c0dbf 0%, #5a6fd8 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 30px rgba(94, 23, 235, 0.4)',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.7,
                    background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                    color: 'white'
                  }
                }}
              >
                新規作成
              </Button>
            </Box>
          </Box>

          {/* ローディング状態 */}
          {loading && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: '300px' 
            }}>
              <CircularProgress 
                sx={{ 
                  color: '#5e17eb',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }} 
              />
            </Box>
          )}

          {/* エラー状態 */}
          {error && (
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              color: 'text.secondary'
            }}>
              <Typography variant="body1">
                {error}
              </Typography>
            </Box>
          )}

          {/* フォーム一覧テーブル */}
          {!loading && !error && (
            <>
              {sortedForms.length === 0 ? (
                // 空の状態
                <Box sx={{ 
                  textAlign: 'center',
                  py: 8,
                  px: 4,
                  backgroundColor: 'rgba(248, 249, 250, 0.8)',
                  borderRadius: 4,
                  border: '2px dashed rgba(0, 0, 0, 0.1)'
                }}>
                  <Description sx={{ 
                    fontSize: 64, 
                    color: 'text.disabled',
                    mb: 2 
                  }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      color: 'text.secondary',
                      mb: 1 
                    }}
                  >
                    まだフォームがありません
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      mb: 3
                    }}
                  >
                    新しいレビューフォームを作成してみましょう
                  </Typography>

                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={onCreateForm}
                    disabled={isCreatingForm}
                    sx={{
                      background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&.Mui-disabled': {
                        opacity: 0.7,
                        background: 'linear-gradient(135deg, #5e17eb 0%, #667eea 100%)',
                        color: 'white'
                      }
                    }}
                  >
                    最初のフォームを作成
                  </Button>
                </Box>
              ) : (
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    borderRadius: 0.5,
                    boxShadow: 'none',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    overflow: 'hidden'
                  }}
                >
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow 
                        sx={{ 
                          backgroundColor: '#f8fafc',
                          '& .MuiTableCell-head': {
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: '#374151',
                            borderBottom: '2px solid #e5e7eb',
                            py: 2
                          }
                        }}
                      >
                        <TableCell>
                          <Checkbox
                            size="small"
                            checked={selectedForms.size === sortedForms.length && sortedForms.length > 0}
                            indeterminate={selectedForms.size > 0 && selectedForms.size < sortedForms.length}
                            onChange={handleSelectAll}
                            sx={{ p: 0.5 }}
                          />
                        </TableCell>
                        <TableCell>フォーム名</TableCell>
                        <TableCell align="center">ステータス</TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'rgba(94, 23, 235, 0.05)' },
                            userSelect: 'none'
                          }}
                          onClick={() => handleSort('questionCount')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            質問数
                            {sortField === 'questionCount' && (
                              sortDirection === 'desc' ? 
                                <KeyboardArrowDown sx={{ fontSize: 16 }} /> : 
                                <KeyboardArrowUp sx={{ fontSize: 16 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'rgba(94, 23, 235, 0.05)' },
                            userSelect: 'none'
                          }}
                          onClick={() => handleSort('responses')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            回答数
                            {sortField === 'responses' && (
                              sortDirection === 'desc' ? 
                                <KeyboardArrowDown sx={{ fontSize: 16 }} /> : 
                                <KeyboardArrowUp sx={{ fontSize: 16 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'rgba(94, 23, 235, 0.05)' },
                            userSelect: 'none'
                          }}
                          onClick={() => handleSort('created_at')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            作成日
                            {sortField === 'created_at' && (
                              sortDirection === 'desc' ? 
                                <KeyboardArrowDown sx={{ fontSize: 16 }} /> : 
                                <KeyboardArrowUp sx={{ fontSize: 16 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'rgba(94, 23, 235, 0.05)' },
                            userSelect: 'none'
                          }}
                          onClick={() => handleSort('updated_at')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            更新日
                            {sortField === 'updated_at' && (
                              sortDirection === 'desc' ? 
                                <KeyboardArrowDown sx={{ fontSize: 16 }} /> : 
                                <KeyboardArrowUp sx={{ fontSize: 16 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">アクション</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedForms.map((formattedForm) => {
                        return (
                          <TableRow
                            key={formattedForm.id}
                            sx={{
                              '&:hover': {
                                backgroundColor: 'rgba(94, 23, 235, 0.02)',
                                '& .action-buttons': {
                                  opacity: 1,
                                }
                              },
                              '&:last-child td, &:last-child th': { 
                                border: 0 
                              },
                              transition: 'all 0.2s ease',
                              borderBottom: '1px solid rgba(0, 0, 0, 0.04)'
                            }}
                          >
                            {/* チェックボックス */}
                            <TableCell sx={{ py: 2 }}>
                              <Checkbox
                                size="small"
                                checked={selectedForms.has(formattedForm.id)}
                                onChange={() => handleSelectForm(formattedForm.id)}
                                sx={{ p: 0.5 }}
                              />
                            </TableCell>

                            {/* フォーム名 */}
                            <TableCell sx={{ py: 2 }}>
                              <Box>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 600,
                                    color: '#1a202c',
                                    fontSize: '0.95rem',
                                    lineHeight: 1.2,
                                    mb: 0.5
                                  }}
                                >
                                  {formattedForm.title}
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* ステータス */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Chip
                                label={formattedForm.status}
                                size="small"
                                sx={{
                                  backgroundColor: formattedForm.status === '公開中' 
                                    ? 'rgba(76, 175, 80, 0.12)' 
                                    : 'rgba(255, 152, 0, 0.12)',
                                  color: formattedForm.status === '公開中' 
                                    ? '#2e7d32' 
                                    : '#ed6c02',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  height: 28,
                                  borderRadius: 6,
                                  border: `1px solid ${formattedForm.status === '公開中' 
                                    ? 'rgba(76, 175, 80, 0.2)' 
                                    : 'rgba(255, 152, 0, 0.2)'}`,
                                }}
                              />
                            </TableCell>

                            {/* 質問数 */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: '#6b7280',
                                  fontSize: '0.95rem'
                                }}
                              >
                                {formattedForm.questionCount}
                              </Typography>
                            </TableCell>

                            {/* 回答数 */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: '#5e17eb',
                                  fontSize: '1rem'
                                }}
                              >
                                {formattedForm.responses}
                              </Typography>
                            </TableCell>

                            {/* 作成日 */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.secondary',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {formattedForm.createdAt}
                              </Typography>
                            </TableCell>

                            {/* 更新日 */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.secondary',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {new Date(formattedForm.lastModified).toLocaleDateString('ja-JP')}
                              </Typography>
                            </TableCell>

                            {/* アクション */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Box 
                                className="action-buttons"
                                sx={{ 
                                  display: 'flex', 
                                  gap: 0.5, 
                                  justifyContent: 'center',
                                  opacity: 0.7,
                                  transition: 'opacity 0.2s ease'
                                }}
                              >
                                <Tooltip title="その他">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleMenuClick(e, formattedForm.originalForm)}
                                    sx={{
                                      color: '#64748b',
                                      '&:hover': {
                                        backgroundColor: 'rgba(100, 116, 139, 0.1)',
                                      }
                                    }}
                                  >
                                    <MoreVert sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {/* アクションメニュー */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                borderRadius: 1,
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                mt: 1
              }
            }}
          >
            <MenuItem 
              onClick={() => {
                console.log('🔍 HomePage - 編集ボタンがクリックされました');
                console.log('🔍 HomePage - selectedForm:', selectedForm);
                console.log('🔍 HomePage - selectedForm.id:', selectedForm?.id);
                handleMenuClose();
                if (selectedForm) {
                  console.log('📝 HomePage - Navigating to edit form:', selectedForm.id);
                  navigate(`/create?formId=${selectedForm.id}`);
                }
              }} 
              sx={{ py: 1, px: 2 }}
            >
              <Edit sx={{ mr: 1.5, fontSize: 18, color: '#5e17eb' }} />
              編集
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ py: 1, px: 2 }}>
              <Analytics sx={{ mr: 1.5, fontSize: 18, color: '#059669' }} />
              分析
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ py: 1, px: 2 }}>
              <Share sx={{ mr: 1.5, fontSize: 18, color: '#0ea5e9' }} />
              共有
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ py: 1, px: 2 }}>
              <ContentCopy sx={{ mr: 1.5, fontSize: 18, color: '#6b7280' }} />
              複製
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ py: 1, px: 2 }}>
              <Delete sx={{ mr: 1.5, fontSize: 18, color: '#ef4444' }} />
              削除
            </MenuItem>
          </Menu>

          {/* 削除確認ダイアログ */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleDeleteCancel}
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
                maxWidth: 480
              }
            }}
          >
            <DialogTitle sx={{ 
              fontWeight: 700, 
              fontSize: '1.25rem',
              color: '#1a202c',
              pb: 1
            }}>
              フォームの削除確認
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ 
                color: '#6b7280',
                fontSize: '0.95rem',
                lineHeight: 1.6
              }}>
                選択した<strong>{selectedForms.size}件</strong>のレビューフォームを削除しますか？
                <br />
                この操作は取り消すことができません。
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
              <Button
                onClick={handleDeleteCancel}
                sx={{
                  color: '#6b7280',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(107, 114, 128, 0.08)'
                  }
                }}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                startIcon={isDeleting ? <CircularProgress size={16} /> : <Delete />}
                sx={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: '#dc2626'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#ef4444',
                    opacity: 0.7,
                    color: 'white'
                  }
                }}
              >
                {isDeleting ? '削除中...' : '削除する'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </motion.div>
  );
}