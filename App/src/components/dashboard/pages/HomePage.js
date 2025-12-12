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
  DialogContentText,
  Skeleton
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
  KeyboardArrowDown
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

  // QSCテーマの設定
  const qscThemeConfig = {
    quality: { label: 'Q', fullLabel: 'Quality', color: '#10b981', bgColor: '#ecfdf5' },
    service: { label: 'S', fullLabel: 'Service', color: '#3b82f6', bgColor: '#eff6ff' },
    cleanliness: { label: 'C', fullLabel: 'Cleanliness', color: '#8b5cf6', bgColor: '#f5f3ff' }
  };

  // フォームデータの変換
  const formatFormData = (form) => ({
    id: form.id,
    title: form.title || '名称未設定',
    description: 'レビューフォーム',
    status: form.is_published ? '公開中' : '下書き',
    responses: 0, // TODO: 実際の回答数を取得
    questionCount: form.review_questions ? form.review_questions.length : 0, // 質問数を追加
    lastModified: new Date(form.updated_at).toLocaleDateString('ja-JP'), // 日本時間で表示
    category: 'レビュー',
    themeColor: form.review_form_settings?.[0]?.theme_color || '#5e17eb',
    qscTheme: form.qsc_theme, // QSCテーマを追加
    // ソート用の生データも保持
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

          {/* ローディング状態（スケルトンスクリーン） */}
          {loading && (
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
                    <TableCell><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                    <TableCell>フォーム名</TableCell>
                    <TableCell align="center">QSC</TableCell>
                    <TableCell align="center">ステータス</TableCell>
                    <TableCell align="center">質問数</TableCell>
                    <TableCell align="center">回答数</TableCell>
                    <TableCell align="center">更新日</TableCell>
                    <TableCell align="center">アクション</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((row) => (
                    <TableRow key={row} sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.04)' }}>
                      <TableCell sx={{ py: 2 }}>
                        <Skeleton variant="rectangular" width={20} height={20} sx={{ borderRadius: 0.5 }} />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Skeleton variant="text" width={180} height={24} />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Skeleton variant="rounded" width={80} height={24} sx={{ mx: 'auto' }} />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Skeleton variant="rounded" width={60} height={28} sx={{ mx: 'auto' }} />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Skeleton variant="text" width={30} height={24} sx={{ mx: 'auto' }} />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Skeleton variant="text" width={30} height={24} sx={{ mx: 'auto' }} />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Skeleton variant="text" width={80} height={24} sx={{ mx: 'auto' }} />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Skeleton variant="circular" width={28} height={28} sx={{ mx: 'auto' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
                        <TableCell align="center">QSC</TableCell>
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
                            onClick={() => navigate(`/create?formId=${formattedForm.id}`)}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'rgba(94, 23, 235, 0.04)',
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
                            <TableCell sx={{ py: 2 }} onClick={(e) => e.stopPropagation()}>
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

                            {/* QSCテーマ */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              {formattedForm.qscTheme && qscThemeConfig[formattedForm.qscTheme] ? (
                                <Chip
                                  label={qscThemeConfig[formattedForm.qscTheme].fullLabel}
                                  size="small"
                                  sx={{
                                    backgroundColor: qscThemeConfig[formattedForm.qscTheme].bgColor,
                                    color: qscThemeConfig[formattedForm.qscTheme].color,
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    height: 24,
                                    borderRadius: 1,
                                    border: `1px solid ${qscThemeConfig[formattedForm.qscTheme].color}20`,
                                    '& .MuiChip-label': {
                                      px: 1
                                    }
                                  }}
                                />
                              ) : (
                                <Typography
                                  variant="caption"
                                  sx={{ color: '#9ca3af', fontSize: '0.75rem' }}
                                >
                                  未設定
                                </Typography>
                              )}
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

                            {/* 更新日 */}
                            <TableCell align="center" sx={{ py: 2 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.secondary',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {formattedForm.lastModified}
                              </Typography>
                            </TableCell>

                            {/* アクション */}
                            <TableCell align="center" sx={{ py: 2 }} onClick={(e) => e.stopPropagation()}>
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