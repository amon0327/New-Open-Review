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
        question_text: '質問を入力',
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
        min_text: 'そう思わない',
        max_text: 'そう思う'
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

    return question;
  } catch (error) {
    console.error('Error creating question with options:', error);
    throw error;
  }
};