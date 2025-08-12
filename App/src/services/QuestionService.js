import { supabase } from '../supabaseClient';
import { getDatabaseConfig, TABLE_NAMES } from '../config/databaseConfig';

// 排他制御用のマップ（質問IDごとにロックを管理）
const choiceUpdateLocks = new Map();

// 排他制御ヘルパー関数
const acquireChoiceUpdateLock = async (questionId) => {
  while (choiceUpdateLocks.get(questionId)) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  choiceUpdateLocks.set(questionId, true);
};

const releaseChoiceUpdateLock = (questionId) => {
  choiceUpdateLocks.delete(questionId);
};

// review_questionsテーブルに質問を登録する関数
export const createReviewQuestion = async ({
  reviewFormId,
  questionTypesId,
  reviewFormPagesId,
  questionNumber
}) => {
  try {
    const { data, error } = await supabase
      .from('review_questions')
      .insert({
        review_fome_id: reviewFormId,
        question_types_id: questionTypesId,
        review_form_pages_id: reviewFormPagesId,
        question_number: questionNumber,
        question_text: '',
        is_required: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating review question:', error);
    throw error;
  }
};

// question_option_linear_scaleテーブルにリニアスケールオプションを登録する関数
export const createLinearScaleOption = async (reviewQuestionsId) => {
  try {
    const { data, error } = await supabase
      .from('question_option_linear_scale')
      .insert({
        review_questions_id: reviewQuestionsId,
        min_text: '',
        max_text: ''
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating linear scale option:', error);
    throw error;
  }
};

// テンプレート質問用のreview_questions登録関数
export const createTemplateReviewQuestion = async ({
  reviewFormId,
  questionTypesId,
  reviewFormPagesId,
  questionNumber,
  questionText,
  questionCategoriesId,
  questionSubcategoriesId,
  templateReviewQuestionsId
}) => {
  try {
    const { data, error } = await supabase
      .from('review_questions')
      .insert({
        review_fome_id: reviewFormId,
        question_types_id: questionTypesId,
        review_form_pages_id: reviewFormPagesId,
        question_number: questionNumber,
        question_text: questionText,
        question_categories_id: questionCategoriesId,
        question_subcategories_id: questionSubcategoriesId,
        template_review_questions_id: templateReviewQuestionsId,
        is_required: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating template review question:', error);
    throw error;
  }
};

// テンプレート質問のリニアスケールオプションを取得する関数
export const getTemplateLinearScaleOption = async (templateReviewQuestionsId) => {
  try {
    const { data, error } = await supabase
      .from('template_question_option_linear_scale')
      .select('*')
      .eq('template_review_questions_id', templateReviewQuestionsId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // データが存在しない場合
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching template linear scale option:', error);
    return null;
  }
};

// テンプレート質問の選択肢オプションを取得する関数
export const getTemplateChoiceOptions = async (templateReviewQuestionsId) => {
  try {
    const { data, error } = await supabase
      .from('template_question_option_choices')
      .select('*')
      .eq('template_review_questions_id', templateReviewQuestionsId)
      .order('choice_number');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching template choice options:', error);
    return [];
  }
};

// テンプレート質問のリニアスケールオプションをコピーして作成する関数
export const createLinearScaleOptionFromTemplate = async (reviewQuestionsId, templateOption) => {
  try {
    const { data, error } = await supabase
      .from('question_option_linear_scale')
      .insert({
        review_questions_id: reviewQuestionsId,
        min_text: templateOption.min_text,
        max_text: templateOption.max_text
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating linear scale option from template:', error);
    throw error;
  }
};

// テンプレート質問の選択肢オプションをコピーして作成する関数
export const createChoiceOptionsFromTemplate = async (reviewQuestionsId, templateOptions) => {
  try {
    const choiceInserts = templateOptions.map(option => ({
      review_questions_id: reviewQuestionsId,
      choice_number: option.choice_number,
      choice_name: option.choice_name
    }));

    const { data, error } = await supabase
      .from('question_option_choices')
      .insert(choiceInserts)
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating choice options from template:', error);
    throw error;
  }
};

// テンプレート質問とそのオプションを作成する統合関数
export const createTemplateQuestionWithOptions = async ({
  reviewFormId,
  questionTypesId,
  reviewFormPagesId,
  questionNumber,
  questionText,
  questionCategoriesId,
  questionSubcategoriesId,
  templateReviewQuestionsId
}) => {
  try {
    // 1. review_questionsテーブルにテンプレート質問を登録
    const question = await createTemplateReviewQuestion({
      reviewFormId,
      questionTypesId,
      reviewFormPagesId,
      questionNumber,
      questionText,
      questionCategoriesId,
      questionSubcategoriesId,
      templateReviewQuestionsId
    });

    // 2. 質問タイプに応じてオプションをコピー
    if (questionTypesId === 7) {
      // リニアスケールオプションを取得してコピー
      const templateLinearOption = await getTemplateLinearScaleOption(templateReviewQuestionsId);
      if (templateLinearOption) {
        await createLinearScaleOptionFromTemplate(question.id, templateLinearOption);
      }
    } else if ([3, 4, 5, 6, 8, 9, 10].includes(questionTypesId)) {
      // 選択肢オプションを取得してコピー
      const templateChoiceOptions = await getTemplateChoiceOptions(templateReviewQuestionsId);
      if (templateChoiceOptions.length > 0) {
        await createChoiceOptionsFromTemplate(question.id, templateChoiceOptions);
      }
    }

    return question;
  } catch (error) {
    console.error('Error creating template question with options:', error);
    throw error;
  }
};

// 質問タイプに応じて質問を作成し、必要に応じて追加オプションも作成する関数
export const createQuestionWithOptions = async ({
  reviewFormId,
  questionTypesId,
  reviewFormPagesId,
  questionNumber
}) => {
  try {
    // 1. review_questionsテーブルに質問を登録
    const question = await createReviewQuestion({
      reviewFormId,
      questionTypesId,
      reviewFormPagesId,
      questionNumber
    });

    // 2. 質問タイプが7（リニアスケール）の場合、追加オプションを作成
    if (questionTypesId === 7) {
      await createLinearScaleOption(question.id);
    }
    // 3. 選択肢が必要な質問タイプの場合、デフォルト選択肢を作成
    else if ([3, 4, 5, 6, 8, 9, 10].includes(questionTypesId)) {
      const defaultChoices = ['選択肢1'];
      console.log(`Creating default choice for question type ${questionTypesId}:`, defaultChoices);
      await updateChoiceOptions(question.id, defaultChoices);
    }

    return question;
  } catch (error) {
    console.error('Error creating question with options:', error);
    throw error;
  }
};

// レビューフォームの質問一覧を取得する関数
export const getReviewQuestions = async (reviewFormId, reviewFormPagesId) => {
  try {
    const { data, error } = await supabase
      .from('review_questions')
      .select('*')
      .eq('review_fome_id', reviewFormId)
      .eq('review_form_pages_id', reviewFormPagesId)
      .order('question_number');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching review questions:', error);
    return [];
  }
};

// 質問のリニアスケールオプションを取得する関数
export const getQuestionLinearScaleOption = async (reviewQuestionsId) => {
  try {
    const { data, error } = await supabase
      .from('question_option_linear_scale')
      .select('*')
      .eq('review_questions_id', reviewQuestionsId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // データが存在しない場合
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching question linear scale option:', error);
    return null;
  }
};

// 質問の選択肢オプションを取得する関数
export const getQuestionChoiceOptions = async (reviewQuestionsId) => {
  try {
    const { data, error } = await supabase
      .from('question_option_choices')
      .select('*')
      .eq('review_questions_id', reviewQuestionsId)
      .order('choice_number');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching question choice options:', error);
    return [];
  }
};

// question_screen_settingsテーブルからヘッダー画像を取得する関数
export const getQuestionScreenSettings = async (reviewFormId) => {
  try {
    const { data, error } = await supabase
      .from('question_screen_settings')
      .select('*')
      .eq('review_forms_id', reviewFormId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // データが存在しない場合
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching question screen settings:', error);
    return null;
  }
};

// review_form_settingsテーブルからロゴ画像とテーマカラーを取得する関数
export const getReviewFormSettings = async (reviewFormId) => {
  try {
    const { data, error } = await supabase
      .from('review_form_settings')
      .select('*')
      .eq('review_form_id', reviewFormId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // データが存在しない場合
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching review form settings:', error);
    return null;
  }
};

// 質問ページで必要な設定データをまとめて取得する関数
export const getQuestionPageSettings = async (reviewFormId) => {
  try {
    const [questionScreenSettings, reviewFormSettings] = await Promise.all([
      getQuestionScreenSettings(reviewFormId),
      getReviewFormSettings(reviewFormId)
    ]);

    return {
      questionScreenSettings,
      reviewFormSettings
    };
  } catch (error) {
    console.error('Error fetching question page settings:', error);
    return {
      questionScreenSettings: null,
      reviewFormSettings: null
    };
  }
};

// 質問を更新する関数
export const updateReviewQuestion = async (questionId, updates) => {
  try {
    const { data, error } = await supabase
      .from('review_questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating review question:', error);
    throw error;
  }
};

// 質問を削除する関数
export const deleteReviewQuestion = async (questionId) => {
  try {
    // 1. 関連する選択肢オプションを削除
    await supabase
      .from('question_option_choices')
      .delete()
      .eq('review_questions_id', questionId);

    // 2. 関連するリニアスケールオプションを削除
    await supabase
      .from('question_option_linear_scale')
      .delete()
      .eq('review_questions_id', questionId);

    // 3. 質問本体を削除
    const { error } = await supabase
      .from('review_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting review question:', error);
    throw error;
  }
};

// 選択肢オプションを更新する関数（既存行を更新、新規行は追加、不要行は削除）
export const updateChoiceOptions = async (reviewQuestionsId, choices) => {
  // 排他制御でロックを取得
  await acquireChoiceUpdateLock(reviewQuestionsId);
  
  try {
    console.log(`Updating choices for question ${reviewQuestionsId}:`, choices);
    
    // 1. 既存の選択肢を取得
    const existingChoices = await getQuestionChoiceOptions(reviewQuestionsId);
    console.log('Existing choices:', existingChoices);

    // 2. 変更が必要かチェック（不要な処理を避ける）
    const hasChanges = choices && choices.length > 0 && 
      (existingChoices.length !== choices.length ||
       existingChoices.some((existing, index) => 
         existing.choice_name !== choices[index] || existing.choice_number !== (index + 1)
       ));

    if (!hasChanges && choices && choices.length > 0) {
      console.log('No changes needed for choices');
      return existingChoices;
    }

    // 3. choice_numberの整合性を確保（既存データの重複チェック）
    const duplicateNumbers = existingChoices
      .map(c => c.choice_number)
      .filter((num, index, arr) => arr.indexOf(num) !== index);
    
    if (duplicateNumbers.length > 0) {
      console.warn('Duplicate choice_numbers detected:', duplicateNumbers);
      // 重複がある場合は一旦全削除してから再作成
      await supabase
        .from('question_option_choices')
        .delete()
        .eq('review_questions_id', reviewQuestionsId);
      
      // 新しい選択肢を順番に作成
      if (choices && choices.length > 0) {
        for (let i = 0; i < choices.length; i++) {
          await supabase
            .from('question_option_choices')
            .insert({
              review_questions_id: reviewQuestionsId,
              choice_number: i + 1,
              choice_name: choices[i]
            });
        }
      }
      
      const updatedChoices = await getQuestionChoiceOptions(reviewQuestionsId);
      console.log('Rebuilt choices after duplicate cleanup:', updatedChoices);
      return updatedChoices;
    }

    const operations = [];
    
    // 3. 新しい選択肢リストを処理
    if (choices && choices.length > 0) {
      for (let i = 0; i < choices.length; i++) {
        const choiceText = choices[i];
        const choiceNumber = i + 1;
        const existingChoice = existingChoices.find(c => c.choice_number === choiceNumber);

        if (existingChoice) {
          // 既存の選択肢を更新
          if (existingChoice.choice_name !== choiceText) {
            console.log(`Updating choice ${choiceNumber}: "${existingChoice.choice_name}" → "${choiceText}"`);
            operations.push({
              type: 'update',
              operation: () => supabase
                .from('question_option_choices')
                .update({ choice_name: choiceText })
                .eq('id', existingChoice.id)
            });
          }
        } else {
          // 新しい選択肢を追加
          console.log(`Adding new choice ${choiceNumber}: "${choiceText}"`);
          operations.push({
            type: 'insert',
            operation: () => supabase
              .from('question_option_choices')
              .insert({
                review_questions_id: reviewQuestionsId,
                choice_number: choiceNumber,
                choice_name: choiceText
              })
          });
        }
      }
    }

    // 4. 不要になった選択肢を削除
    const choicesToDelete = existingChoices.filter(existing => 
      !choices || existing.choice_number > choices.length
    );
    
    for (const choiceToDelete of choicesToDelete) {
      console.log(`Deleting choice ${choiceToDelete.choice_number}: "${choiceToDelete.choice_name}"`);
      operations.push({
        type: 'delete',
        operation: () => supabase
          .from('question_option_choices')
          .delete()
          .eq('id', choiceToDelete.id)
      });
    }

    // 5. 操作をシーケンシャルに実行（競合を防ぐ）
    if (operations.length > 0) {
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        try {
          const result = await op.operation();
          if (result.error) {
            console.error(`Choice update error - Operation ${i + 1}/${operations.length} (${op.type}):`, result.error);
            throw new Error(`Failed to ${op.type} choice: ${result.error.message || result.error}`);
          }
        } catch (error) {
          console.error(`Choice update operation failed - Operation ${i + 1}/${operations.length} (${op.type}):`, error);
          throw new Error(`Choice ${op.type} operation failed: ${error.message}`);
        }
      }
    }

    // 6. 更新後の選択肢を取得して返却
    const updatedChoices = await getQuestionChoiceOptions(reviewQuestionsId);
    console.log('Updated choices:', updatedChoices);
    
    return updatedChoices;
  } catch (error) {
    console.error('Error updating choice options:', error);
    throw error;
  } finally {
    // 必ずロックを解除
    releaseChoiceUpdateLock(reviewQuestionsId);
  }
};

// リニアスケールオプションを更新する関数
export const updateLinearScaleOption = async (reviewQuestionsId, scaleSettings) => {
  try {
    // 1. 既存のスケール設定を削除
    await supabase
      .from('question_option_linear_scale')
      .delete()
      .eq('review_questions_id', reviewQuestionsId);

    // 2. 新しいスケール設定を追加
    if (scaleSettings) {
      const { data, error } = await supabase
        .from('question_option_linear_scale')
        .insert({
          review_questions_id: reviewQuestionsId,
          min_text: scaleSettings.minLabel || 'そう思わない',
          max_text: scaleSettings.maxLabel || 'そう思う'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    }

    return null;
  } catch (error) {
    console.error('Error updating linear scale option:', error);
    throw error;
  }
};

// 質問とそのオプションをまとめて更新する関数
export const updateQuestionWithOptions = async (questionId, questionData) => {
  try {
    // 1. 基本の質問データを更新
    const updatedQuestion = await updateReviewQuestion(questionId, {
      question_text: questionData.question_text,
      is_required: questionData.is_required,
      question_detail_text: questionData.question_detail_text || null,
      is_detail_enabled: questionData.is_detail_enabled || false
    });

    // 2. 質問タイプに応じてオプションを更新
    if (questionData.question_types_id === 7) {
      // リニアスケールオプション
      if (questionData.scale_settings) {
        const scaleSettings = typeof questionData.scale_settings === 'string' 
          ? JSON.parse(questionData.scale_settings) 
          : questionData.scale_settings;
        await updateLinearScaleOption(questionId, scaleSettings);
      }
    } else if ([3, 4, 5, 6, 8, 9, 10].includes(questionData.question_types_id)) {
      // 選択肢オプション
      if (questionData.choices) {
        const choices = typeof questionData.choices === 'string' 
          ? JSON.parse(questionData.choices) 
          : questionData.choices;
        await updateChoiceOptions(questionId, choices);
      }
    }

    return updatedQuestion;
  } catch (error) {
    console.error('Error updating question with options:', error);
    throw error;
  }
};

// 選択肢オプションを直接更新する関数（review_questionsテーブルを経由しない）
export const updateChoiceOptionsDirect = async (reviewQuestionsId, choices) => {
  // 排他制御でロックを取得
  await acquireChoiceUpdateLock(reviewQuestionsId);
  
  try {
    console.log(`Updating choices directly for question ${reviewQuestionsId}:`, choices);
    
    // 1. 既存の選択肢を取得
    const existingChoices = await getQuestionChoiceOptions(reviewQuestionsId);
    console.log('Existing choices (direct):', existingChoices);

    // 2. 変更が必要かチェック（不要な処理を避ける）
    const hasChanges = choices && choices.length > 0 && 
      (existingChoices.length !== choices.length ||
       existingChoices.some((existing, index) => 
         existing.choice_name !== choices[index] || existing.choice_number !== (index + 1)
       ));

    if (!hasChanges && choices && choices.length > 0) {
      console.log('No changes needed for choices');
      return existingChoices;
    }

    // 3. choice_numberの整合性を確保（既存データの重複チェック）
    const duplicateNumbers = existingChoices
      .map(c => c.choice_number)
      .filter((num, index, arr) => arr.indexOf(num) !== index);
    
    if (duplicateNumbers.length > 0) {
      console.warn('Duplicate choice_numbers detected (direct):', duplicateNumbers);
      // 重複がある場合は一旦全削除してから再作成
      await supabase
        .from('question_option_choices')
        .delete()
        .eq('review_questions_id', reviewQuestionsId);
      
      // 新しい選択肢を順番に作成
      if (choices && choices.length > 0) {
        for (let i = 0; i < choices.length; i++) {
          await supabase
            .from('question_option_choices')
            .insert({
              review_questions_id: reviewQuestionsId,
              choice_number: i + 1,
              choice_name: choices[i]
            });
        }
      }
      
      const updatedChoices = await getQuestionChoiceOptions(reviewQuestionsId);
      console.log('Rebuilt choices after duplicate cleanup (direct):', updatedChoices);
      return updatedChoices;
    }

    // 3. 一括更新処理（シーケンシャル実行で競合を防ぐ）
    const operations = [];
    
    // 新しい選択肢リストを処理
    if (choices && choices.length > 0) {
      for (let i = 0; i < choices.length; i++) {
        const choiceText = choices[i];
        const choiceNumber = i + 1;
        const existingChoice = existingChoices.find(c => c.choice_number === choiceNumber);

        if (existingChoice) {
          // 既存の選択肢を更新
          if (existingChoice.choice_name !== choiceText) {
            console.log(`Updating choice ${choiceNumber} (direct): "${existingChoice.choice_name}" → "${choiceText}"`);
            operations.push({
              type: 'update',
              operation: () => supabase
                .from('question_option_choices')
                .update({ choice_name: choiceText })
                .eq('id', existingChoice.id)
            });
          }
        } else {
          // 新しい選択肢を追加
          console.log(`Adding new choice ${choiceNumber} (direct): "${choiceText}"`);
          operations.push({
            type: 'insert',
            operation: () => supabase
              .from('question_option_choices')
              .insert({
                review_questions_id: reviewQuestionsId,
                choice_number: choiceNumber,
                choice_name: choiceText
              })
          });
        }
      }
    }

    // 不要になった選択肢を削除
    const choicesToDelete = existingChoices.filter(existing => 
      !choices || existing.choice_number > choices.length
    );
    
    for (const choiceToDelete of choicesToDelete) {
      console.log(`Deleting choice ${choiceToDelete.choice_number} (direct): "${choiceToDelete.choice_name}"`);
      operations.push({
        type: 'delete',
        operation: () => supabase
          .from('question_option_choices')
          .delete()
          .eq('id', choiceToDelete.id)
      });
    }

    // 4. 操作をシーケンシャルに実行（競合を防ぐ）
    if (operations.length > 0) {
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        try {
          const result = await op.operation();
          if (result.error) {
            console.error(`Choice update error (direct) - Operation ${i + 1}/${operations.length} (${op.type}):`, result.error);
            throw new Error(`Failed to ${op.type} choice: ${result.error.message || result.error}`);
          }
        } catch (error) {
          console.error(`Choice update operation failed (direct) - Operation ${i + 1}/${operations.length} (${op.type}):`, error);
          throw new Error(`Choice ${op.type} operation failed: ${error.message}`);
        }
      }
    }

    // 5. 更新後の選択肢を取得して返却
    const updatedChoices = await getQuestionChoiceOptions(reviewQuestionsId);
    console.log('Updated choices (direct):', updatedChoices);
    
    return updatedChoices;
  } catch (error) {
    console.error('Error updating choice options directly:', error);
    throw error;
  } finally {
    // 必ずロックを解除
    releaseChoiceUpdateLock(reviewQuestionsId);
  }
};

// 均等目盛りオプションを直接更新する関数（review_questionsテーブルを経由しない）
export const updateLinearScaleOptionDirect = async (reviewQuestionsId, scaleSettings) => {
  try {
    // 1. 既存のスケール設定を削除
    await supabase
      .from('question_option_linear_scale')
      .delete()
      .eq('review_questions_id', reviewQuestionsId);

    // 2. 新しいスケール設定を追加
    if (scaleSettings) {
      const { data, error } = await supabase
        .from('question_option_linear_scale')
        .insert({
          review_questions_id: reviewQuestionsId,
          min_text: scaleSettings.minLabel || '',
          max_text: scaleSettings.maxLabel || ''
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    }

    return null;
  } catch (error) {
    console.error('Error updating linear scale option directly:', error);
    throw error;
  }
};

// 質問とそのオプションをまとめて取得する関数
export const getQuestionsWithOptions = async (reviewFormId, reviewFormPagesId) => {
  try {
    // 1. 基本の質問データを取得
    const questions = await getReviewQuestions(reviewFormId, reviewFormPagesId);
    
    // 2. 各質問のオプションデータを取得
    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        let options = null;
        
        // 質問タイプに応じてオプションを取得
        if (question.question_types_id === 7) {
          // リニアスケールオプション
          options = await getQuestionLinearScaleOption(question.id);
        } else if ([3, 4, 5, 6, 8, 9, 10].includes(question.question_types_id)) {
          // 選択肢オプション
          options = await getQuestionChoiceOptions(question.id);
        }
        
        return {
          ...question,
          options: options
        };
      })
    );

    return questionsWithOptions;
  } catch (error) {
    console.error('Error fetching questions with options:', error);
    return [];
  }
};

// Analytics用質問一覧取得（テストモード対応）
export const getQuestionsForAnalytics = async (userId, isTestMode = false) => {
  try {
    console.log('getQuestionsForAnalytics 開始:', { userId, isTestMode });
    const config = getDatabaseConfig(isTestMode); // テストモード削除時: getDatabaseConfig()
    console.log('使用するDB設定:', config);

    let questionsQuery;

    if (isTestMode) {
      // ========= テストモード用クエリ（削除予定） =========
      console.log('テストモード用クエリを実行:', config.REVIEW_QUESTIONS);
      
      // まずはシンプルなクエリでテストデータの存在確認
      const { data: testData, error: testError } = await supabase
        .from(config.REVIEW_QUESTIONS)
        .select('*')
        .limit(5);
      
      console.log('テストデータ確認結果:', { data: testData, error: testError });
      
      questionsQuery = supabase
        .from(config.REVIEW_QUESTIONS)
        .select(`
          id,
          question_text,
          question_number,
          is_required,
          question_detail_text,
          is_detail_enabled,
          created_at,
          question_types_id,
          question_categories_id,
          question_subcategories_id
        `)
        .order('question_number', { ascending: true });
      // ================================================
    } else {
      // 本番モード用クエリ（削除不要）
      questionsQuery = supabase
        .from(config.REVIEW_QUESTIONS)
        .select(`
          id,
          question_text,
          question_number,
          is_required,
          question_detail_text,
          is_detail_enabled,
          created_at,
          question_types!inner(id, japanese),
          question_categories!inner(id, japanese_name),
          question_subcategories(id, japanese_name),
          review_forms!inner(id, title, business_users),
          review_form_pages(id, name, page_number)
        `)
        .eq('review_forms.business_users', userId)
        .order('question_number', { ascending: true });
    }

    const { data: questions, error } = await questionsQuery;
    console.log('クエリ実行結果:', { questions, error });

    if (error) {
      console.error('Analytics用質問取得エラー:', error);
      return [];
    }

    if (!questions || questions.length === 0) {
      console.warn('取得した質問データが空です');
      return [];
    }

    // データを統一フォーマットに変換（削除不要な共通処理）
    const formattedQuestions = formatQuestionsForAnalytics(questions || []);
    console.log('フォーマット後の質問データ:', formattedQuestions);
    
    return formattedQuestions;

  } catch (error) {
    console.error('Analytics用質問取得エラー:', error);
    return [];
  }
};

// Analytics用質問データのフォーマット（共通処理・削除不要）
export const formatQuestionsForAnalytics = (rawQuestions) => {
  console.log('フォーマット処理開始:', rawQuestions);
  
  return rawQuestions.map(question => {
    console.log('フォーマット中の質問:', question);
    
    const formatted = {
      id: question.id,
      title: question.question_text || '無題の質問',
      questionNumber: question.question_number || 0,
      category: question.question_categories?.japanese_name || 'その他',
      subcategory: question.question_subcategories?.japanese_name || null,
      type: question.question_types?.japanese || '不明',
      typeId: question.question_types?.id || question.question_types_id || 0,
      isRequired: question.is_required || false,
      detailText: question.question_detail_text || '',
      isDetailEnabled: question.is_detail_enabled || false,
      formTitle: question.review_forms?.title || question.test_review_forms?.title || 'テストフォーム',
      pageInfo: question.review_form_pages || question.test_review_form_pages || null,
      createdAt: question.created_at,
      // Analytics表示用の追加情報（初期値）
      responses: 0, // 実際のレスポンス数は別途取得
      avgRating: 0, // 平均評価は別途取得
      // カテゴリカラー（UI表示用）
      categoryColor: getCategoryColor(question.question_categories?.japanese_name || 'その他')
    };
    
    console.log('フォーマット後:', formatted);
    return formatted;
  });
};

// カテゴリカラー取得（UI表示用・削除不要）
const getCategoryColor = (categoryName) => {
  const colorMap = {
    '基本情報': '#3B82F6',
    '満足度': '#10B981', 
    'サービス評価': '#F59E0B',
    '改善提案': '#EF4444',
    'その他': '#6B7280'
  };
  return colorMap[categoryName] || colorMap['その他'];
};

// 質問統計データ取得（テストモード対応）
export const getQuestionAnalyticsStats = async (questionId, isTestMode = false) => {
  try {
    const config = getDatabaseConfig(isTestMode); // テストモード削除時: getDatabaseConfig()

    // 回答数取得
    const { data: answers, error: answersError } = await supabase
      .from(config.REVIEW_QUESTION_ANSWERS)
      .select('id')
      .eq('review_questions_id', questionId);

    if (answersError) {
      console.error('回答統計取得エラー:', answersError);
      return { responses: 0, avgRating: 0 };
    }

    // リニアスケール回答の平均取得
    const { data: linearAnswers, error: linearError } = await supabase
      .from(config.QUESTION_ANSWER_OPTION_LINEAR_SCALE)
      .select('answer_number')
      .in('review_question_answers_id', answers?.map(a => a.id) || []);

    if (linearError) {
      console.error('リニアスケール統計取得エラー:', linearError);
    }

    const ratings = linearAnswers?.map(a => a.answer_number).filter(r => r !== null) || [];
    const avgRating = ratings.length > 0 
      ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
      : 0;

    return {
      responses: answers?.length || 0,
      avgRating
    };

  } catch (error) {
    console.error('質問統計取得エラー:', error);
    return { responses: 0, avgRating: 0 };
  }
};