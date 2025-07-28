import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  IconButton,
  Input
} from '@mui/material';
import {
  Add,
  Delete,
  DragHandle,
  Edit,
  Login,
  CheckCircle,
  Pages
} from '@mui/icons-material';

const PageManager = ({
  pages,
  editingPageId,
  editingTitle,
  deleteMode,
  draggedPage,
  dropIndicator,
  sortingAnimation,
  handleAddPage,
  handleDeleteModeToggle,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  handlePageDeletionRequest,
  setSelectedPage,
  setEditingPageId,
  setEditingTitle,
  handleStartEditing,
  handleCancelEdit,
  handleSaveEdit
}) => {
  const getPageIcon = (page) => {
    switch (page.type) {
      case 'login':
        return <Login sx={{ fontSize: '1.1rem', color: '#5e17eb' }} />;
      case 'complete':
        return <CheckCircle sx={{ fontSize: '1.1rem', color: '#10b981' }} />;
      default:
        return <Pages sx={{ fontSize: '1.1rem', color: '#f59e0b' }} />;
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          ページ管理
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={handleAddPage}
            sx={{
              color: '#5e17eb',
              backgroundColor: 'rgba(94, 23, 235, 0.1)',
              '&:hover': { 
                backgroundColor: 'rgba(94, 23, 235, 0.2)',
                transform: 'scale(1.05)'
              }
            }}
          >
            <Add />
          </IconButton>
          <IconButton
            onClick={handleDeleteModeToggle}
            sx={{
              color: deleteMode ? '#ef4444' : '#64748b',
              backgroundColor: deleteMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
              '&:hover': { 
                backgroundColor: deleteMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                transform: 'scale(1.05)'
              }
            }}
          >
            <Delete />
          </IconButton>
        </Box>
      </Box>

      {/* ページリスト */}
      <Box sx={{ flex: 1 }}>
        {pages.map((page, index) => (
          <motion.div
            key={page.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: sortingAnimation?.id === page.id && sortingAnimation.direction === 'dragging' ? 1.05 : 1,
              x: sortingAnimation?.id === page.id && sortingAnimation.direction === 'up' ? -5 : 
                 sortingAnimation?.id === page.id && sortingAnimation.direction === 'down' ? 5 : 0
            }}
            transition={{ 
              duration: sortingAnimation?.id === page.id ? 0.2 : 0.2, 
              delay: sortingAnimation?.id === page.id ? 0 : index * 0.05 
            }}
          >
            <Box
              draggable={page.type === 'question' && !deleteMode}
              onDragStart={(e) => handleDragStart(e, page)}
              onDragOver={(e) => handleDragOver(e, page.id)}
              onDrop={(e) => handleDrop(e, page)}
              onDragEnd={handleDragEnd}
              onClick={(e) => {
                // 編集中の入力フィールドをクリックした場合は何もしない
                if (editingPageId === page.id) {
                  e.stopPropagation();
                  return;
                }
                
                if (deleteMode && page.canDelete) {
                  handlePageDeletionRequest(page);
                } else if (!deleteMode) {
                  setSelectedPage(page);
                }
              }}
              sx={{
                p: 1.5,
                mb: 1,
                borderRadius: 1,
                backgroundColor: sortingAnimation?.id === page.id && sortingAnimation.direction === 'success'
                  ? 'rgba(34, 197, 94, 0.1)'
                  : draggedPage?.id === page.id 
                  ? 'rgba(94, 23, 235, 0.1)' 
                  : dropIndicator === page.id
                  ? 'rgba(94, 23, 235, 0.08)'
                  : 'rgba(255, 255, 255, 0.8)',
                border: dropIndicator === page.id 
                  ? '2px dashed #5e17eb'
                  : sortingAnimation?.id === page.id && sortingAnimation.direction === 'success'
                  ? '1px solid rgba(34, 197, 94, 0.3)'
                  : '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                minHeight: 72,
                display: 'flex',
                alignItems: 'center',
                cursor: deleteMode && page.canDelete 
                  ? 'pointer' 
                  : 'default',
                opacity: draggedPage?.id === page.id ? 0.5 : deleteMode && !page.canDelete ? 0.5 : 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: deleteMode && page.canDelete
                    ? 'rgba(239, 68, 68, 0.05)'
                    : draggedPage?.id === page.id 
                    ? 'rgba(94, 23, 235, 0.1)' 
                    : 'rgba(94, 23, 235, 0.04)',
                  borderColor: deleteMode && page.canDelete
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(94, 23, 235, 0.15)',
                  transform: draggedPage?.id === page.id ? 'none' : 'translateY(-1px)',
                  boxShadow: '0 3px 12px rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              {/* ドラッグハンドル領域またはシステムページパディング */}
              {page.type === 'question' && !deleteMode ? (
                <Box
                  sx={{
                    color: '#94a3b8',
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                    '&:hover': { color: '#5e17eb' },
                    padding: '4px',
                    borderRadius: '4px',
                    mr: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(94, 23, 235, 0.1)',
                      color: '#5e17eb'
                    }
                  }}
                >
                  <DragHandle sx={{ fontSize: '1.2rem' }} />
                </Box>
              ) : (
                <Box sx={{ width: 32, mr: 1 }} />
              )}

              {/* ページアイコン */}
              <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                {getPageIcon(page)}
              </Box>

              {/* ページタイトル */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {editingPageId === page.id ? (
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={handleCancelEdit}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    sx={{
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      color: '#2d3748',
                      width: '100%',
                      '&:before': {
                        borderBottom: '2px solid #5e17eb'
                      },
                      '&:after': {
                        borderBottom: '2px solid #5e17eb'
                      }
                    }}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: '#2d3748',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {page.title}
                  </Typography>
                )}
                {page.type === 'question' && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      fontSize: '0.7rem'
                    }}
                  >
                    {page.questions}個の質問
                  </Typography>
                )}
              </Box>

              {/* 編集ボタン */}
              {page.canEdit && !deleteMode && editingPageId !== page.id && (
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEditing(page);
                  }}
                  sx={{
                    color: '#64748b',
                    '&:hover': {
                      color: '#5e17eb',
                      backgroundColor: 'rgba(94, 23, 235, 0.1)'
                    }
                  }}
                >
                  <Edit sx={{ fontSize: '1rem' }} />
                </IconButton>
              )}

              {/* 削除モード時の表示 */}
              {deleteMode && (
                <Box
                  sx={{
                    color: page.canDelete ? '#ef4444' : '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    px: 1
                  }}
                >
                  {page.canDelete ? '削除可' : '保護中'}
                </Box>
              )}
            </Box>
          </motion.div>
        ))}
      </Box>
    </>
  );
};

export default PageManager;