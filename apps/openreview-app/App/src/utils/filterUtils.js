// フィルター生成ユーティリティ

export const generateFilterOptions = (question) => {
  // 質問タイプIDまたは質問タイプ文字列に基づいてフィルター設定を決定
  const questionTypeId = question.typeId || question.question_types_id || question.type_id;
  const questionType = question.type;
  
  console.log('generateFilterOptions - 質問データ:', {
    id: question.id,
    title: question.title,
    questionTypeId,
    questionType,
    hasDataLabels: !!question.data?.labels,
    dataLabels: question.data?.labels,
    hasOptions: !!question.options,
    options: question.options
  });
  
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
    
    // 線形スケール（質問タイプ 7）の特別処理
    if (questionTypeId === 7) {
      return {
        type: 'choices',
        options: [
          { label: '5', value: '5' },
          { label: '4', value: '4' },
          { label: '3', value: '3' },
          { label: '2', value: '2' },
          { label: '1', value: '1' }
        ]
      };
    }
    
    // プルダウン（質問タイプ 8）の特別処理
    if (questionTypeId === 8 || questionType === 'select') {
      // プルダウンの選択肢は通常の選択肢データと同じ処理
    }
    
    // 選択肢データの取得を改善
    let options = [];
    
    // 1. question.data.labels から取得を試行
    if (question.data?.labels && Array.isArray(question.data.labels) && question.data.labels.length > 0) {
      options = question.data.labels.map(label => ({
        label: String(label),
        value: String(label)
      }));
      console.log('選択肢データを question.data.labels から取得:', options);
    }
    // 2. question.options から取得を試行
    else if (question.options && Array.isArray(question.options) && question.options.length > 0) {
      options = question.options.map(option => ({
        label: option.label || option.text || String(option.value || option),
        value: String(option.value || option.label || option.text || option)
      }));
      console.log('選択肢データを question.options から取得:', options);
    }
    // 3. フォールバック: デフォルト選択肢を生成
    else {
      console.warn('選択肢データが見つからないため、デフォルト選択肢を使用');
      // 質問タイプに基づいたデフォルト選択肢
      if (questionTypeId === 7) {
        // 線形スケールは1-5
        options = [
          { label: '5', value: '5' },
          { label: '4', value: '4' },
          { label: '3', value: '3' },
          { label: '2', value: '2' },
          { label: '1', value: '1' }
        ];
      } else {
        // その他は汎用サンプル
        options = [
          { label: '選択肢1', value: 'option1' },
          { label: '選択肢2', value: 'option2' },
          { label: '選択肢3', value: 'option3' }
        ];
      }
      console.log('デフォルト選択肢を使用:', options);
    }
    
    return {
      type: 'choices',
      options
    };
  }
  
  // デフォルト（フィルターなし）
  console.log('フィルターなしタイプ');
  return {
    type: 'none',
    options: []
  };
};