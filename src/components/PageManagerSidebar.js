import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  Add,
  Delete,
  DragHandle,
  KeyboardArrowUp,
  KeyboardArrowDown
} from '@mui/icons-material';

// スタイル定数をインポート
const PURPLE_GRADIENT_TEXT_STYLE = {
  fontWeight: 600,
  background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
};

const PageManagerSidebar = ({
  pages,
  handleAddPage,
  deleteMode,
  handleDeleteModeToggle,
  sortingAnimation,
  draggedPage,
  dropIndicator,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  editingPageId,
  editingTitle,
  setEditingTitle,
  handleStartEdit,
  handleSaveEdit,
  handleCancelEdit,
  handleMovePageUp,
  handleMovePageDown,
  handleDeletePage,
  createIconContainerStyle
}) => {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="h6"
          sx={PURPLE_GRADIENT_TEXT_STYLE}
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
            draggable
            onDragStart={(e) => handleDragStart(e, page, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            style={{
              marginBottom: '8px',
              position: 'relative',
              zIndex: draggedPage?.id === page.id ? 1000 : 1
            }}
          >
            {/* ドロップインジケーター */}
            {dropIndicator === index && (
              <Box sx={{ 
                height: 2, 
                backgroundColor: '#5e17eb', 
                borderRadius: 1, 
                mb: 1,
                opacity: 0.7
              }} />
            )}

            <Box
              sx={{
                p: 2,
                backgroundColor: editingPageId === page.id ? 'rgba(94, 23, 235, 0.05)' : 'rgba(248, 250, 252, 0.8)',
                border: editingPageId === page.id ? '2px solid #5e17eb' : '1px solid rgba(226, 232, 240, 0.5)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'grab',
                '&:hover': {
                  backgroundColor: editingPageId === page.id ? 'rgba(94, 23, 235, 0.08)' : 'rgba(94, 23, 235, 0.03)',
                  transform: 'translateY(-1px)',
                  boxShadow: editingPageId === page.id 
                    ? '0 8px 25px rgba(94, 23, 235, 0.2)' 
                    : '0 4px 12px rgba(0, 0, 0, 0.1)'
                },
                '&:active': {
                  cursor: 'grabbing'
                },
                transition: 'all 0.2s ease',
                opacity: draggedPage?.id === page.id ? 0.5 : 1,
                transform: draggedPage?.id === page.id ? 'rotate(5deg)' : 'none'
              }}
            >
              {/* ドラッグハンドル */}
              {!editingPageId && page.type !== 'system' && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: 1,
                    color: '#94a3b8',
                    cursor: 'grab',
                    flexShrink: 0,
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
                <Box sx={{ width: 16, flexShrink: 0 }} />
              )}

              {/* ページアイコン */}
              <Box
                sx={createIconContainerStyle(
                  32,
                  page.type === 'system' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #5e17eb 0%, #764ba2 100%)'
                )}
              >
                {React.cloneElement(page.icon, { 
                  sx: { color: 'white', fontSize: '1rem' } 
                })}
              </Box>

              {/* ページタイトル */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {editingPageId === page.id ? (
                  <input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    onBlur={handleSaveEdit}
                    autoFocus
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#1e293b'
                    }}
                  />
                ) : (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500, 
                      color: '#1e293b',
                      cursor: page.type !== 'system' ? 'text' : 'default'
                    }}
                    onClick={() => page.type !== 'system' && handleStartEdit(page)}
                  >
                    {page.title}
                  </Typography>
                )}
              </Box>

              {/* アクションボタン */}
              {!editingPageId && page.type !== 'system' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {/* 上移動ボタン */}
                  {index > 1 && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMovePageUp(page.id);
                      }}
                      sx={{
                        color: '#64748b',
                        '&:hover': { 
                          backgroundColor: 'rgba(100, 116, 139, 0.1)',
                          color: '#475569'
                        }
                      }}
                    >
                      <KeyboardArrowUp sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  )}

                  {/* 下移動ボタン */}
                  {index < pages.length - 2 && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMovePageDown(page.id);
                      }}
                      sx={{
                        color: '#64748b',
                        '&:hover': { 
                          backgroundColor: 'rgba(100, 116, 139, 0.1)',
                          color: '#475569'
                        }
                      }}
                    >
                      <KeyboardArrowDown sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  )}

                  {/* 削除ボタン */}
                  {deleteMode && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(page);
                      }}
                      sx={{
                        color: '#ef4444',
                        '&:hover': { 
                          backgroundColor: 'rgba(239, 68, 68, 0.1)'
                        }
                      }}
                    >
                      <Delete sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>
          </motion.div>
        ))}
      </Box>
    </>
  );
};

export default PageManagerSidebar;