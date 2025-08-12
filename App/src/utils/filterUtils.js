// フィルター生成ユーティリティ

export const generateFilterOptions = (question) => {
  // 質問タイプIDまたは質問タイプ文字列に基づいてフィルター設定を決定
  const questionTypeId = question.typeId || question.question_types_id || question.type_id;
  const questionType = question.type;
  
  // 質問タイプ1,2: テキスト系（短文・長文回答） - テキスト検索のみ残す
  if (questionTypeId === 1 || questionTypeId === 2 || questionType === 'text' || questionType === 'textarea') {
    return {
      type: 'text',
      placeholder: '回答内容で検索...'
    };
  }
  
  // すべての選択肢・スケール系を統一フォーマット（choices型）に変更
  if ([3, 4, 5, 6, 7, 8].includes(questionTypeId) || 
      ['radio', 'checkbox', 'radio-2col', 'checkbox-2col', 'select', 'scale'].includes(questionType)) {
    
    // スケール（線形スケール）タイプ - 1-5の選択肢として表示
    if (questionTypeId === 8 || questionType === 'scale') {
      return {
        type: 'choices',
        options: [
          { label: '5点', value: '5' },
          { label: '4点', value: '4' },
          { label: '3点', value: '3' },
          { label: '2点', value: '2' },
          { label: '1点', value: '1' }
        ]
      };
    }
    
    // その他すべての選択肢系 - 統一フォーマット
    const options = question.data?.labels?.map(label => ({
      label,
      value: label
    })) || question.options?.map(option => ({
      label: option.label || option.text,
      value: option.value || option.label || option.text
    })) || [];
    
    return {
      type: 'choices',
      options
    };
  }
  
  // デフォルト（フィルターなし）
  return {
    type: 'none',
    options: []
  };
};