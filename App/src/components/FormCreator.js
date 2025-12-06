import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import FormDataService from '../services/FormDataService';

const FormCreator = ({
  user,
  onCreateFormClick,
  children,
  selectedCompany = null
}) => {
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  const handleCreateForm = async () => {
    console.log('🎯 FormCreator.handleCreateForm called');
    console.log('  - user:', user);
    console.log('  - selectedCompany:', selectedCompany);
    console.log('  - selectedCompany type:', typeof selectedCompany);
    console.log('  - selectedCompany?.id:', selectedCompany?.id);

    if (!user) {
      console.error('❌ No user found');
      toast.error('ユーザー情報が取得できません');
      return;
    }

    console.log('⏳ Setting isCreatingForm to true');
    setIsCreatingForm(true);
    try {
      const companyId = selectedCompany?.id || null;
      console.log('🔍 Extracted companyId:', companyId, 'Type:', typeof companyId);
      console.log('🔄 Calling FormDataService.createNewForm with user.id:', user.id, 'companyId:', companyId);
      const result = await FormDataService.createNewForm(user.id, companyId);
      console.log('📋 FormDataService.createNewForm result:', result);
      
      if (result.success) {
        console.log('✅ Form creation successful, navigating to form:', result.data.reviewFormId);
        // フォーム作成成功時は通知なし（Dashboard.jsと同じ挙動）
        // フォーム作成画面に遷移（formIdを渡す）
        onCreateFormClick(result.data.reviewFormId);
      } else {
        console.error('❌ Form creation failed:', result.error);
        toast.error(result.error || 'フォームの作成に失敗しました');
      }
    } catch (error) {
      console.error('❌ Form creation error:', error);
      toast.error('フォームの作成中にエラーが発生しました');
    } finally {
      console.log('🏁 Setting isCreatingForm to false');
      setIsCreatingForm(false);
    }
  };

  return (
    <>
      {/* 子コンポーネントにフォーム作成ハンドラーと状態を渡す */}
      {children({ 
        onCreateForm: handleCreateForm, 
        isCreatingForm 
      })}
    </>
  );
};

export default FormCreator;