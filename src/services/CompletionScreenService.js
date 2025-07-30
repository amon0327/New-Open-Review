import { supabase } from '../lib/supabase';

/**
 * 完了画面設定関連のサービス
 */
class CompletionScreenService {
  /**
   * 完了画面設定を取得
   * @param {string} formId - フォームID
   * @returns {Object} 完了画面設定データ
   */
  static async getCompletionScreenSettings(formId) {
    try {
      const { data, error } = await supabase
        .from('completion_screen_settings')
        .select('*')
        .eq('review_forms_id', formId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: Not found
        throw error;
      }

      return {
        success: true,
        data: data || {
          title_text: 'ありがとうございました！',
          detail_text: 'あなたの貴重なご意見をお聞かせいただき、ありがとうございました。いただいたフィードバックは今後のサービス向上に活用させていただきます。',
          background_image_url: 'https://misezukuri.com/wp-content/uploads/2023/10/b86e65d61ae3fbd3b3f1ec5c67484853.jpg',
          is_button_1_enabled: true,
          button_text_1: '完了',
          button_url_1: '#'
        }
      };
    } catch (error) {
      console.error('Error fetching completion screen settings:', error);
      return {
        success: false,
        error: error.message || '完了画面設定の取得に失敗しました'
      };
    }
  }

  /**
   * 完了画面設定を作成または更新
   * @param {string} formId - フォームID
   * @param {Object} settings - 設定データ
   * @returns {Object} 結果
   */
  static async upsertCompletionScreenSettings(formId, settings) {
    try {
      const { data, error } = await supabase
        .from('completion_screen_settings')
        .upsert({
          review_forms_id: formId,
          ...settings
        }, {
          onConflict: 'review_forms_id'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error upserting completion screen settings:', error);
      return {
        success: false,
        error: error.message || '完了画面設定の保存に失敗しました'
      };
    }
  }

  /**
   * タイトルテキストを更新
   * @param {string} formId - フォームID
   * @param {string} titleText - タイトルテキスト
   * @returns {Object} 結果
   */
  static async updateTitleText(formId, titleText) {
    return this.upsertCompletionScreenSettings(formId, {
      title_text: titleText
    });
  }

  /**
   * 詳細テキストを更新
   * @param {string} formId - フォームID
   * @param {string} detailText - 詳細テキスト
   * @returns {Object} 結果
   */
  static async updateDetailText(formId, detailText) {
    return this.upsertCompletionScreenSettings(formId, {
      detail_text: detailText
    });
  }

  /**
   * 背景画像URLを更新
   * @param {string} formId - フォームID
   * @param {string} backgroundImageUrl - 背景画像URL
   * @returns {Object} 結果
   */
  static async updateBackgroundImage(formId, backgroundImageUrl) {
    return this.upsertCompletionScreenSettings(formId, {
      background_image_url: backgroundImageUrl
    });
  }

  /**
   * ボタン1の有効/無効を更新
   * @param {string} formId - フォームID
   * @param {boolean} isEnabled - ボタン有効/無効
   * @returns {Object} 結果
   */
  static async updateButton1Enabled(formId, isEnabled) {
    return this.upsertCompletionScreenSettings(formId, {
      is_button_1_enabled: isEnabled
    });
  }

  /**
   * ボタン1のテキストを更新
   * @param {string} formId - フォームID
   * @param {string} buttonText - ボタンテキスト
   * @returns {Object} 結果
   */
  static async updateButton1Text(formId, buttonText) {
    return this.upsertCompletionScreenSettings(formId, {
      button_text_1: buttonText
    });
  }

  /**
   * ボタン1のURLを更新
   * @param {string} formId - フォームID
   * @param {string} buttonUrl - ボタンURL
   * @returns {Object} 結果
   */
  static async updateButton1Url(formId, buttonUrl) {
    return this.upsertCompletionScreenSettings(formId, {
      button_url_1: buttonUrl
    });
  }

  /**
   * 完了背景画像をアップロードして更新
   * @param {string} formId - フォームID
   * @param {File} imageFile - 画像ファイル
   * @returns {Object} 結果
   */
  static async uploadAndUpdateBackgroundImage(formId, imageFile) {
    try {
      // ファイル名を生成
      const timestamp = Date.now();
      const fileName = `completion-bg-${formId}-${timestamp}.${imageFile.name.split('.').pop()}`;
      const filePath = `completion-backgrounds/${fileName}`;

      // Supabase Storageにアップロード
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('form-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('form-images')
        .getPublicUrl(filePath);

      // データベースを更新
      const updateResult = await this.updateBackgroundImage(formId, publicUrl);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }

      return {
        success: true,
        data: {
          url: publicUrl,
          filePath: filePath
        }
      };
    } catch (error) {
      console.error('Error uploading completion background image:', error);
      return {
        success: false,
        error: error.message || '完了背景画像のアップロードに失敗しました'
      };
    }
  }

  /**
   * 完了画面の全データを取得（プレビュー用）
   * @param {string} formId - フォームID
   * @returns {Object} 完了画面データ
   */
  static async getCompletionPageData(formId) {
    try {
      // 完了画面設定を取得
      const completionSettings = await this.getCompletionScreenSettings(formId);
      
      // フォーム基本設定を取得（テーマカラー、ロゴなど）
      const { data: formData, error: formError } = await supabase
        .from('review_forms')
        .select('theme_color, logo_image_url')
        .eq('id', formId)
        .single();

      if (formError && formError.code !== 'PGRST116') {
        throw formError;
      }

      return {
        completionSettings: completionSettings.success ? completionSettings.data : null,
        formSettings: formData || {
          theme_color: '#5e17eb',
          logo_image_url: 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png'
        }
      };
    } catch (error) {
      console.error('Error getting completion page data:', error);
      throw error;
    }
  }
}

export default CompletionScreenService;