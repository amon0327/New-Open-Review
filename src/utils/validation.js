// フォーム検証用のユーティリティ関数
// エラーと警告の検知ロジックを一元管理

/**
 * フォーム全体の検証を行い、エラーと警告を返す
 * @param {Object} formData - フォームデータ
 * @returns {Object} { errors: Array, warnings: Array }
 */
export const validateForm = (formData) => {
  const errors = [];
  const warnings = [];
  
  const {
    projectTitle,
    questions = [],
    pages = [],
    formSettings = {},
    loginScreenSettings = {},
    completionScreenSettings = {},
    loginTitle,
    loginDetail,
    completionTitle,
    completionDetail,
    logoImage,
    headerImage,
    completionBackground
  } = formData;

  // ===== エラー検証 (必須項目) =====
  
  // 1. プロジェクト名の検証
  if (!projectTitle || projectTitle.trim() === '' || projectTitle === 'OpenReview フォーム') {
    errors.push({
      id: 'missing-project-title',
      message: 'プロジェクト名が設定されていません',
      location: 'プロジェクト設定',
      action: 'openSettings'
    });
  }

  // 2. 質問ページの存在確認
  const questionPages = pages.filter(page => page.type === 'question');
  if (questionPages.length === 0) {
    errors.push({
      id: 'missing-question-page',
      message: '質問ページが1つ以上必要です',
      location: '質問設定',
      action: 'openSettings'
    });
  }

  // 3. 各質問ページに質問が存在するかチェック
  questionPages.forEach((page, pageIndex) => {
    const pageQuestions = questions.filter(q => q.pageId === page.id);
    if (pageQuestions.length === 0) {
      errors.push({
        id: `missing-questions-page-${page.id}`,
        message: `${page.title}に質問が設定されていません`,
        location: '質問設定',
        action: 'openSettings'
      });
    }
  });

  // 4. 各質問の内容検証
  questions.forEach((question, index) => {
    // 質問テキストの検証
    if (!question.question || question.question.trim() === '') {
      errors.push({
        id: `missing-question-text-${question.id}`,
        message: `質問${index + 1}のテキストが入力されていません`,
        location: '質問設定',
        action: 'openSettings'
      });
    }

    // 選択肢がある質問タイプの場合の検証
    const choiceRequiredTypes = [3, 4, 5, 6, 8, 9, 10]; // 単一選択、複数選択、マトリックス、プルダウン等
    if (choiceRequiredTypes.includes(question.type)) {
      if (!question.choices || question.choices.length === 0) {
        errors.push({
          id: `missing-choices-${question.id}`,
          message: `質問${index + 1}の選択肢が設定されていません`,
          location: '質問設定',
          action: 'openSettings'
        });
      } else {
        // 選択肢内容の検証
        question.choices.forEach((choice, choiceIndex) => {
          if (!choice.text || choice.text.trim() === '') {
            errors.push({
              id: `missing-choice-text-${question.id}-${choiceIndex}`,
              message: `質問${index + 1}の選択肢${choiceIndex + 1}が空です`,
              location: '質問設定',
              action: 'openSettings'
            });
          }
        });
      }
    }

    // リニアスケールの場合のラベル検証
    if (question.type === 7) { // リニアスケール
      if (!question.minLabel || question.minLabel.trim() === '') {
        errors.push({
          id: `missing-min-label-${question.id}`,
          message: `質問${index + 1}の最小値ラベルが設定されていません`,
          location: '質問設定',
          action: 'openSettings'
        });
      }
      if (!question.maxLabel || question.maxLabel.trim() === '') {
        errors.push({
          id: `missing-max-label-${question.id}`,
          message: `質問${index + 1}の最大値ラベルが設定されていません`,
          location: '質問設定',
          action: 'openSettings'
        });
      }
    }

    // マトリックス質問の行ラベル検証
    const matrixTypes = [5, 6]; // マトリックス質問
    if (matrixTypes.includes(question.type)) {
      if (!question.rows || question.rows.length === 0) {
        errors.push({
          id: `missing-matrix-rows-${question.id}`,
          message: `質問${index + 1}の行ラベルが設定されていません`,
          location: '質問設定',
          action: 'openSettings'
        });
      } else {
        question.rows.forEach((row, rowIndex) => {
          if (!row.text || row.text.trim() === '') {
            errors.push({
              id: `missing-matrix-row-${question.id}-${rowIndex}`,
              message: `質問${index + 1}の行ラベル${rowIndex + 1}が空です`,
              location: '質問設定',
              action: 'openSettings'
            });
          }
        });
      }
    }
  });

  // 5. テーマカラーの検証（デフォルト値の場合はエラーではなく警告）
  // エラーとしては扱わない - デフォルト値でも動作する

  // 6. ロゴ画像の検証（デフォルト値でも動作するため警告のみ）
  // エラーとしては扱わない

  // 7. ログイン画面の背景画像検証（デフォルト値でも動作するため警告のみ）
  // エラーとしては扱わない

  // 8. 完了画面の背景画像検証（デフォルト値でも動作するため警告のみ）
  // エラーとしては扱わない

  // 9. ログイン画面のテキスト検証（デフォルトでも動作するため警告のみ）
  // エラーとしては扱わない

  // 10. 完了画面のテキスト検証（デフォルトでも動作するため警告のみ）
  // エラーとしては扱わない

  // 11. 完了画面のボタン設定検証
  if (completionScreenSettings?.showButton) {
    if (!completionScreenSettings.buttonText || completionScreenSettings.buttonText.trim() === '' || completionScreenSettings.buttonText === 'テキストを入力...') {
      errors.push({
        id: 'missing-completion-button-text',
        message: '完了画面のボタンテキストが入力されていません',
        location: '完了画面設定',
        action: 'openCompletionSettings'
      });
    }

    if (!completionScreenSettings.buttonUrl || completionScreenSettings.buttonUrl.trim() === '') {
      errors.push({
        id: 'missing-completion-button-url',
        message: '完了画面のボタンURLが入力されていません',
        location: '完了画面設定',
        action: 'openCompletionSettings'
      });
    }
  }

  // ===== 警告検証 (デフォルト値使用) =====

  // ロゴがデフォルトの場合
  if (!logoImage) {
    warnings.push({
      id: 'default-logo',
      message: 'デフォルトのロゴが使用されています',
      location: 'デザイン設定',
      action: 'openDesignSettings'
    });
  }

  // テーマカラーがデフォルトの場合
  if (!formSettings.themeColor || formSettings.themeColor === '#5e17eb') {
    warnings.push({
      id: 'default-theme-color',
      message: 'デフォルトのテーマカラーが使用されています',
      location: 'デザイン設定',
      action: 'openDesignSettings'
    });
  }

  // ログイン画面の背景がデフォルトの場合
  if (!loginScreenSettings.backgroundImage) {
    warnings.push({
      id: 'default-login-background',
      message: 'デフォルトのログイン画面背景が使用されています',
      location: 'ログイン画面設定',
      action: 'openLoginSettings'
    });
  }

  // 完了画面の背景がデフォルトの場合
  if (!completionBackground && !completionScreenSettings.backgroundImage) {
    warnings.push({
      id: 'default-completion-background',
      message: 'デフォルトの完了画面背景が使用されています',
      location: '完了画面設定',
      action: 'openCompletionSettings'
    });
  }

  // ログイン画面のテキストがデフォルトの場合
  if (!loginTitle || loginTitle === 'ログイン' || loginTitle === 'テキストを入力...') {
    warnings.push({
      id: 'default-login-title',
      message: 'デフォルトのログイン画面タイトルが使用されています',
      location: 'ログイン画面設定',
      action: 'openLoginSettings'
    });
  }

  if (!loginDetail || loginDetail === 'アンケートにご協力いただき、ありがとうございます。' || loginDetail === 'テキストを入力...') {
    warnings.push({
      id: 'default-login-detail',
      message: 'デフォルトのログイン画面詳細テキストが使用されています',
      location: 'ログイン画面設定',
      action: 'openLoginSettings'
    });
  }

  // 完了画面のテキストがデフォルトの場合
  if (!completionTitle || completionTitle === '完了' || completionTitle === 'テキストを入力...') {
    warnings.push({
      id: 'default-completion-title',
      message: 'デフォルトの完了画面タイトルが使用されています',
      location: '完了画面設定',
      action: 'openCompletionSettings'
    });
  }

  if (!completionDetail || completionDetail === 'アンケートにご協力いただき、ありがとうございました。' || completionDetail === 'テキストを入力...') {
    warnings.push({
      id: 'default-completion-detail',
      message: 'デフォルトの完了画面詳細テキストが使用されています',
      location: '完了画面設定',
      action: 'openCompletionSettings'
    });
  }

  return { errors, warnings };
};

/**
 * 特定の質問の検証を行う
 * @param {Object} question - 質問データ
 * @param {number} index - 質問のインデックス
 * @returns {Array} エラーリスト
 */
export const validateQuestion = (question, index) => {
  const errors = [];

  // 質問テキストの検証
  if (!question.question || question.question.trim() === '') {
    errors.push({
      id: `missing-question-text-${question.id}`,
      message: `質問${index + 1}のテキストが入力されていません`,
      location: '質問設定',
      action: 'openSettings'
    });
  }

  // 選択肢がある質問タイプの場合の検証
  const choiceRequiredTypes = [3, 4, 5, 6, 8, 9, 10];
  if (choiceRequiredTypes.includes(question.type)) {
    if (!question.choices || question.choices.length === 0) {
      errors.push({
        id: `missing-choices-${question.id}`,
        message: `質問${index + 1}の選択肢が設定されていません`,
        location: '質問設定',
        action: 'openSettings'
      });
    }
  }

  // リニアスケールの場合のラベル検証
  if (question.type === 7) {
    if (!question.minLabel || question.minLabel.trim() === '') {
      errors.push({
        id: `missing-min-label-${question.id}`,
        message: `質問${index + 1}の最小値ラベルが設定されていません`,
        location: '質問設定',
        action: 'openSettings'
      });
    }
    if (!question.maxLabel || question.maxLabel.trim() === '') {
      errors.push({
        id: `missing-max-label-${question.id}`,
        message: `質問${index + 1}の最大値ラベルが設定されていません`,
        location: '質問設定',
        action: 'openSettings'
      });
    }
  }

  return errors;
};