// フィルター生成ユーティリティ

export const generateFilterOptions = (question) => {
  switch (question.type) {
    case 'scale':
      return {
        type: 'range',
        options: [
          { label: '5点以上', value: '5+' },
          { label: '4点以上', value: '4+' },
          { label: '3点以上', value: '3+' },
          { label: '2点以下', value: '2-' }
        ]
      };
    
    case 'single_choice':
      return {
        type: 'select',
        options: question.data.labels.map(label => ({
          label,
          value: label
        }))
      };
    
    case 'text':
      return {
        type: 'text',
        placeholder: 'キーワードで検索...'
      };
    
    default:
      return {
        type: 'none',
        options: []
      };
  }
};