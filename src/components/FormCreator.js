import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import FormDataService from '../services/FormDataService';

const FormCreator = ({ 
  user, 
  onCreateFormClick, 
  children 
}) => {
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  const handleCreateForm = async () => {
    if (!user) {
      toast.error('ユーザー情報が取得できません');
      return;
    }

    setIsCreatingForm(true);
    try {
      const result = await FormDataService.createNewForm(user.id);
      
      if (result.success) {
        // フォーム作成成功時は通知なし（Dashboard.jsと同じ挙動）
        // フォーム作成画面に遷移（formIdを渡す）
        onCreateFormClick(result.data.reviewFormId);
      } else {
        toast.error(result.error || 'フォームの作成に失敗しました');
      }
    } catch (error) {
      console.error('Form creation error:', error);
      toast.error('フォームの作成中にエラーが発生しました');
    } finally {
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