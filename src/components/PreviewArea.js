import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  Alert
} from '@mui/material';
import { colors, gradients, shadows } from '../constants/theme';
import PreviewLogin from './preview/PreviewLogin';
import PreviewQuestions from './preview/PreviewQuestions';
import PreviewCompletion from './preview/PreviewCompletion';

const PreviewArea = ({ 
  previewMode, 
  zoom, 
  selectedPage, 
  questions = [], 
  onQuestionAdd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragActive,
  pages = [],
  selectedQuestionId,
  onQuestionSelect,
  onPageSelect,
  // 基本設定関連
  headerImage,
  logoImage,
  onElementSelect,
  selectedElement,
  formSettings = {}, // フォーム設定（テーマカラー、ダークモードなど）
  // ログイン画面設定
  loginScreenSettings = {},
  // 完了画面設定
  completionScreenSettings = {},
  // フォームID
  formId,
  // テキスト設定関連（プレビュー即座更新用）
  loginTitle,
  loginDetail,
  completionTitle,
  completionDetail,
  completionBackground,
  pageErrorHighlight
}) => {
  const dropRef = useRef(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  // ドラッグ&ドロップイベントハンドラ - プレビュー画面全体でドロップ可能にする
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDragOver) onDragOver(e);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDragLeave) onDragLeave(e);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // プレビュー画面の任意の場所でドロップした場合、質問を最後に追加
    if (onDrop) {
      onDrop(e);
    }
  };

  const renderPreviewContent = () => {
    // デフォルトでは最初の質問ページを表示
    const defaultPage = selectedPage || pages.find(p => p.type === 'question');
    
    if (!defaultPage) {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: previewMode === 'mobile' ? 2 : 4,
            background: gradients.background
          }}
        >
          <Typography variant="h6" sx={{ color: colors.textSecondary, mb: 2 }}>
            プレビュー
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textMuted }}>
            ページを作成してください
          </Typography>
        </Box>
      );
    }

    switch (defaultPage.id) {
      case 'login':
        return (
          <PreviewLogin 
            previewMode={previewMode} 
            onElementSelect={onElementSelect}
            selectedElement={selectedElement}
            formId={formId}
            loginTitleText={loginTitle}
            loginDetailText={loginDetail}
            formSettings={formSettings}
            loginScreenSettings={loginScreenSettings}
            headerImage={headerImage}
            logoImage={logoImage}
          />
        );
      case 'completion':
        return (
          <PreviewCompletion 
            previewMode={previewMode}
            onElementSelect={onElementSelect}
            selectedElement={selectedElement}
            formId={formId}
            completionTitleText={completionTitle}
            completionDetailText={completionDetail}
            completionBackgroundImage={completionBackground}
            completionScreenSettings={completionScreenSettings}
            formSettings={formSettings}
            headerImage={headerImage}
            logoImage={logoImage}
          />
        );
      default:
        // 質問ページ
        return (
          <PreviewQuestions 
            previewMode={previewMode} 
            zoom={zoom}
            questions={questions}
            selectedPage={defaultPage}
            isDragActive={isDragActive}
            dropIndicator={dropIndicator}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            dropRef={dropRef}
            selectedQuestionId={selectedQuestionId}
            onQuestionSelect={onQuestionSelect}
            headerImage={headerImage}
            logoImage={logoImage}
            onElementSelect={onElementSelect}
            selectedElement={selectedElement}
            formId={formId}
            formSettings={formSettings}
            pageErrorHighlight={pageErrorHighlight}
          />
        );
    }
  };

  return (
    <Box
      onClick={(e) => {
        // プレビュー画面の外側（影の部分）をクリックした時に要素選択を解除
        if (e.target === e.currentTarget) {
          onElementSelect && onElementSelect(null);
          onQuestionSelect && onQuestionSelect(null);
        }
      }}
      sx={{
        position: 'absolute',
        top: '54%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        pointerEvents: 'auto'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: zoom }}
        transition={{ duration: 0.3 }}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center'
        }}
      >
        {/* カルーセルタブ - プレビュー時に表示 */}
        {pages && pages.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
              gap: 1,
              width: '100%'
            }}
          >
            {(() => {
              const currentIndex = pages.findIndex(page => page.id === selectedPage?.id);
              const visiblePages = [];
              
              // 現在のページを中心に前後1つずつ、計3つのページを表示
              for (let i = currentIndex - 1; i <= currentIndex + 1; i++) {
                if (i >= 0 && i < pages.length) {
                  visiblePages.push(pages[i]);
                }
              }
              
              return visiblePages.map((page, index) => {
                const isActive = selectedPage?.id === page.id;
                const isCenter = isActive; // 選択されているページが常に中心タブとして扱われる
                
                return (
                  <Box
                    key={page.id}
                    onClick={() => {
                      if (page && onPageSelect) {
                        onQuestionSelect?.(null);
                        onPageSelect(page);
                      }
                    }}
                    title={page.title} // ホバー時に全文表示
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: isCenter ? 3.5 : 2.5,
                      py: isCenter ? 1.5 : 1,
                      borderRadius: 3,
                      backgroundColor: isActive ? '#5e17eb' : 'rgba(255, 255, 255, 0.9)',
                      color: isActive ? 'white' : '#6b7280',
                      fontSize: isCenter ? '0.85rem' : '0.75rem',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '1px solid',
                      borderColor: isActive ? '#5e17eb' : 'rgba(0, 0, 0, 0.1)',
                      boxShadow: isActive 
                        ? '0 3px 12px rgba(94, 23, 235, 0.4)'
                        : '0 1px 3px rgba(0, 0, 0, 0.1)',
                      width: isCenter ? '150px' : '110px', // 固定幅でサイズ統一
                      overflow: 'hidden', // テキストオーバーフロー対応
                      textOverflow: 'ellipsis', // 省略記号(...) を表示
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transform: isCenter ? 'scale(1.05)' : 'scale(1)',
                      opacity: isCenter ? 1 : 0.7,
                      '&:hover': {
                        backgroundColor: isActive ? '#4c1d95' : 'rgba(94, 23, 235, 0.1)',
                        borderColor: '#5e17eb',
                        transform: isCenter ? 'scale(1.08) translateY(-1px)' : 'scale(1.02) translateY(-1px)',
                        opacity: 1,
                        boxShadow: isActive 
                          ? '0 4px 16px rgba(94, 23, 235, 0.5)'
                          : '0 2px 8px rgba(94, 23, 235, 0.2)'
                      }
                    }}
                  >
                    {(() => {
                      const maxLength = isCenter ? 9 : 6;
                      if (page.title.length > maxLength) {
                        return page.title.substring(0, maxLength) + '..';
                      }
                      return page.title;
                    })()}
                  </Box>
                );
              });
            })()}
          </Box>
        )}
        
        <Paper
          elevation={12}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            width: previewMode === 'mobile' ? 390 : 1440,
            height: previewMode === 'mobile' ? 820 : 900,
            borderRadius: previewMode === 'mobile' ? 6 : 0,
            background: colors.white,
            border: previewMode === 'mobile' 
              ? '8px solid #1a1a1a' 
              : isDragActive
                ? '4px solid rgba(94, 23, 235, 0.5)'
                : '2px solid #e2e8f0',
            boxShadow: isDragActive
              ? `
                0 0 0 4px rgba(94, 23, 235, 0.3),
                0 0 40px rgba(94, 23, 235, 0.4),
                0 20px 80px rgba(94, 23, 235, 0.2),
                ${previewMode === 'mobile' ? shadows.mobile : shadows.card}
              `
              : previewMode === 'mobile' 
                ? shadows.mobile
                : shadows.card,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isDragActive ? 'scale(1.02)' : 'scale(1)',
            '&::before': isDragActive ? {
              content: '""',
              position: 'absolute',
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              background: 'linear-gradient(45deg, #5e17eb, #764ba2, #667eea, #5e17eb)',
              borderRadius: previewMode === 'mobile' ? 14 : 8,
              zIndex: -1,
              backgroundSize: '300% 300%',
              animation: 'borderGlow 2s ease infinite',
              '@keyframes borderGlow': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' }
              }
            } : {},
          }}
        >
          {/* モバイルの場合のノッチ */}
          {previewMode === 'mobile' && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 150,
                height: 30,
                background: '#1a1a1a',
                borderBottomLeftRadius: 15,
                borderBottomRightRadius: 15,
                zIndex: 10
              }}
            />
          )}

          {/* プレビューコンテンツ */}
          {renderPreviewContent()}
        </Paper>
      </motion.div>
    </Box>
  );
};

export default PreviewArea;