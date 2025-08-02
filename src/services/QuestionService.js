import { supabase } from '../supabaseClient';

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
    } else if ([3, 4, 5, 6, 8].includes(questionTypesId)) {
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
    else if ([3, 4, 8, 9, 10].includes(questionTypesId)) {
      const defaultChoices = ['選択肢1'];
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

// 選択肢オプションを更新する関数
export const updateChoiceOptions = async (reviewQuestionsId, choices) => {
  try {
    // 1. 既存の選択肢を削除
    await supabase
      .from('question_option_choices')
      .delete()
      .eq('review_questions_id', reviewQuestionsId);

    // 2. 新しい選択肢を追加
    if (choices && choices.length > 0) {
      const choiceInserts = choices.map((choice, index) => ({
        review_questions_id: reviewQuestionsId,
        choice_number: index + 1,
        choice_name: choice
      }));

      const { data, error } = await supabase
        .from('question_option_choices')
        .insert(choiceInserts)
        .select();

      if (error) {
        throw error;
      }

      return data;
    }

    return [];
  } catch (error) {
    console.error('Error updating choice options:', error);
    throw error;
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
    } else if ([3, 4, 5, 6, 8].includes(questionData.question_types_id)) {
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
  try {
    // 1. 既存の選択肢を削除
    await supabase
      .from('question_option_choices')
      .delete()
      .eq('review_questions_id', reviewQuestionsId);

    // 2. 新しい選択肢を追加
    if (choices && choices.length > 0) {
      const choiceInserts = choices.map((choice, index) => ({
        review_questions_id: reviewQuestionsId,
        choice_number: index + 1,
        choice_name: choice
      }));

      const { data, error } = await supabase
        .from('question_option_choices')
        .insert(choiceInserts)
        .select();

      if (error) {
        throw error;
      }

      return data;
    }

    return [];
  } catch (error) {
    console.error('Error updating choice options directly:', error);
    throw error;
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
        } else if ([3, 4, 5, 6, 8].includes(question.question_types_id)) {
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