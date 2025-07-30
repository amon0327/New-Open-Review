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