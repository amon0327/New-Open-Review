// フォーム検証用のユーティリティ関数
// エラーと警告の検知ロジックを一元管理

/**
 * フォーム全体の検証を行い、エラーと警告を返す
 * @param {Object} formData - フォームデータ
 * @returns {Object} { errors: Array, warnings: Array }
 */
export const validateForm = (formData) => {
  console.log('🔍 validateForm が呼び出されました');
  const errors = [];
  const warnings = [];
  
  // デバッグ用：受け取ったformDataの内容を確認
  console.log('📋 Validation formData:', formData);
  
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
  
  console.log('Validation data extracted:', {
    projectTitle,
    questionsLength: questions.length,
    pagesLength: pages.length,
    formSettings,
    loginTitle,
    loginDetail,
    completionTitle,
    completionDetail,
    logoImage,
    completionBackground
  });

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

  // 2.5. 各質問ページに最低1つの質問が存在するかチェック
  questionPages.forEach((page, pageIndex) => {
    // review_form_pages_idまたはpageIdフィールドで質問を検索
    const pageQuestions = questions.filter(q => 
      q.review_form_pages_id === page.id ||
      q.pageId === page.id
    );
    
    if (pageQuestions.length === 0) {
      errors.push({
        id: `missing-questions-page-${page.id}`,
        message: `「${page.title || page.name || 'ページ'}」に質問が設定されていません`,
        location: '質問設定',
        action: 'openSettings'
      });
    }
  });

  // 3. 質問が存在するかチェック（全体で最低1つ必要）
  if (questions.length === 0) {
    errors.push({
      id: 'missing-questions',
      message: 'レビューフォームに質問が設定されていません',
      location: '質問設定',
      action: 'openSettings'
    });
  }

  // 4. 各質問の内容検証
  console.log(`Starting validation for ${questions.length} questions`);
  questions.forEach((question, index) => {
    console.log(`Validating question ${index + 1}:`, question);
    
    // 質問テキストの検証（question_textフィールドも確認）
    const questionText = question.question || question.question_text || '';
    if (!questionText || questionText.trim() === '') {
      errors.push({
        id: `missing-question-text-${question.id}`,
        message: `質問${index + 1}のテキストが入力されていません`,
        location: '質問設定',
        action: 'openSettings',
        questionId: question.id
      });
    }

    // 質問タイプIDの取得（複数のフィールドを確認）
    const questionTypeId = question.type || question.type_id || question.question_type_id || question.question_types_id;
    console.log(`Question ${index + 1} type extraction:`, {
      questionType: question.type,
      questionTypeId: question.type_id,
      questionQuestionTypeId: question.question_type_id,
      questionTypesId: question.question_types_id,
      finalQuestionTypeId: questionTypeId,
      typeofFinalId: typeof questionTypeId
    });
    
    // 選択肢がある質問タイプの場合の検証
    const choiceRequiredTypes = [3, 4, 5, 6, 8, 9, 10]; // 単一選択、複数選択、マトリックス、プルダウン等
    
    // 数値型に変換して比較
    const numericQuestionTypeId = parseInt(questionTypeId, 10);
    const isChoiceRequired = choiceRequiredTypes.includes(numericQuestionTypeId);
    
    console.log(`Question ${index + 1} type check:`, {
      questionTypeId,
      numericQuestionTypeId,
      isChoiceRequired,
      choiceRequiredTypes
    });
    
    if (isChoiceRequired) {
      // choicesフィールドを確認（JSON文字列の場合はパース）
      let choices = [];
      
      if (question.choices) {
        if (typeof question.choices === 'string') {
          try {
            choices = JSON.parse(question.choices);
          } catch (e) {
            console.error('Failed to parse choices JSON:', question.choices);
            choices = [];
          }
        } else if (Array.isArray(question.choices)) {
          choices = question.choices;
        }
      } else if (question.options && Array.isArray(question.options)) {
        choices = question.options;
      }
      
      console.log(`Question ${index + 1} choices validation:`, {
        originalChoices: question.choices,
        parsedChoices: choices,
        choicesLength: choices.length,
        questionOptions: question.options
      });
      
      if (!choices || choices.length === 0) {
        console.log(`Adding choice error for question ${index + 1}`);
        errors.push({
          id: `missing-choices-${question.id}`,
          message: `質問${index + 1}の選択肢が設定されていません`,
          location: '質問設定',
          action: 'openSettings',
          questionId: question.id
        });
      } else {
        // 選択肢内容の検証
        choices.forEach((choice, choiceIndex) => {
          // 文字列の場合はそのまま、オブジェクトの場合は各種プロパティを確認
          const choiceText = typeof choice === 'string' ? choice : 
                           (choice.text || choice.choice_text || choice.choice_name || choice.label || '');
          console.log(`Choice ${choiceIndex + 1} validation:`, { choice, choiceText });
          
          if (!choiceText || choiceText.trim() === '') {
            errors.push({
              id: `missing-choice-text-${question.id}-${choiceIndex}`,
              message: `質問${index + 1}の選択肢${choiceIndex + 1}が空です`,
              location: '質問設定',
              action: 'openSettings',
              questionId: question.id
            });
          }
        });
      }
    } else {
      console.log(`Question ${index + 1} does not require choices (type: ${questionTypeId}, numeric: ${numericQuestionTypeId})`);
    }

    // リニアスケールの場合のラベル検証
    if (numericQuestionTypeId === 7) { // リニアスケール
      const minLabel = question.minLabel || question.min_label || question.scale_min_label || '';
      const maxLabel = question.maxLabel || question.max_label || question.scale_max_label || '';
      
      if (!minLabel || minLabel.trim() === '') {
        errors.push({
          id: `missing-min-label-${question.id}`,
          message: `質問${index + 1}の最小値ラベルが設定されていません`,
          location: '質問設定',
          action: 'openSettings',
          questionId: question.id
        });
      }
      if (!maxLabel || maxLabel.trim() === '') {
        errors.push({
          id: `missing-max-label-${question.id}`,
          message: `質問${index + 1}の最大値ラベルが設定されていません`,
          location: '質問設定',
          action: 'openSettings',
          questionId: question.id
        });
      }
    }

  });

  // 5. テーマカラーの検証（Supabaseに保存されていればOK）
  const hasCustomThemeColor = formSettings.themeColor && formSettings.themeColor !== '#5e17eb';
  if (!hasCustomThemeColor) {
    console.log('Theme color validation:', { formSettings, hasCustomThemeColor });
    // デフォルト値の場合はエラーとしない（警告のみ）
  }

  // 6. ロゴ画像の検証（Supabaseに保存されていればOK）
  const hasCustomLogo = logoImage && logoImage !== null;
  const hasHeaderLogo = headerImage?.logo && headerImage.logo !== null;
  if (!hasCustomLogo && !hasHeaderLogo) {
    console.log('Logo validation:', { logoImage, headerImage, hasCustomLogo, hasHeaderLogo });
    // デフォルト値の場合はエラーとしない（警告のみ）
  }

  // 7. ログイン画面の背景画像検証（Supabaseに保存されていればOK）
  const hasLoginBackground = loginScreenSettings.backgroundImage && loginScreenSettings.backgroundImage !== null;
  if (!hasLoginBackground) {
    console.log('Login background validation:', { loginScreenSettings, hasLoginBackground });
    // デフォルト値の場合はエラーとしない（警告のみ）
  }

  // 8. 完了画面の背景画像検証（Supabaseに保存されていればOK）
  const hasCompletionBackground = (completionBackground && completionBackground !== null) || 
                                  (completionScreenSettings.backgroundImage && completionScreenSettings.backgroundImage !== null);
  if (!hasCompletionBackground) {
    console.log('Completion background validation:', { completionBackground, completionScreenSettings, hasCompletionBackground });
    // デフォルト値の場合はエラーとしない（警告のみ）
  }

  // 9. ログイン画面のテキスト検証
  const hasLoginTitle = (loginTitle && loginTitle.trim() !== '') || 
                       (loginScreenSettings.title_text && loginScreenSettings.title_text.trim() !== '');
  const hasLoginDetail = (loginDetail && loginDetail.trim() !== '') || 
                        (loginScreenSettings.detail_text && loginScreenSettings.detail_text.trim() !== '');
  
  console.log('Login text validation:', { 
    loginTitle, 
    loginDetail, 
    loginScreenSettings, 
    hasLoginTitle, 
    hasLoginDetail 
  });
  
  if (!hasLoginTitle) {
    errors.push({
      id: 'missing-login-title',
      message: 'ログイン画面のタイトルテキストが入力されていません',
      location: 'ログイン画面設定',
      action: 'openLoginSettings'
    });
  }

  if (!hasLoginDetail) {
    errors.push({
      id: 'missing-login-detail',
      message: 'ログイン画面の詳細テキストが入力されていません',
      location: 'ログイン画面設定',
      action: 'openLoginSettings'
    });
  }

  // 10. 完了画面のテキスト検証
  const hasCompletionTitle = (completionTitle && completionTitle.trim() !== '') || 
                            (completionScreenSettings.title_text && completionScreenSettings.title_text.trim() !== '');
  const hasCompletionDetail = (completionDetail && completionDetail.trim() !== '') || 
                             (completionScreenSettings.detail_text && completionScreenSettings.detail_text.trim() !== '');

  console.log('Completion text validation:', { 
    completionTitle, 
    completionDetail, 
    completionScreenSettings, 
    hasCompletionTitle, 
    hasCompletionDetail 
  });

  if (!hasCompletionTitle) {
    errors.push({
      id: 'missing-completion-title',
      message: '完了画面のタイトルテキストが入力されていません',
      location: '完了画面設定',
      action: 'openCompletionSettings'
    });
  }

  if (!hasCompletionDetail) {
    errors.push({
      id: 'missing-completion-detail',
      message: '完了画面の詳細テキストが入力されていません',
      location: '完了画面設定',
      action: 'openCompletionSettings'
    });
  }

  // 11. 完了画面のボタン設定検証
  if (completionScreenSettings?.showButton) {
    if (!completionScreenSettings.buttonText || completionScreenSettings.buttonText.trim() === '') {
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



  console.log('🏁 検証完了:', {
    errorCount: errors.length,
    warningCount: warnings.length,
    errors: errors.map(e => ({ id: e.id, message: e.message })),
    warnings: warnings.map(w => ({ id: w.id, message: w.message }))
  });
  
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