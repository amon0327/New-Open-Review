import { supabase } from '../lib/supabase';
import ImageUploadService from './ImageUploadService';

/**
 * フォーム作成に関するCRUD操作を管理するサービスクラス
 */
export class FormDataService {
  /**
   * 新しいフォームを作成し、関連する全てのテーブルにレコードを作成
   * Edge Functionを使用してcompany_review_formsテーブルへの書き込みも行う
   * @param {string} userId - ログインしているユーザーのID
   * @param {string} [companyId] - オプショナル：パートナーコンテキストで作成する場合の企業ID
   * @returns {Promise<Object>} 作成されたフォームの情報とエラー
   */
  static async createNewForm(userId, companyId = null) {
    try {
      console.log('🚀 FormDataService.createNewForm started with userId:', userId, 'companyId:', companyId);

      // 現在のセッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ Session error:', sessionError);
        throw new Error('認証セッションが取得できません');
      }
      console.log('✅ Session obtained successfully');

      // Edge Functionを呼び出してフォームを作成
      console.log('🔄 Calling Edge Function: create-review-form');
      const requestBody = {
        title: '新規レビューフォーム'
      };

      // パートナーコンテキストの場合はcompanyIdを追加
      console.log('🔍 Checking companyId:', companyId, 'Type:', typeof companyId);
      if (companyId) {
        requestBody.companyId = companyId;
        console.log('✅ Added companyId to requestBody:', companyId);
      } else {
        console.log('⚠️ No companyId provided, will use company_memberships');
      }

      console.log('📤 Final request body:', JSON.stringify(requestBody, null, 2));

      const { data, error } = await supabase.functions.invoke('create-review-form', {
        body: requestBody
      });
      console.log('📊 Edge Function response:', { data, error });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(`Edge Function呼び出しエラー: ${error.message}`);
      }

      if (!data.success) {
        console.error('❌ Edge Function returned failure:', data);
        throw new Error(data.error || 'フォーム作成に失敗しました');
      }

      console.log('✅ Edge Function succeeded:', data);
      const reviewFormId = data.reviewForm.id;
      console.log('📝 Review Form ID:', reviewFormId);

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
          reviewForm: data.reviewForm,
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
      console.log(`Starting deletion process for form: ${formId}`);

      // 1. フォームに関連する質問IDを取得
      const { data: questions, error: questionsSelectError } = await supabase
        .from('review_questions')
        .select('id')
        .eq('review_fome_id', formId);

      if (questionsSelectError) {
        console.warn('質問取得エラー:', questionsSelectError.message);
      }

      // 2. 質問のオプションデータを削除
      if (questions && questions.length > 0) {
        const questionIds = questions.map(q => q.id);

        const { error: choicesError } = await supabase
          .from('question_option_choices')
          .delete()
          .in('review_questions_id', questionIds);

        if (choicesError) {
          console.warn('選択肢削除エラー:', choicesError.message);
        }

        const { error: scaleError } = await supabase
          .from('question_option_linear_scale')
          .delete()
          .in('review_questions_id', questionIds);

        if (scaleError) {
          console.warn('スケール削除エラー:', scaleError.message);
        }
      }

      // 3. 質問を削除
      const { error: questionsError } = await supabase
        .from('review_questions')
        .delete()
        .eq('review_fome_id', formId);

      if (questionsError) {
        console.warn('質問削除エラー:', questionsError.message);
      }

      // 4. 各種画面設定を削除
      const settingsTables = [
        'login_screen_settings',
        'question_screen_settings', 
        'completion_screen_settings'
      ];

      for (const table of settingsTables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('review_forms_id', formId);
        
        if (error) {
          console.warn(`${table}削除エラー:`, error.message);
        }
      }

      // 5. フォーム設定を削除
      const { error: settingsError } = await supabase
        .from('review_form_settings')
        .delete()
        .eq('review_form_id', formId);

      if (settingsError) {
        console.warn('フォーム設定削除エラー:', settingsError.message);
      }

      // 6. フォームページを削除
      const { error: pagesError } = await supabase
        .from('review_form_pages')
        .delete()
        .eq('review_forms_id', formId);

      if (pagesError) {
        console.warn('ページ削除エラー:', pagesError.message);
      }

      // 7. 最後にメインフォームを削除
      const { error: formError } = await supabase
        .from('review_forms')
        .delete()
        .eq('id', formId);

      if (formError) {
        throw new Error(`フォーム削除エラー: ${formError.message}`);
      }

      console.log(`Form ${formId} deleted successfully`);
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
   * ユーザーのフォーム一覧を取得（質問数も含む）
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
          ),
          review_questions (
            id
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
      // UNIQUE制約がないため手動でupsert処理を実装
      // 重複レコードがある場合の対処も含める
      const { data: existingSettings, error: selectError } = await supabase
        .from('review_form_settings')
        .select('id')
        .eq('review_form_id', formId)
        .order('created_at', { ascending: true });

      if (selectError) {
        throw selectError;
      }

      let result;
      if (existingSettings && existingSettings.length > 0) {
        // 既存レコードがある場合
        if (existingSettings.length > 1) {
          // 重複レコードがある場合、最初のもの以外を削除
          const keepRecord = existingSettings[0];
          const duplicateIds = existingSettings.slice(1).map(record => record.id);
          
          if (duplicateIds.length > 0) {
            console.warn(`Found ${duplicateIds.length} duplicate records for form ${formId}, cleaning up...`);
            await supabase
              .from('review_form_settings')
              .delete()
              .in('id', duplicateIds);
          }
        }
        
        // 最初のレコードを更新
        result = await supabase
          .from('review_form_settings')
          .update(settings)
          .eq('review_form_id', formId)
          .select()
          .single();
      } else {
        // 既存レコードがない場合は新規作成
        result = await supabase
          .from('review_form_settings')
          .insert({
            review_form_id: formId,
            ...settings
          })
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
    console.log('FormDataService.updateThemeColor called with formId:', formId, 'themeColor:', themeColor);
    const result = await this.updateFormSettings(formId, { theme_color: themeColor });
    console.log('FormDataService.updateThemeColor result:', result);
    return result;
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
   * ヘッダー画像URLを更新（question_screen_settingsテーブル）
   * @param {string} formId - フォームID
   * @param {string} headerImageUrl - ヘッダー画像URL
   * @returns {Promise<Object>} 更新結果
   */
  static async updateHeaderImage(formId, headerImageUrl) {
    try {
      // 既存の設定があるかチェック
      const { data: existingSettings } = await supabase
        .from('question_screen_settings')
        .select('id')
        .eq('review_forms_id', formId)
        .single();

      let result;
      if (existingSettings) {
        // 更新
        result = await supabase
          .from('question_screen_settings')
          .update({
            header_image_url: headerImageUrl
          })
          .eq('review_forms_id', formId)
          .select()
          .single();
      } else {
        // 新規作成
        result = await supabase
          .from('question_screen_settings')
          .insert([{
            review_forms_id: formId,
            header_image_url: headerImageUrl
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
      console.error('Error updating header image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ヘッダー画像ファイルをアップロードしてURLを更新
   * @param {string} formId - フォームID
   * @param {File} imageFile - アップロードする画像ファイル
   * @returns {Promise<Object>} アップロード＆更新結果
   */
  static async uploadAndUpdateHeaderImage(formId, imageFile) {
    try {
      console.log('Starting header image upload for form:', formId);

      // ファイル検証
      const validation = ImageUploadService.validateImageFile(imageFile);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 既存のヘッダー画像URLを取得（削除のため）
      const { data: existingSettings } = await supabase
        .from('question_screen_settings')
        .select('header_image_url')
        .eq('review_forms_id', formId)
        .single();

      // 画像をアップロード
      const uploadResult = await ImageUploadService.uploadHeaderImage(imageFile, formId);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // データベースを更新
      const updateResult = await this.updateHeaderImage(formId, uploadResult.data.url);
      if (!updateResult.success) {
        // アップロードした画像を削除
        await ImageUploadService.deleteImage(uploadResult.data.path);
        throw new Error(updateResult.error);
      }

      // 古い画像があれば削除
      if (existingSettings?.header_image_url) {
        await ImageUploadService.deleteImage(existingSettings.header_image_url);
      }

      console.log('Header image upload and update completed:', uploadResult.data.url);

      return {
        success: true,
        data: {
          url: uploadResult.data.url,
          fileName: uploadResult.data.fileName
        },
        error: null
      };

    } catch (error) {
      console.error('Header image upload and update error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * ロゴ画像ファイルをアップロードしてURLを更新
   * @param {string} formId - フォームID
   * @param {File} imageFile - アップロードする画像ファイル
   * @returns {Promise<Object>} アップロード＆更新結果
   */
  static async uploadAndUpdateLogoImage(formId, imageFile) {
    try {
      console.log('Starting logo image upload for form:', formId);

      // ファイル検証
      const validation = ImageUploadService.validateImageFile(imageFile);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 既存のロゴ画像URLを取得（削除のため）
      const { data: existingSettings } = await supabase
        .from('review_form_settings')
        .select('logo_image_url')
        .eq('review_form_id', formId)
        .single();

      // 画像をアップロード
      const uploadResult = await ImageUploadService.uploadLogoImage(imageFile, formId);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // データベースを更新
      const updateResult = await this.updateLogoImage(formId, uploadResult.data.url);
      if (!updateResult.success) {
        // アップロードした画像を削除
        await ImageUploadService.deleteImage(uploadResult.data.path);
        throw new Error(updateResult.error);
      }

      // 古い画像があれば削除（デフォルト画像は削除しない）
      if (existingSettings?.logo_image_url && 
          !existingSettings.logo_image_url.includes('OpenReviewWhiteThemeLoog.png')) {
        await ImageUploadService.deleteImage(existingSettings.logo_image_url);
      }

      console.log('Logo image upload and update completed:', uploadResult.data.url);

      return {
        success: true,
        data: {
          url: uploadResult.data.url,
          fileName: uploadResult.data.fileName
        },
        error: null
      };

    } catch (error) {
      console.error('Logo image upload and update error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
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

  /**
   * プロジェクトタイトルを更新
   * @param {string} formId - フォームID
   * @param {string} title - プロジェクトタイトル
   * @returns {Promise<Object>} 更新結果
   */
  static async updateProjectTitle(formId, title) {
    try {
      const { data, error } = await supabase
        .from('review_forms')
        .update({
          title: title,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId)
        .select()
        .single();

      if (error) {
        throw new Error(`プロジェクトタイトル更新エラー: ${error.message}`);
      }

      return {
        success: true,
        data,
        error: null
      };

    } catch (error) {
      console.error('Project title update error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * プロジェクトタイトルを取得
   * @param {string} formId - フォームID
   * @returns {Promise<Object>} 取得結果
   */
  static async getProjectTitle(formId) {
    try {
      const { data, error } = await supabase
        .from('review_forms')
        .select('title')
        .eq('id', formId)
        .single();

      if (error) {
        throw new Error(`プロジェクトタイトル取得エラー: ${error.message}`);
      }

      return {
        success: true,
        data: data?.title || '名称未設定',
        error: null
      };

    } catch (error) {
      console.error('Project title fetch error:', error);
      return {
        success: false,
        data: '名称未設定',
        error: error.message
      };
    }
  }

  /**
   * ログイン画面設定を取得
   * @param {string} formId - フォームID
   * @returns {Promise<Object>} ログイン画面設定データ
   */
  static async getLoginScreenSettings(formId) {
    try {
      const { data, error } = await supabase
        .from('login_screen_settings')
        .select('*')
        .eq('review_forms_id', formId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // データが存在しない場合はデフォルト設定を返す
          return {
            success: true,
            data: {
              id: null,
              review_forms_id: formId,
              background_image_url: 'https://img.freepik.com/premium-photo/generative-ai-illustration-luxury-stores-decorated-different-colors-with-beautiful-interior-design_58460-12582.jpg',
              title_text: '',
              detail_text: ''
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
      console.error('Error fetching login screen settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ログイン画面設定を更新または作成
   * @param {string} formId - フォームID
   * @param {Object} settings - 設定データ
   * @returns {Promise<Object>} 更新結果
   */
  static async updateLoginScreenSettings(formId, settings) {
    try {
      // 既存の設定があるかチェック
      const { data: existingSettings } = await supabase
        .from('login_screen_settings')
        .select('id')
        .eq('review_forms_id', formId)
        .single();

      let result;
      if (existingSettings) {
        // 更新
        result = await supabase
          .from('login_screen_settings')
          .update({
            ...settings
          })
          .eq('review_forms_id', formId)
          .select()
          .single();
      } else {
        // 新規作成
        result = await supabase
          .from('login_screen_settings')
          .insert([{
            review_forms_id: formId,
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
      console.error('Error updating login screen settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ログイン背景画像ファイルをアップロードしてURLを更新
   * @param {string} formId - フォームID
   * @param {File} imageFile - アップロードする画像ファイル
   * @returns {Promise<Object>} アップロード＆更新結果
   */
  static async uploadAndUpdateLoginBackgroundImage(formId, imageFile) {
    try {
      console.log('Starting login background image upload for form:', formId);

      // ファイル検証
      const validation = ImageUploadService.validateImageFile(imageFile);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 既存の背景画像URLを取得（削除のため）
      const { data: existingSettings } = await supabase
        .from('login_screen_settings')
        .select('background_image_url')
        .eq('review_forms_id', formId)
        .single();

      // 画像をアップロード
      const uploadResult = await ImageUploadService.uploadLoginBackgroundImage(imageFile, formId);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // データベースを更新
      const updateResult = await this.updateLoginScreenSettings(formId, { 
        background_image_url: uploadResult.data.url 
      });
      if (!updateResult.success) {
        // アップロードした画像を削除
        await ImageUploadService.deleteImage(uploadResult.data.path);
        throw new Error(updateResult.error);
      }

      // 古い画像があれば削除（デフォルト画像は削除しない）
      if (existingSettings?.background_image_url && 
          !existingSettings.background_image_url.includes('freepik.com')) {
        await ImageUploadService.deleteImage(existingSettings.background_image_url);
      }

      console.log('Login background image upload and update completed:', uploadResult.data.url);

      return {
        success: true,
        data: {
          url: uploadResult.data.url,
          fileName: uploadResult.data.fileName
        },
        error: null
      };

    } catch (error) {
      console.error('Login background image upload and update error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * ログインタイトルテキストを更新
   * @param {string} formId - フォームID
   * @param {string} titleText - タイトルテキスト
   * @returns {Promise<Object>} 更新結果
   */
  static async updateLoginTitleText(formId, titleText) {
    return await this.updateLoginScreenSettings(formId, { title_text: titleText });
  }

  /**
   * ログイン詳細テキストを更新
   * @param {string} formId - フォームID
   * @param {string} detailText - 詳細テキスト
   * @returns {Promise<Object>} 更新結果
   */
  static async updateLoginDetailText(formId, detailText) {
    return await this.updateLoginScreenSettings(formId, { detail_text: detailText });
  }

  /**
   * 完了画面設定を更新（ログイン画面と同じロジック）
   * @param {string} formId - フォームID
   * @param {Object} settings - 更新する設定
   * @returns {Promise<Object>} 更新結果
   */
  static async updateCompletionScreenSettings(formId, settings) {
    try {
      // 既存の設定があるかチェック
      const { data: existingSettings } = await supabase
        .from('completion_screen_settings')
        .select('id')
        .eq('review_forms_id', formId)
        .single();

      let result;
      if (existingSettings) {
        // 更新
        result = await supabase
          .from('completion_screen_settings')
          .update({
            ...settings
          })
          .eq('review_forms_id', formId)
          .select()
          .single();
      } else {
        // 新規作成
        result = await supabase
          .from('completion_screen_settings')
          .insert([{
            review_forms_id: formId,
            ...settings
          }])
          .select()
          .single();
      }

      const { data, error } = result;
      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
        error: null
      };
    } catch (error) {
      console.error('Error updating completion screen settings:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * 完了画面タイトルテキストを更新
   * @param {string} formId - フォームID
   * @param {string} titleText - タイトルテキスト
   * @returns {Promise<Object>} 更新結果
   */
  static async updateCompletionTitleText(formId, titleText) {
    return await this.updateCompletionScreenSettings(formId, { title_text: titleText });
  }

  /**
   * 完了画面詳細テキストを更新
   * @param {string} formId - フォームID
   * @param {string} detailText - 詳細テキスト
   * @returns {Promise<Object>} 更新結果
   */
  static async updateCompletionDetailText(formId, detailText) {
    return await this.updateCompletionScreenSettings(formId, { detail_text: detailText });
  }

  /**
   * 完了画面ボタン1の有効/無効を更新
   * @param {string} formId - フォームID
   * @param {boolean} enabled - 有効/無効
   * @returns {Promise<Object>} 更新結果
   */
  static async updateCompletionButton1Enabled(formId, enabled) {
    return await this.updateCompletionScreenSettings(formId, { is_button_1_enabled: enabled });
  }

  /**
   * 完了画面ボタン1のテキストを更新
   * @param {string} formId - フォームID
   * @param {string} buttonText - ボタンテキスト
   * @returns {Promise<Object>} 更新結果
   */
  static async updateCompletionButton1Text(formId, buttonText) {
    return await this.updateCompletionScreenSettings(formId, { button_text_1: buttonText });
  }

  /**
   * 完了画面ボタン1のURLを更新
   * @param {string} formId - フォームID
   * @param {string} buttonUrl - ボタンURL
   * @returns {Promise<Object>} 更新結果
   */
  static async updateCompletionButton1Url(formId, buttonUrl) {
    return await this.updateCompletionScreenSettings(formId, { button_url_1: buttonUrl });
  }

  /**
   * 完了画面の背景画像URLを更新
   * @param {string} formId - フォームID
   * @param {string} backgroundImageUrl - 背景画像URL
   * @returns {Promise<Object>} 更新結果
   */
  static async updateCompletionBackgroundImage(formId, backgroundImageUrl) {
    return await this.updateCompletionScreenSettings(formId, { background_image_url: backgroundImageUrl });
  }

  /**
   * 完了画面の背景画像をアップロードして更新（ログイン画面と同じロジック）
   * @param {string} formId - フォームID
   * @param {File} imageFile - 画像ファイル
   * @returns {Promise<Object>} アップロード結果
   */
  static async uploadAndUpdateCompletionBackgroundImage(formId, imageFile) {
    try {
      // 現在の設定を取得（古い画像削除のため）
      const { data: existingSettings } = await supabase
        .from('completion_screen_settings')
        .select('background_image_url')
        .eq('review_forms_id', formId)
        .single();

      // 画像をアップロード
      const uploadResult = await ImageUploadService.uploadLoginBackgroundImage(imageFile, formId);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // データベースを更新
      const updateResult = await this.updateCompletionScreenSettings(formId, { 
        background_image_url: uploadResult.data.url 
      });
      if (!updateResult.success) {
        // アップロードした画像を削除
        await ImageUploadService.deleteImage(uploadResult.data.path);
        throw new Error(updateResult.error);
      }

      // 古い画像があれば削除（デフォルト画像は削除しない）
      if (existingSettings?.background_image_url && 
          !existingSettings.background_image_url.includes('misezukuri.com')) {
        await ImageUploadService.deleteImage(existingSettings.background_image_url);
      }

      console.log('Completion background image upload and update completed:', uploadResult.data.url);

      return {
        success: true,
        data: {
          url: uploadResult.data.url,
          fileName: uploadResult.data.fileName
        },
        error: null
      };

    } catch (error) {
      console.error('Completion background image upload and update error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * フォームの公開状態を更新
   * @param {string} formId - フォームのID
   * @param {boolean} isPublished - 公開状態 (true: 公開, false: 非公開)
   * @returns {Promise<Object>} 更新結果
   */
  static async updateFormPublishStatus(formId, isPublished) {
    try {
      console.log('FormDataService.updateFormPublishStatus called with:', { formId, isPublished });
      
      const { data, error } = await supabase
        .from('review_forms')
        .update({ 
          is_published: isPublished,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Supabase update successful:', data);

      return {
        success: true,
        data: data,
        error: null
      };

    } catch (error) {
      console.error('Form publish status update error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * 単一フォームの基本データを取得
   * @param {string} formId - フォームのID
   * @returns {Promise<Object>} フォーム基本データ
   */
  static async getFormBasicData(formId) {
    try {
      const { data, error } = await supabase
        .from('review_forms')
        .select('id, title, is_published, created_at, updated_at, business_users')
        .eq('id', formId)
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data,
        error: null
      };

    } catch (error) {
      console.error('Form basic data fetch error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }
}

export default FormDataService;