import React, { useState, useEffect, useMemo } from 'react';
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
  DialogContentText
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
  Close
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

  // アンケートサイクル設定
  const [surveyCycleConfig, setSurveyCycleConfig] = useState({
    groupA: 'Quality',      // 1月, 4月, 7月, 10月
    groupB: 'Service',      // 2月, 5月, 8月, 11月
    groupC: 'Cleanliness'   // 3月, 6月, 9月, 12月
  });
  const [showCycleSettings, setShowCycleSettings] = useState(false);
  const [cycleConfirmDialogOpen, setCycleConfirmDialogOpen] = useState(false);

  const surveyTypes = [
    { id: 'Quality', label: 'Q', fullLabel: 'Quality', color: '#6366f1', bgColor: '#eef2ff' },
    { id: 'Service', label: 'S', fullLabel: 'Service', color: '#10b981', bgColor: '#ecfdf5' },
    { id: 'Cleanliness', label: 'C', fullLabel: 'Cleanliness', color: '#f59e0b', bgColor: '#fffbeb' }
  ];

  const cycleGroups = [
    { key: 'groupA', months: [1, 4, 7, 10], label: '1・4・7・10月' },
    { key: 'groupB', months: [2, 5, 8, 11], label: '2・5・8・11月' },
    { key: 'groupC', months: [3, 6, 9, 12], label: '3・6・9・12月' }
  ];

  // 現在の月からアンケートタイプを取得
  const getCurrentSurveyType = () => {
    const currentMonth = new Date().getMonth() + 1;
    const group = cycleGroups.find(g => g.months.includes(currentMonth));
    if (group) {
      const typeId = surveyCycleConfig[group.key];
      return surveyTypes.find(t => t.id === typeId);
    }
    return null;
  };

  const currentSurveyType = getCurrentSurveyType();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // サイクル設定変更ハンドラー（重複を許さない）
  const handleCycleChange = (groupKey, newType) => {
    // 現在の設定から、newTypeを持っている他のグループを探す
    const otherGroupWithSameType = Object.entries(surveyCycleConfig).find(
      ([key, type]) => key !== groupKey && type === newType
    );

    if (otherGroupWithSameType) {
      // 交換する：選択したグループに新しいタイプを、元のグループに現在のタイプを
      const [otherGroupKey] = otherGroupWithSameType;
      const currentType = surveyCycleConfig[groupKey];
      setSurveyCycleConfig(prev => ({
        ...prev,
        [groupKey]: newType,
        [otherGroupKey]: currentType
      }));
    } else {
      // 重複がない場合はそのまま設定
      setSurveyCycleConfig(prev => ({
        ...prev,
        [groupKey]: newType
      }));
    }
  };

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
              3ヶ月サイクルで Quality・Service・Cleanliness を順番に評価
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

                    {/* 説明文と確定ボタン */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        ※ 各項目は重複不可。選択すると自動で入れ替わります。
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => setCycleConfirmDialogOpen(true)}
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
          )}
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
                onClick={() => {
                  // TODO: サイクル設定をDBに保存する処理
                  toast.success('設定を保存しました（来月から適用）');
                  setCycleConfirmDialogOpen(false);
                  setShowCycleSettings(false);
                }}
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
                  }
                }}
              >
                保存する
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </motion.div>
  );
}