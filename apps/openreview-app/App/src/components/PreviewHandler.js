import React, { useState } from 'react';
import toast from 'react-hot-toast';
import FormDataService from '../services/FormDataService';
import { validateForm } from '../utils/validation';
import PreviewUrlDialog from './PreviewUrlDialog';

const PreviewHandler = ({ 
  formId, 
  formData = {}, 
  projectTitle,
  children
}) => {
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  const handlePreviewClick = async () => {
    console.log('🔍 PreviewHandler - プレビューボタンがクリックされました');
    console.log('🔍 PreviewHandler - formId:', formId);
    console.log('🔍 PreviewHandler - projectTitle:', projectTitle);
    console.log('🔍 PreviewHandler - formData:', formData);
    
    // 必ずフォーム詳細データを取得して検証を実行
    let validationData = {
      projectTitle,
      ...formData
    };

    // formDataが空の場合（ホーム画面から呼ばれた場合）は、フォーム詳細データを取得
    if (Object.keys(formData).length === 0 && formId) {
      console.log('🔍 PreviewHandler - formDataが空のため、詳細データを取得します');
      try {
        const result = await FormDataService.getFormDetails(formId);
        if (result.success) {
          console.log('🔍 PreviewHandler - 取得したrawデータ:', result.data);
          
          // フォーム詳細データから検証用データを構築
          validationData = {
            projectTitle: result.data.title || projectTitle,
            pages: result.data.review_form_pages || [],
            formSettings: result.data.review_form_settings?.[0] || {},
            loginScreenSettings: result.data.login_screen_settings?.[0] || {},
            completionScreenSettings: result.data.completion_screen_settings?.[0] || {},
            questions: [], // TODO: 質問データも取得する必要がある場合
            loginTitle: result.data.login_screen_settings?.[0]?.title_text || '',
            loginDetail: result.data.login_screen_settings?.[0]?.detail_text || '',
            completionTitle: result.data.completion_screen_settings?.[0]?.title_text || '',
            completionDetail: result.data.completion_screen_settings?.[0]?.detail_text || ''
          };
          console.log('🔍 PreviewHandler - 構築した検証用データ:', validationData);
        } else {
          console.error('❌ PreviewHandler - フォーム詳細データの取得に失敗:', result.error);
          toast.error('フォームデータの取得に失敗しました', {
            duration: 3000,
            position: 'bottom-center'
          });
          return;
        }
      } catch (error) {
        console.error('❌ PreviewHandler - フォーム詳細データの取得中にエラー:', error);
        toast.error('フォームデータの取得中にエラーが発生しました', {
          duration: 3000,
          position: 'bottom-center'
        });
        return;
      }
    }
    
    console.log('🔍 PreviewHandler - 最終的なvalidationData:', validationData);
    
    const { errors, warnings } = validateForm(validationData);
    const errorCount = errors.length;
    const warningCount = warnings.length;
    
    console.log('🔍 PreviewHandler - 検証結果:');
    console.log('  - errorCount:', errorCount);
    console.log('  - warningCount:', warningCount);
    console.log('  - errors:', errors);
    console.log('  - warnings:', warnings);
    
    // エラーがある場合はプレビューを阻止し、エラー解決を促すメッセージを表示
    if (errorCount > 0) {
      console.log('❌ PreviewHandler - エラーが検出されました。プレビューを阻止します');
      console.log('❌ PreviewHandler - 検出されたエラー一覧:');
      errors.forEach(error => {
        console.log(`  - ${error.id}: ${error.message} (${error.location})`);
      });
      
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
    
    console.log('✅ PreviewHandler - エラーなし。プレビューダイアログを表示します');
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