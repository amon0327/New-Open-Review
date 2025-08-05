import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { validateForm } from '../utils/validation';
import PreviewUrlDialog from './PreviewUrlDialog';

const PreviewHandler = ({ 
  formId, 
  formData = {}, 
  projectTitle,
  children 
}) => {
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  const handlePreviewClick = () => {
    console.log('🔍 プレビューボタンがクリックされました');
    
    // フォーム検証の実行
    const validationData = {
      projectTitle,
      ...formData
    };
    
    const { errors } = validateForm(validationData);
    const errorCount = errors.length;
    
    // エラーがある場合はプレビューを阻止し、エラー解決を促すメッセージを表示
    if (errorCount > 0) {
      // react-hot-toastで中央下にエラーメッセージを表示
      toast.error('エラーを解決してからプレビューが可能です', {
        duration: 4000,
        position: 'bottom-center',
        style: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#ffffff',
        },
      });
      return;
    }
    
    console.log('✅ プレビューダイアログを表示します');
    setShowPreviewDialog(true);
  };

  return (
    <>
      {/* 子コンポーネントにプレビュークリックハンドラーを渡す */}
      {children({ onPreviewClick: handlePreviewClick })}
      
      {/* プレビューURLダイアログ */}
      <PreviewUrlDialog
        open={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        formId={formId}
      />
    </>
  );
};

export default PreviewHandler;