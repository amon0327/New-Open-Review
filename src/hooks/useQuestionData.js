import { useState, useCallback, useMemo } from 'react';

// 質問データ管理のカスタムフック
const useQuestionData = () => {
  // ページごとの質問データを管理
  const [questionsData, setQuestionsData] = useState({
    // page1: [質問配列],
    // page2: [質問配列],
    // etc...
  });

  // 特定ページの質問を取得
  const getQuestionsForPage = useCallback((pageId) => {
    return questionsData[pageId] || [];
  }, [questionsData]);

  // 特定ページの質問を更新
  const setQuestionsForPage = useCallback((pageId, questions) => {
    setQuestionsData(prev => ({
      ...prev,
      [pageId]: questions
    }));
  }, []);

  // 質問を追加
  const addQuestion = useCallback((pageId, questionData) => {
    const newQuestion = {
      id: Date.now() + Math.random(), // より確実にユニークなIDを生成
      question_types_id: questionData.question_types_id || 1,
      question_text: questionData.question_text || '',
      detail_text: questionData.detail_text || '',
      is_required: questionData.is_required || false,
      choices: questionData.choices || null,
      scale_settings: questionData.scale_settings || null,
      matrix_settings: questionData.matrix_settings || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...questionData
    };

    setQuestionsData(prev => ({
      ...prev,
      [pageId]: [...(prev[pageId] || []), newQuestion]
    }));

    return newQuestion;
  }, []);

  // 質問を更新
  const updateQuestion = useCallback((pageId, questionId, updatedData) => {
    setQuestionsData(prev => ({
      ...prev,
      [pageId]: (prev[pageId] || []).map(question =>
        question.id === questionId
          ? { 
              ...question, 
              ...updatedData, 
              updated_at: new Date().toISOString() 
            }
          : question
      )
    }));
  }, []);

  // 質問を削除
  const deleteQuestion = useCallback((pageId, questionId) => {
    setQuestionsData(prev => ({
      ...prev,
      [pageId]: (prev[pageId] || []).filter(question => question.id !== questionId)
    }));
  }, []);

  // 質問を複製
  const duplicateQuestion = useCallback((pageId, questionId) => {
    const currentQuestions = questionsData[pageId] || [];
    const originalQuestion = currentQuestions.find(q => q.id === questionId);
    
    if (originalQuestion) {
      const duplicatedQuestion = {
        ...originalQuestion,
        id: Date.now() + Math.random(),
        question_text: `${originalQuestion.question_text} (コピー)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setQuestionsData(prev => ({
        ...prev,
        [pageId]: [...currentQuestions, duplicatedQuestion]
      }));

      return duplicatedQuestion;
    }
    return null;
  }, [questionsData]);

  // 質問の順序を変更
  const reorderQuestions = useCallback((pageId, sourceIndex, destinationIndex) => {
    const currentQuestions = questionsData[pageId] || [];
    const reorderedQuestions = Array.from(currentQuestions);
    const [removed] = reorderedQuestions.splice(sourceIndex, 1);
    reorderedQuestions.splice(destinationIndex, 0, removed);

    setQuestionsData(prev => ({
      ...prev,
      [pageId]: reorderedQuestions
    }));
  }, [questionsData]);

  // 全ページの質問数を集計
  const getTotalQuestionsCount = useMemo(() => {
    return Object.values(questionsData).reduce((total, questions) => {
      return total + (questions?.length || 0);
    }, 0);
  }, [questionsData]);

  // ページごとの質問数を取得
  const getQuestionCountForPage = useCallback((pageId) => {
    return (questionsData[pageId] || []).length;
  }, [questionsData]);

  // 必須質問の数を取得
  const getRequiredQuestionsCount = useCallback((pageId) => {
    const questions = questionsData[pageId] || [];
    return questions.filter(q => q.is_required).length;
  }, [questionsData]);

  // 質問タイプ別の統計を取得
  const getQuestionTypeStats = useCallback((pageId) => {
    const questions = questionsData[pageId] || [];
    const stats = {};
    
    questions.forEach(question => {
      const typeId = question.question_types_id;
      stats[typeId] = (stats[typeId] || 0) + 1;
    });

    return stats;
  }, [questionsData]);

  // ページを削除（そのページの全質問も削除）
  const deletePage = useCallback((pageId) => {
    setQuestionsData(prev => {
      const newData = { ...prev };
      delete newData[pageId];
      return newData;
    });
  }, []);

  // ページをコピー（質問も含めて）
  const copyPage = useCallback((sourcePageId, targetPageId) => {
    const sourceQuestions = questionsData[sourcePageId] || [];
    const copiedQuestions = sourceQuestions.map(question => ({
      ...question,
      id: Date.now() + Math.random(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    setQuestionsData(prev => ({
      ...prev,
      [targetPageId]: copiedQuestions
    }));
  }, [questionsData]);

  // データをJSON形式でエクスポート
  const exportData = useCallback(() => {
    return {
      questionsData,
      exportedAt: new Date().toISOString(),
      totalQuestions: getTotalQuestionsCount,
      version: '1.0'
    };
  }, [questionsData, getTotalQuestionsCount]);

  // データをインポート
  const importData = useCallback((importedData) => {
    if (importedData && importedData.questionsData) {
      setQuestionsData(importedData.questionsData);
      return true;
    }
    return false;
  }, []);

  // 全データをクリア
  const clearAllData = useCallback(() => {
    setQuestionsData({});
  }, []);

  // バリデーション関数
  const validateQuestion = useCallback((question) => {
    const errors = [];

    if (!question.question_text?.trim()) {
      errors.push('質問文が入力されていません');
    }

    if (question.question_text && question.question_text.length > 500) {
      errors.push('質問文は500文字以内で入力してください');
    }

    if (question.detail_text && question.detail_text.length > 1000) {
      errors.push('詳細説明は1000文字以内で入力してください');
    }

    // 選択肢が必要な質問タイプのバリデーション
    const needsChoices = [3, 4, 8].includes(question.question_types_id);
    if (needsChoices) {
      try {
        const choices = question.choices ? JSON.parse(question.choices) : [];
        if (choices.length < 2) {
          errors.push('選択肢は2つ以上設定してください');
        }
        if (choices.some(choice => !choice?.trim())) {
          errors.push('空の選択肢があります');
        }
      } catch (e) {
        errors.push('選択肢のデータが不正です');
      }
    }

    // スケール設定のバリデーション
    if (question.question_types_id === 7) {
      try {
        const scaleSettings = question.scale_settings ? JSON.parse(question.scale_settings) : {};
        const minValue = scaleSettings.minValue || 1;
        const maxValue = scaleSettings.maxValue || 5;
        
        if (minValue >= maxValue) {
          errors.push('最大値は最小値より大きく設定してください');
        }
        if (maxValue - minValue > 10) {
          errors.push('スケールの範囲は10以下にしてください');
        }
      } catch (e) {
        errors.push('スケール設定のデータが不正です');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return {
    // データ
    questionsData,
    
    // 基本操作
    getQuestionsForPage,
    setQuestionsForPage,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
    
    // ページ操作
    deletePage,
    copyPage,
    
    // 統計・情報取得
    getTotalQuestionsCount,
    getQuestionCountForPage,
    getRequiredQuestionsCount,
    getQuestionTypeStats,
    
    // データ管理
    exportData,
    importData,
    clearAllData,
    
    // バリデーション
    validateQuestion
  };
};

export default useQuestionData;