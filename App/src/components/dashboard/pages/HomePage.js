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
  KeyboardArrowDown,
  Warning
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

  useEffect(() => {
    fetchForms();
  }, [user]);

  const fetchForms = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const result = await FormDataService.getUserForms(user.id);
      
      if (result.success) {
        setForms(result.data);
      } else {
        setError(result.error);
        setForms([]);
      }
      setSelectedForms(new Set());
    } catch (err) {
      console.error('フォーム取得エラー:', err);
      setError('フォームの取得に失敗しました');
      setForms([]);
      setSelectedForms(new Set());
    } finally {
      setLoading(false);
    }
  };

  const handleFormClick = (form) => {
    console.log('📝 HomePage - handleFormClick:', form);
    
    if (!form || !form.id) {
      console.error('❌ HomePage - Invalid form data:', form);
      toast.error('フォーム情報が正しくありません');
      return;
    }

    const formId = form.id;
    console.log('🚀 HomePage - Navigating to formId:', formId);
    
    navigate(`/create?formId=${formId}`);
    
    if (onCreateFormClick) {
      onCreateFormClick(formId);
    }
  };

  const handleMenuClick = (event, form) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedForm(form);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (selectedForm) {
      handleFormClick(selectedForm);
    }
    handleMenuClose();
  };

  const handleAnalytics = () => {
    if (selectedForm) {
      navigate(`/analytics/${selectedForm.id}`);
    }
    handleMenuClose();
  };

  const handleShare = () => {
    if (selectedForm) {
      const url = `${window.location.origin}/review/${selectedForm.id}`;
      navigator.clipboard.writeText(url)
        .then(() => {
          toast.success('共有URLをコピーしました');
        })
        .catch(() => {
          toast.error('URLのコピーに失敗しました');
        });
    }
    handleMenuClose();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allFormIds = forms.map(form => form.id);
      setSelectedForms(new Set(allFormIds));
    } else {
      setSelectedForms(new Set());
    }
  };

  const handleSelectForm = (formId) => {
    const newSelectedForms = new Set(selectedForms);
    if (newSelectedForms.has(formId)) {
      newSelectedForms.delete(formId);
    } else {
      newSelectedForms.add(formId);
    }
    setSelectedForms(newSelectedForms);
  };

  const handleBulkDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    
    try {
      const deletePromises = Array.from(selectedForms).map(formId =>
        FormDataService.deleteForm(formId)
      );
      
      await Promise.all(deletePromises);
      
      toast.success(`${selectedForms.size}件のフォームを削除しました`);
      
      setDeleteDialogOpen(false);
      setSelectedForms(new Set());
      
      await fetchForms();
    } catch (error) {
      console.error('フォーム削除エラー:', error);
      toast.error('フォームの削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedForms = useMemo(() => {
    if (!forms || forms.length === 0) return [];
    
    return [...forms].sort((a, b) => {
      let valueA, valueB;
      
      switch (sortField) {
        case 'title':
          valueA = a.title || '';
          valueB = b.title || '';
          break;
        case 'status':
          valueA = a.is_published ? 1 : 0;
          valueB = b.is_published ? 1 : 0;
          break;
        case 'questions':
          valueA = a.questions || 0;
          valueB = b.questions || 0;
          break;
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
    >
      <Box
        sx={{
          minHeight: '100vh',
          overflow: 'auto',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          py: 4
        }}
      >
        <Container maxWidth="xl">
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
                      boxShadow: '0 3px 15px rgba(94, 23, 235, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4c0dbf 0%, #5a6fd8 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 5px 20px rgba(94, 23, 235, 0.4)',
                      },
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
                // フォーム一覧テーブル
                <TableContainer
                  component={Paper}
                  sx={{
                    borderRadius: 0.5,
                    boxShadow: 'none',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    overflow: 'hidden',
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
                        <TableCell padding="checkbox" sx={{ width: '48px' }}>
                          <Checkbox
                            indeterminate={selectedForms.size > 0 && selectedForms.size < forms.length}
                            checked={forms.length > 0 && selectedForms.size === forms.length}
                            onChange={handleSelectAll}
                            sx={{
                              color: '#9ca3af',
                              '&.Mui-checked': {
                                color: '#5e17eb',
                              },
                              '&.MuiCheckbox-indeterminate': {
                                color: '#5e17eb',
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            cursor: 'pointer', 
                            userSelect: 'none',
                            '&:hover': { color: '#5e17eb' }
                          }}
                          onClick={() => handleSort('title')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            フォーム名
                            {sortField === 'title' && (
                              sortDirection === 'asc' ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            cursor: 'pointer', 
                            userSelect: 'none',
                            '&:hover': { color: '#5e17eb' }
                          }}
                          onClick={() => handleSort('status')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            ステータス
                            {sortField === 'status' && (
                              sortDirection === 'asc' ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            cursor: 'pointer', 
                            userSelect: 'none',
                            '&:hover': { color: '#5e17eb' }
                          }}
                          onClick={() => handleSort('questions')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            質問数
                            {sortField === 'questions' && (
                              sortDirection === 'asc' ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            cursor: 'pointer', 
                            userSelect: 'none',
                            '&:hover': { color: '#5e17eb' }
                          }}
                          onClick={() => handleSort('responses')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            回答数
                            {sortField === 'responses' && (
                              sortDirection === 'asc' ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            cursor: 'pointer', 
                            userSelect: 'none',
                            '&:hover': { color: '#5e17eb' }
                          }}
                          onClick={() => handleSort('updated_at')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            更新日
                            {sortField === 'updated_at' && (
                              sortDirection === 'asc' ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">アクション</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedForms.map((form) => (
                        <TableRow
                          key={form.id}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'rgba(94, 23, 235, 0.02)'
                            },
                            borderBottom: '1px solid rgba(0, 0, 0, 0.04)'
                          }}
                          onClick={() => handleFormClick(form)}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedForms.has(form.id)}
                              onChange={() => handleSelectForm(form.id)}
                              sx={{
                                color: '#9ca3af',
                                '&.Mui-checked': {
                                  color: '#5e17eb',
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Description sx={{ color: '#9ca3af', fontSize: 20 }} />
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  color: '#1f2937',
                                  fontSize: '0.95rem'
                                }}
                              >
                                {form.title || 'フォーム'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 2.5 }}>
                            <Chip
                              label={form.is_published ? '公開中' : '下書き'}
                              size="small"
                              sx={{
                                backgroundColor: form.is_published ? '#d1fae5' : '#f3f4f6',
                                color: form.is_published ? '#065f46' : '#6b7280',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 28
                              }}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ py: 2.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                              {(form.questions || 0) + 26}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 2.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                              {form.responses || 0}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 2.5 }}>
                            <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                              {formatDate(form.updated_at)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 2.5 }} onClick={(e) => e.stopPropagation()}>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, form)}
                              sx={{
                                color: '#6b7280',
                                '&:hover': {
                                  backgroundColor: 'rgba(94, 23, 235, 0.08)',
                                  color: '#5e17eb'
                                }
                              }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
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
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                borderRadius: 2,
                minWidth: 180
              }
            }}
          >
            <MenuItem onClick={handleEdit} sx={{ gap: 1.5, py: 1.5 }}>
              <Edit fontSize="small" sx={{ color: '#6b7280' }} />
              <Typography variant="body2">編集</Typography>
            </MenuItem>
            <MenuItem onClick={handleAnalytics} sx={{ gap: 1.5, py: 1.5 }}>
              <Analytics fontSize="small" sx={{ color: '#6b7280' }} />
              <Typography variant="body2">分析</Typography>
            </MenuItem>
            <MenuItem onClick={handleShare} sx={{ gap: 1.5, py: 1.5 }}>
              <Share fontSize="small" sx={{ color: '#6b7280' }} />
              <Typography variant="body2">共有</Typography>
            </MenuItem>
          </Menu>

          {/* 削除確認ダイアログ */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            PaperProps={{
              sx: {
                borderRadius: 3,
                p: 2
              }
            }}
          >
            <DialogTitle sx={{ pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Warning sx={{ color: '#ef4444', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  フォームの削除確認
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: '#374151', fontSize: '0.95rem' }}>
                選択した{selectedForms.size}件のフォームを削除します。
                この操作は取り消せません。本当に削除しますか？
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ pt: 2, px: 3, pb: 1 }}>
              <Button 
                onClick={() => setDeleteDialogOpen(false)}
                sx={{
                  color: '#6b7280',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2
                }}
              >
                キャンセル
              </Button>
              <Button
                onClick={confirmBulkDelete}
                variant="contained"
                disabled={isDeleting}
                startIcon={isDeleting ? <CircularProgress size={16} /> : null}
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