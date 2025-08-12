// フィルター生成ユーティリティ

export const generateFilterOptions = (question) => {
  // 質問タイプIDまたは質問タイプ文字列に基づいてフィルター設定を決定
  const questionTypeId = question.typeId || question.question_types_id || question.type_id;
  const questionType = question.type;
  
  // 質問タイプ1,2: テキスト系（短文・長文回答）
  if (questionTypeId === 1 || questionTypeId === 2 || questionType === 'text' || questionType === 'textarea') {
    return {
      type: 'text',
      placeholder: '回答内容で検索...'
    };
  }
  
  // 質問タイプ3,4,5,6,7,8: 選択肢・スケール系
  if ([3, 4, 5, 6, 7, 8].includes(questionTypeId) || 
      ['radio', 'checkbox', 'radio-2col', 'checkbox-2col', 'select', 'scale'].includes(questionType)) {
    
    // スケール（線形スケール）タイプを先に判定
    if (questionTypeId === 8 || questionType === 'scale') {
      // 1-5の数字フィルタリング（均等目盛り）
      return {
        type: 'range',
        options: [
          { label: '5', value: '5' },
          { label: '4', value: '4' },
          { label: '3', value: '3' },
          { label: '2', value: '2' },
          { label: '1', value: '1' }
        ]
      };
    }
    
    // 複数選択可能なタイプ (4, 6 または checkbox系)
    if ([4, 6].includes(questionTypeId) || 
        ['checkbox', 'checkbox-2col'].includes(questionType)) {
      return {
        type: 'multi-select',
        options: question.data?.labels?.map(label => ({
          label,
          value: label
        })) || question.options?.map(option => ({
          label: option.label || option.text,
          value: option.value || option.label || option.text
        })) || []
      };
    }
    
    // 単一選択タイプ (3, 5, 7 または radio系, select)
    return {
      type: 'select',
      options: question.data?.labels?.map(label => ({
        label,
        value: label
      })) || question.options?.map(option => ({
        label: option.label || option.text,
        value: option.value || option.label || option.text
      })) || []
    };
  }
  
  // デフォルト（フィルターなし）
  return {
    type: 'none',
    options: []
  };
};