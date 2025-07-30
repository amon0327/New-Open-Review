import { supabase } from '../lib/supabase';

/**
 * フォーム作成に関するCRUD操作を管理するサービスクラス
 */
export class FormDataService {
  /**
   * 新しいフォームを作成し、関連する全てのテーブルにレコードを作成
   * @param {string} userId - ログインしているユーザーのID
   * @returns {Promise<Object>} 作成されたフォームの情報とエラー
   */
  static async createNewForm(userId) {
    try {
      // 1. review_formsテーブルにレコードを作成
      const { data: reviewForm, error: reviewFormError } = await supabase
        .from('review_forms')
        .insert([{
          business_users_id: userId,
          title: 'OpenReview フォーム',
          description: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (reviewFormError) {
        throw new Error(`フォーム作成エラー: ${reviewFormError.message}`);
      }

      const reviewFormId = reviewForm.id;

      // 2. review_form_pagesテーブルにレコードを作成
      const { data: reviewFormPage, error: pageError } = await supabase
        .from('review_form_pages')
        .insert([{
          review_forms_id: reviewFormId,
          page_number: 1,
          title: 'ページ 1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (pageError) {
        throw new Error(`ページ作成エラー: ${pageError.message}`);
      }

      // 3. review_form_settingsテーブルにレコードを作成
      const { error: settingsError } = await supabase
        .from('review_form_settings')
        .insert([{
          review_forms_id: reviewFormId,
          theme_color: '#5e17eb',
          font_family: 'Inter',
          is_published: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (settingsError) {
        throw new Error(`フォーム設定作成エラー: ${settingsError.message}`);
      }

      // 4. login_screen_settingsテーブルにレコードを作成
      const { error: loginSettingsError } = await supabase
        .from('login_screen_settings')
        .insert([{
          review_forms_id: reviewFormId,
          title: 'ログイン',
          subtitle: 'アカウントにログインしてください',
          background_color: '#ffffff',
          text_color: '#14181B',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (loginSettingsError) {
        throw new Error(`ログイン画面設定作成エラー: ${loginSettingsError.message}`);
      }

      // 5. question_screen_settingsテーブルにレコードを作成
      const { error: questionSettingsError } = await supabase
        .from('question_screen_settings')
        .insert([{
          review_forms_id: reviewFormId,
          title: 'アンケート',
          subtitle: '以下の質問にお答えください',
          background_color: '#ffffff',
          text_color: '#14181B',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (questionSettingsError) {
        throw new Error(`質問画面設定作成エラー: ${questionSettingsError.message}`);
      }

      // 6. completion_screen_settingsテーブルにレコードを作成
      const { error: completionSettingsError } = await supabase
        .from('completion_screen_settings')
        .insert([{
          review_forms_id: reviewFormId,
          title: '完了',
          subtitle: 'ご回答ありがとうございました',
          background_color: '#ffffff',
          text_color: '#14181B',
          button_text: '閉じる',
          button_color: '#5e17eb',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (completionSettingsError) {
        throw new Error(`完了画面設定作成エラー: ${completionSettingsError.message}`);
      }

      return {
        success: true,
        data: {
          reviewForm,
          reviewFormPage,
          reviewFormId
        },
        error: null
      };

    } catch (error) {
      console.error('Form creation error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * フォームの基本情報を更新
   * @param {string} formId - フォームID
   * @param {Object} updates - 更新データ
   * @returns {Promise<Object>} 更新結果
   */
  static async updateForm(formId, updates) {
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
        throw new Error(`フォーム更新エラー: ${error.message}`);
      }

      return {
        success: true,
        data,
        error: null
      };

    } catch (error) {
      console.error('Form update error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * フォームを削除（関連するすべてのデータも削除）
   * @param {string} formId - フォームID
   * @returns {Promise<Object>} 削除結果
   */
  static async deleteForm(formId) {
    try {
      // Supabaseの外部キー制約により、関連データは自動削除される想定
      const { error } = await supabase
        .from('review_forms')
        .delete()
        .eq('id', formId);

      if (error) {
        throw new Error(`フォーム削除エラー: ${error.message}`);
      }

      return {
        success: true,
        data: null,
        error: null
      };

    } catch (error) {
      console.error('Form deletion error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * ユーザーのフォーム一覧を取得
   * @param {string} userId - ユーザーID
   * @returns {Promise<Object>} フォーム一覧
   */
  static async getUserForms(userId) {
    try {
      const { data, error } = await supabase
        .from('review_forms')
        .select(`
          *,
          review_form_settings (
            theme_color,
            is_published
          )
        `)
        .eq('business_users_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`フォーム取得エラー: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        error: null
      };

    } catch (error) {
      console.error('Forms fetch error:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * 特定のフォームの詳細情報を取得
   * @param {string} formId - フォームID
   * @returns {Promise<Object>} フォーム詳細
   */
  static async getFormDetails(formId) {
    try {
      const { data, error } = await supabase
        .from('review_forms')
        .select(`
          *,
          review_form_pages (*),
          review_form_settings (*),
          login_screen_settings (*),
          question_screen_settings (*),
          completion_screen_settings (*)
        `)
        .eq('id', formId)
        .single();

      if (error) {
        throw new Error(`フォーム詳細取得エラー: ${error.message}`);
      }

      return {
        success: true,
        data,
        error: null
      };

    } catch (error) {
      console.error('Form details fetch error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }
}

export default FormDataService;