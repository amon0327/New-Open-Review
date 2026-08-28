import { supabase } from '../lib/supabase';

// データ取得・操作関連のサービス
export class DataService {
  // レビューフォーム一覧取得
  static async getReviewForms(userId) {
    try {
      const { data, error } = await supabase
        .from('review_forms')
        .select(`
          id,
          title,
          is_published,
          published_url,
          created_at,
          updated_at,
          is_deleted
        `)
        .eq('business_users', userId)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('レビューフォーム取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('レビューフォーム取得処理エラー:', error);
      return [];
    }
  }

  // 特定のレビューフォーム取得
  static async getReviewForm(formId) {
    try {
      const { data, error } = await supabase
        .from('review_forms')
        .select(`
          id,
          title,
          is_published,
          published_url,
          created_at,
          updated_at,
          business_users
        `)
        .eq('id', formId)
        .eq('is_deleted', false)
        .single();

      if (error) {
        console.error('レビューフォーム詳細取得エラー:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('レビューフォーム詳細取得処理エラー:', error);
      return null;
    }
  }

  // レビューフォーム作成
  static async createReviewForm(userId, title = '名称未設定') {
    try {
      const { data, error } = await supabase
        .from('review_forms')
        .insert({
          business_users: userId,
          title: title,
          is_published: false,
          is_deleted: false
        })
        .select()
        .single();

      if (error) {
        console.error('レビューフォーム作成エラー:', error);
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('レビューフォーム作成処理エラー:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  // レビューフォーム更新
  static async updateReviewForm(formId, updates) {
    try {
      const { data, error } = await supabase
        .from('review_forms')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId)
        .select()
        .single();

      if (error) {
        console.error('レビューフォーム更新エラー:', error);
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('レビューフォーム更新処理エラー:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  // レビューフォーム削除（論理削除）
  static async deleteReviewForm(formId) {
    try {
      const { data, error } = await supabase
        .from('review_forms')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId)
        .select()
        .single();

      if (error) {
        console.error('レビューフォーム削除エラー:', error);
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } catch (error) {
      console.error('レビューフォーム削除処理エラー:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  // フォーム回答データ取得
  static async getFormSubmissions(formId, limit = 100, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('review_form_submissions')
        .select(`
          id,
          created_at,
          users,
          review_question_answers (
            id,
            review_questions_id,
            question_answer_texts (answer_text),
            question_answer_option_choices (
              question_option_choices (choice_name)
            ),
            question_answer_option_linear_scale (answer_number)
          )
        `)
        .eq('review_forms_id', formId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('フォーム回答取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('フォーム回答取得処理エラー:', error);
      return [];
    }
  }

  // 質問タイプ一覧取得
  static async getQuestionTypes() {
    try {
      const { data, error } = await supabase
        .from('question_types')
        .select('*')
        .order('id');

      if (error) {
        console.error('質問タイプ取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('質問タイプ取得処理エラー:', error);
      return [];
    }
  }

  // 質問カテゴリ一覧取得
  static async getQuestionCategories() {
    try {
      const { data, error } = await supabase
        .from('question_categories')
        .select('*')
        .order('id');

      if (error) {
        console.error('質問カテゴリ取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('質問カテゴリ取得処理エラー:', error);
      return [];
    }
  }

  // 質問サブカテゴリ取得
  static async getQuestionSubcategories(categoryId) {
    try {
      const { data, error } = await supabase
        .from('question_subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_hidden', false)
        .order('id');

      if (error) {
        console.error('質問サブカテゴリ取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('質問サブカテゴリ取得処理エラー:', error);
      return [];
    }
  }

  // テンプレート質問取得
  static async getTemplateQuestions(categoryId = null, subcategoryId = null) {
    try {
      let query = supabase
        .from('template_review_questions')
        .select(`
          id,
          question_text,
          question_detail_text,
          is_detail_enabled,
          is_required,
          question_types_id,
          question_categories_id,
          question_subcategories_id,
          is_hidden
        `)
        .eq('is_hidden', false);

      if (categoryId) {
        query = query.eq('question_categories_id', categoryId);
      }

      if (subcategoryId) {
        query = query.eq('question_subcategories_id', subcategoryId);
      }

      const { data, error } = await query.order('id');

      if (error) {
        console.error('テンプレート質問取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('テンプレート質問取得処理エラー:', error);
      return [];
    }
  }

  // Analytics用のテキスト回答データ取得
  static async getTextAnswersForAnalytics(questionId, dateFilter = null) {
    try {
      let query = supabase
        .from('question_answer_texts')
        .select(`
          id,
          answer_text,
          review_questions_answers_id,
          review_question_answers!inner (
            id,
            created_at,
            review_form_submissions_id,
            review_form_submissions!inner (
              id,
              created_at,
              review_forms_id
            )
          )
        `)
        .eq('review_question_answers.review_questions_id', questionId)
        .not('answer_text', 'is', null)
        .neq('answer_text', '');

      // 日付フィルターがある場合
      if (dateFilter && dateFilter.length > 0) {
        const dates = dateFilter.map(date => date.toISOString().split('T')[0]);
        query = query.in('review_question_answers.review_form_submissions.created_at::date', dates);
      }

      const { data, error } = await query
        .order('review_question_answers.created_at', { ascending: false });

      if (error) {
        console.error('テキスト回答データ取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('テキスト回答データ取得処理エラー:', error);
      return [];
    }
  }

  // Analytics用の選択肢回答データ取得
  static async getChoiceAnswersForAnalytics(questionId, dateFilter = null) {
    try {
      let query = supabase
        .from('question_answer_option_choices')
        .select(`
          id,
          question_option_choices!inner (
            choice_name,
            choice_number
          ),
          review_question_answers!inner (
            id,
            created_at,
            review_form_submissions_id,
            review_form_submissions!inner (
              id,
              created_at,
              review_forms_id
            )
          )
        `)
        .eq('review_question_answers.review_questions_id', questionId);

      // 日付フィルターがある場合
      if (dateFilter && dateFilter.length > 0) {
        const dates = dateFilter.map(date => date.toISOString().split('T')[0]);
        query = query.in('review_question_answers.review_form_submissions.created_at::date', dates);
      }

      const { data, error } = await query
        .order('review_question_answers.created_at', { ascending: false });

      if (error) {
        console.error('選択肢回答データ取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('選択肢回答データ取得処理エラー:', error);
      return [];
    }
  }

  // Analytics用のリニアスケール回答データ取得
  static async getLinearScaleAnswersForAnalytics(questionId, dateFilter = null) {
    try {
      let query = supabase
        .from('question_answer_option_linear_scale')
        .select(`
          id,
          answer_number,
          review_question_answers!inner (
            id,
            created_at,
            review_form_submissions_id,
            review_form_submissions!inner (
              id,
              created_at,
              review_forms_id
            )
          )
        `)
        .eq('review_question_answers.review_questions_id', questionId)
        .not('answer_number', 'is', null);

      // 日付フィルターがある場合
      if (dateFilter && dateFilter.length > 0) {
        const dates = dateFilter.map(date => date.toISOString().split('T')[0]);
        query = query.in('review_question_answers.review_form_submissions.created_at::date', dates);
      }

      const { data, error } = await query
        .order('review_question_answers.created_at', { ascending: false });

      if (error) {
        console.error('リニアスケール回答データ取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('リニアスケール回答データ取得処理エラー:', error);
      return [];
    }
  }

  // データベース接続テスト
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('question_types')
        .select('id')
        .limit(1);

      if (error) {
        console.error('データベース接続テストエラー:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('データベース接続テスト処理エラー:', error);
      return { success: false, error: error.message };
    }
  }

  // リアルタイム購読設定
  static subscribeToChanges(table, callback, filter = null) {
    let subscription = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: table,
          ...(filter && { filter: filter })
        }, 
        callback
      )
      .subscribe();

    return subscription;
  }

  // 購読解除
  static unsubscribe(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
}

export default DataService;