// データフィルタリングユーティリティ

/**
 * テキストフィルターを適用（部分一致検索）
 * @param {Array} data - フィルター対象のデータ配列
 * @param {string} searchText - 検索テキスト
 * @param {string} targetField - 検索対象のフィールド名
 * @returns {Array} フィルター済みデータ
 */
export const applyTextFilter = (data, searchText, targetField = 'text') => {
  if (!searchText || searchText.trim() === '') {
    return data;
  }

  const normalizedSearch = searchText.toLowerCase().trim();
  
  return data.filter(item => {
    const fieldValue = item[targetField];
    if (!fieldValue && fieldValue !== 0) return false; // 0の値も含める
    
    // 数値の場合は文字列に変換
    if (typeof fieldValue === 'number') {
      return String(fieldValue).includes(normalizedSearch);
    }
    
    // 文字列の場合は直接検索
    if (typeof fieldValue === 'string') {
      return fieldValue.toLowerCase().includes(normalizedSearch);
    }
    
    // 配列の場合は各要素を検索
    if (Array.isArray(fieldValue)) {
      return fieldValue.some(val => 
        String(val).toLowerCase().includes(normalizedSearch)
      );
    }
    
    // その他の型は文字列に変換して検索
    return String(fieldValue).toLowerCase().includes(normalizedSearch);
  });
};

/**
 * 選択肢フィルターを適用（完全一致での絞り込み）
 * @param {Array} data - フィルター対象のデータ配列
 * @param {string} selectedValue - 選択された値
 * @param {string} targetField - フィルター対象のフィールド名
 * @returns {Array} フィルター済みデータ
 */
export const applySelectFilter = (data, selectedValue, targetField = 'category') => {
  if (!selectedValue || selectedValue === '') {
    return data;
  }

  return data.filter(item => {
    const fieldValue = item[targetField];
    if (!fieldValue) return false;
    
    // 配列の場合は選択値が含まれているかチェック
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(selectedValue);
    }
    
    // 文字列の場合は完全一致
    return String(fieldValue) === String(selectedValue);
  });
};

/**
 * 範囲フィルターを適用（数値範囲での絞り込み）
 * @param {Array} data - フィルター対象のデータ配列
 * @param {string} rangeValue - 範囲条件（例: "5+", "4+", "2-"）
 * @param {string} targetField - フィルター対象のフィールド名
 * @returns {Array} フィルター済みデータ
 */
export const applyRangeFilter = (data, rangeValue, targetField = 'value') => {
  if (!rangeValue) {
    return data;
  }

  return data.filter(item => {
    let fieldValue = item[targetField];
    
    // 数値への変換処理を改善
    if (typeof fieldValue === 'string') {
      // "サラダ" や "1 (最小)" のような文字列から数値を抽出
      const numMatch = fieldValue.match(/^(\d+)/);
      if (numMatch) {
        fieldValue = parseFloat(numMatch[1]);
      } else {
        fieldValue = parseFloat(fieldValue);
      }
    } else {
      fieldValue = parseFloat(fieldValue);
    }
    
    if (isNaN(fieldValue)) return false;

    // 範囲条件の解析
    if (rangeValue.includes('+')) {
      // "5+" の場合は5以上
      const minValue = parseFloat(rangeValue.replace('+', ''));
      return fieldValue >= minValue;
    } else if (rangeValue.includes('-')) {
      // "2-" の場合は2以下
      const maxValue = parseFloat(rangeValue.replace('-', ''));
      return fieldValue <= maxValue;
    } else if (rangeValue.includes('~')) {
      // "3~5" の場合は3以上5以下
      const [min, max] = rangeValue.split('~').map(v => parseFloat(v.trim()));
      return fieldValue >= min && fieldValue <= max;
    } else {
      // 完全一致
      const exactValue = parseFloat(rangeValue);
      return fieldValue === exactValue;
    }
  });
};

/**
 * 複数選択フィルターを適用（選択された複数値のいずれかに一致する項目を抽出）
 * @param {Array} data - フィルター対象のデータ配列
 * @param {Array} selectedValues - 選択された値の配列
 * @param {string} targetField - フィルター対象のフィールド名
 * @returns {Array} フィルター済みデータ
 */
export const applyMultiSelectFilter = (data, selectedValues, targetField = 'selected_choices') => {
  if (!selectedValues || !Array.isArray(selectedValues) || selectedValues.length === 0) {
    return data;
  }

  return data.filter(item => {
    const fieldValue = item[targetField];
    if (!fieldValue) return false;
    
    // 配列の場合は選択値のいずれかが含まれているかチェック
    if (Array.isArray(fieldValue)) {
      return selectedValues.some(selectedValue => 
        fieldValue.some(val => String(val) === String(selectedValue))
      );
    }
    
    // 単一値の場合は選択値のいずれかと一致するかチェック
    return selectedValues.some(selectedValue => 
      String(fieldValue) === String(selectedValue)
    );
  });
};

/**
 * 統一された選択肢フィルターを適用（数値・文字列・配列すべて対応）
 * @param {Array} data - フィルター対象のデータ配列
 * @param {Array|string} selectedValues - 選択された値（配列または単一値）
 * @param {string} targetField - フィルター対象のフィールド名
 * @returns {Array} フィルター済みデータ
 */
export const applyChoicesFilter = (data, selectedValues, targetField = 'selected_choice') => {
  // 選択値がない場合はフィルターしない
  if (!selectedValues) return data;
  
  // 単一値を配列に変換して統一処理
  const valuesArray = Array.isArray(selectedValues) ? selectedValues : [selectedValues];
  if (valuesArray.length === 0) return data;

  return data.filter(item => {
    const fieldValue = item[targetField];
    if (fieldValue === null || fieldValue === undefined) return false;
    
    // 数値の場合（スケール値など）
    if (typeof fieldValue === 'number' || (!isNaN(fieldValue) && !isNaN(parseFloat(fieldValue)))) {
      return valuesArray.some(selectedValue => {
        const numValue = typeof fieldValue === 'number' ? fieldValue : parseFloat(fieldValue);
        let selectedNum;
        if (typeof selectedValue === 'number') {
          selectedNum = selectedValue;
        } else if (typeof selectedValue === 'string') {
          // "サラダ" や "1 (最小)" のような文字列から数値を抽出
          const numMatch = selectedValue.match(/^(\d+)/);
          selectedNum = numMatch ? parseFloat(numMatch[1]) : parseFloat(selectedValue);
        } else {
          selectedNum = parseFloat(selectedValue);
        }
        return !isNaN(numValue) && !isNaN(selectedNum) && numValue === selectedNum;
      });
    }
    
    // 配列の場合（複数選択回答など）
    if (Array.isArray(fieldValue)) {
      return valuesArray.some(selectedValue => 
        fieldValue.some(val => {
          // 文字列の部分一致もサポート
          if (typeof val === 'string' && typeof selectedValue === 'string') {
            return val.includes(selectedValue) || selectedValue.includes(val) || val === selectedValue;
          }
          return String(val) === String(selectedValue);
        })
      );
    }
    
    // 文字列の場合（単一選択回答など）
    return valuesArray.some(selectedValue => {
      // 文字列の部分一致もサポート
      if (typeof fieldValue === 'string' && typeof selectedValue === 'string') {
        return fieldValue.includes(selectedValue) || selectedValue.includes(fieldValue) || fieldValue === selectedValue;
      }
      return String(fieldValue) === String(selectedValue);
    });
  });
};

/**
 * 複数のフィルターを組み合わせて適用
 * @param {Array} originalData - 元のデータ配列
 * @param {Object} filters - フィルター条件オブジェクト
 * @param {Object} question - 質問オブジェクト（フィルター設定用）
 * @returns {Array} フィルター済みデータ
 */
export const applyCombinedFilters = (originalData, filters, question) => {
  if (!filters || Object.keys(filters).length === 0) {
    return originalData;
  }

  let filteredData = [...originalData];

  // 各フィルター条件を順次適用
  Object.entries(filters).forEach(([questionId, filterConfig]) => {
    if (questionId !== question.id) return;

    const { type, value } = filterConfig;
    if (!value) return;

    switch (type) {
      case 'text':
        // テキスト検索（回答内容で検索）
        filteredData = applyTextFilter(filteredData, value, 'answer');
        break;

      case 'select':
        // 選択肢フィルター（回答値で絞り込み）
        filteredData = applySelectFilter(filteredData, value, 'answer');
        break;

      case 'multi-select':
        // 複数選択フィルター（選択された複数値のいずれかで絞り込み）
        filteredData = applyMultiSelectFilter(filteredData, value, 'answer');
        break;

      case 'choices':
        // 統一された選択肢フィルター（複数選択・数値・文字列すべて対応）
        filteredData = applyChoicesFilter(filteredData, value, 'answer');
        break;

      case 'range':
        // 範囲フィルター（スケール値で絞り込み）
        filteredData = applyRangeFilter(filteredData, value, 'answer');
        break;

      default:
        break;
    }
  });

  return filteredData;
};

/**
 * フィルター結果の統計情報を計算
 * @param {Array} originalData - 元のデータ
 * @param {Array} filteredData - フィルター後のデータ
 * @returns {Object} 統計情報
 */
export const calculateFilterStats = (originalData, filteredData) => {
  const totalCount = originalData.length;
  const filteredCount = filteredData.length;
  const filterRatio = totalCount > 0 ? (filteredCount / totalCount) * 100 : 0;

  return {
    totalCount,
    filteredCount,
    filterRatio: Math.round(filterRatio * 10) / 10, // 小数点第1位まで
    isFiltered: filteredCount !== totalCount
  };
};

/**
 * フィルター条件のテキスト表示を生成
 * @param {Object} filters - フィルター条件
 * @param {Array} questions - 質問配列
 * @returns {string} フィルター条件の説明文
 */
export const generateFilterDescription = (filters, questions) => {
  if (!filters || Object.keys(filters).length === 0) {
    return 'フィルターなし';
  }

  const descriptions = [];

  Object.entries(filters).forEach(([questionId, filterConfig]) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const { type, value } = filterConfig;
    if (!value) return;

    let desc = '';
    switch (type) {
      case 'text':
        desc = `"${value}"を含む回答`;
        break;
      case 'select':
        desc = `"${value}"を選択`;
        break;
      case 'multi-select':
        if (Array.isArray(value)) {
          if (value.length === 1) {
            desc = `"${value[0]}"を選択`;
          } else if (value.length <= 3) {
            desc = `"${value.join('", "')}"のいずれかを選択`;
          } else {
            desc = `${value.length}個の選択肢で絞り込み`;
          }
        } else {
          desc = `"${value}"を選択`;
        }
        break;
      case 'choices':
        if (Array.isArray(value)) {
          if (value.length === 1) {
            desc = `"${value[0]}"を選択`;
          } else if (value.length <= 3) {
            desc = `"${value.join('", "')}"を選択`;
          } else {
            desc = `${value.length}個を選択`;
          }
        } else {
          desc = `"${value}"を選択`;
        }
        break;
      case 'range':
        if (value.includes('+')) {
          desc = `${value.replace('+', '')}点以上`;
        } else if (value.includes('-')) {
          desc = `${value.replace('-', '')}点以下`;
        } else {
          desc = `${value}点`;
        }
        break;
      default:
        desc = value;
    }

    descriptions.push(desc);
  });

  return descriptions.join(', ');
};