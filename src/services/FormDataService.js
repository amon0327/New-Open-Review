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
          business_users: userId
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
          page_number: 1
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
          review_form_id: reviewFormId
        }]);

      if (settingsError) {
        throw new Error(`フォーム設定作成エラー: ${settingsError.message}`);
      }

      // 4. login_screen_settingsテーブルにレコードを作成
      const { error: loginSettingsError } = await supabase
        .from('login_screen_settings')
        .insert([{
          review_forms_id: reviewFormId
        }]);

      if (loginSettingsError) {
        throw new Error(`ログイン画面設定作成エラー: ${loginSettingsError.message}`);
      }

      // 5. question_screen_settingsテーブルにレコードを作成
      const { error: questionSettingsError } = await supabase
        .from('question_screen_settings')
        .insert([{
          review_forms_id: reviewFormId
        }]);

      if (questionSettingsError) {
        throw new Error(`質問画面設定作成エラー: ${questionSettingsError.message}`);
      }

      // 6. completion_screen_settingsテーブルにレコードを作成
      const { error: completionSettingsError } = await supabase
        .from('completion_screen_settings')
        .insert([{
          review_forms_id: reviewFormId
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
            is_dark_mode
          )
        `)
        .eq('business_users', userId)
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

  /**
   * フォームのページ一覧を取得
   * @param {string} formId - フォームID
   * @returns {Promise<Object>} ページ一覧
   */
  static async getFormPages(formId) {
    try {
      const { data, error } = await supabase
        .from('review_form_pages')
        .select('*')
        .eq('review_forms_id', formId)
        .order('page_number', { ascending: true });

      if (error) {
        throw new Error(`ページ取得エラー: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        error: null
      };

    } catch (error) {
      console.error('Form pages fetch error:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * 新しいページを追加
   * @param {string} formId - フォームID
   * @param {string} pageName - ページ名
   * @returns {Promise<Object>} 追加結果
   */
  static async addFormPage(formId, pageName) {
    try {
      // 現在の最大ページ番号を取得
      const { data: existingPages, error: fetchError } = await supabase
        .from('review_form_pages')
        .select('page_number')
        .eq('review_forms_id', formId)
        .order('page_number', { ascending: false })
        .limit(1);

      if (fetchError) {
        throw new Error(`既存ページ取得エラー: ${fetchError.message}`);
      }

      const maxPageNumber = existingPages.length > 0 ? existingPages[0].page_number : 0;
      const newPageNumber = maxPageNumber + 1;

      const { data, error } = await supabase
        .from('review_form_pages')
        .insert([{
          review_forms_id: formId,
          page_number: newPageNumber,
          name: pageName || `ページ ${newPageNumber}`
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`ページ追加エラー: ${error.message}`);
      }

      return {
        success: true,
        data,
        error: null
      };

    } catch (error) {
      console.error('Add page error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * ページを削除
   * @param {string} pageId - ページID
   * @returns {Promise<Object>} 削除結果
   */
  static async deleteFormPage(pageId) {
    try {
      const { error } = await supabase
        .from('review_form_pages')
        .delete()
        .eq('id', pageId);

      if (error) {
        throw new Error(`ページ削除エラー: ${error.message}`);
      }

      return {
        success: true,
        data: null,
        error: null
      };

    } catch (error) {
      console.error('Delete page error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * ページ名を更新
   * @param {string} pageId - ページID
   * @param {string} newName - 新しいページ名
   * @returns {Promise<Object>} 更新結果
   */
  static async updatePageName(pageId, newName) {
    try {
      const { data, error } = await supabase
        .from('review_form_pages')
        .update({ name: newName })
        .eq('id', pageId)
        .select()
        .single();

      if (error) {
        throw new Error(`ページ名更新エラー: ${error.message}`);
      }

      return {
        success: true,
        data,
        error: null
      };

    } catch (error) {
      console.error('Update page name error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * 質問タイプ一覧を取得
   * @returns {Promise<Object>} 質問タイプ一覧
   */
  static async getQuestionTypes() {
    try {
      const { data, error } = await supabase
        .from('question_types')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        throw new Error(`質問タイプ取得エラー: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        error: null
      };

    } catch (error) {
      console.error('Question types fetch error:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * テンプレート質問データを取得（カテゴリとサブカテゴリを含む）
   * @returns {Promise<Object>} テンプレート質問データ
   */
  static async getTemplateQuestions() {
    try {
      // カテゴリを取得
      const { data: categories, error: categoriesError } = await supabase
        .from('question_categories')
        .select('*')
        .order('id', { ascending: true });

      if (categoriesError) {
        throw new Error(`カテゴリ取得エラー: ${categoriesError.message}`);
      }

      // サブカテゴリを取得
      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('question_subcategories')
        .select('*')
        .eq('is_hidden', false)
        .order('id', { ascending: true });

      if (subcategoriesError) {
        throw new Error(`サブカテゴリ取得エラー: ${subcategoriesError.message}`);
      }

      // テンプレート質問を取得
      const { data: templateQuestions, error: questionsError } = await supabase
        .from('template_review_questions')
        .select('*')
        .eq('is_hidden', false)
        .order('id', { ascending: true });

      if (questionsError) {
        throw new Error(`テンプレート質問取得エラー: ${questionsError.message}`);
      }

      // 選択肢データを取得
      const { data: choices, error: choicesError } = await supabase
        .from('template_question_option_choices')
        .select('*')
        .order('choice_number', { ascending: true });

      if (choicesError) {
        throw new Error(`選択肢取得エラー: ${choicesError.message}`);
      }

      // スケール設定を取得
      const { data: scaleSettings, error: scaleError } = await supabase
        .from('template_question_option_linear_scale')
        .select('*');

      if (scaleError) {
        throw new Error(`スケール設定取得エラー: ${scaleError.message}`);
      }

      return {
        success: true,
        data: {
          categories: categories || [],
          subcategories: subcategories || [],
          templateQuestions: templateQuestions || [],
          choices: choices || [],
          scaleSettings: scaleSettings || []
        },
        error: null
      };

    } catch (error) {
      console.error('Template questions fetch error:', error);
      return {
        success: false,
        data: {
          categories: [],
          subcategories: [],
          templateQuestions: [],
          choices: [],
          scaleSettings: []
        },
        error: error.message
      };
    }
  }

  /**
   * フォーム設定を取得（テーマカラー、ロゴ、ヘッダー画像など）
   * @param {string} formId - フォームID
   * @returns {Promise<Object>} フォーム設定データ
   */
  static async getFormSettings(formId) {
    try {
      const { data, error } = await supabase
        .from('review_form_settings')
        .select('*')
        .eq('review_form_id', formId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // データが存在しない場合はデフォルト設定を返す
          return {
            success: true,
            data: {
              id: null,
              review_form_id: formId,
              logo_image_url: 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png',
              is_dark_mode: false,
              theme_color: '#5e17eb',
              header_image_url: null
            }
          };
        }
        throw error;
      }

      return {
        success: true,
        data: data || {}
      };
    } catch (error) {
      console.error('Error fetching form settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * フォーム設定を更新または作成
   * @param {string} formId - フォームID
   * @param {Object} settings - 設定データ
   * @returns {Promise<Object>} 更新結果
   */
  static async updateFormSettings(formId, settings) {
    try {
      // 既存の設定があるかチェック
      const { data: existingSettings } = await supabase
        .from('review_form_settings')
        .select('id')
        .eq('review_form_id', formId)
        .single();

      let result;
      if (existingSettings) {
        // 更新
        result = await supabase
          .from('review_form_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('review_form_id', formId)
          .select()
          .single();
      } else {
        // 新規作成
        result = await supabase
          .from('review_form_settings')
          .insert([{
            review_form_id: formId,
            ...settings
          }])
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error updating form settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * テーマカラーを更新
   * @param {string} formId - フォームID
   * @param {string} themeColor - テーマカラー（#5e17eb形式）
   * @returns {Promise<Object>} 更新結果
   */
  static async updateThemeColor(formId, themeColor) {
    return await this.updateFormSettings(formId, { theme_color: themeColor });
  }

  /**
   * ロゴ画像URLを更新
   * @param {string} formId - フォームID
   * @param {string} logoImageUrl - ロゴ画像URL
   * @returns {Promise<Object>} 更新結果
   */
  static async updateLogoImage(formId, logoImageUrl) {
    return await this.updateFormSettings(formId, { logo_image_url: logoImageUrl });
  }

  /**
   * ヘッダー画像URLを更新
   * @param {string} formId - フォームID
   * @param {string} headerImageUrl - ヘッダー画像URL
   * @returns {Promise<Object>} 更新結果
   */
  static async updateHeaderImage(formId, headerImageUrl) {
    return await this.updateFormSettings(formId, { header_image_url: headerImageUrl });
  }

  /**
   * ダークモード設定を更新
   * @param {string} formId - フォームID
   * @param {boolean} isDarkMode - ダークモード有効フラグ
   * @returns {Promise<Object>} 更新結果
   */
  static async updateDarkMode(formId, isDarkMode) {
    return await this.updateFormSettings(formId, { is_dark_mode: isDarkMode });
  }
}

export default FormDataService;