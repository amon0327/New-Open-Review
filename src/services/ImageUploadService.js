import { supabase } from '../lib/supabase';

/**
 * 画像アップロードに関するサービスクラス
 */
export class ImageUploadService {
  /**
   * ヘッダー画像をSupabaseストレージにアップロードしてURLを取得
   * @param {File} file - アップロードする画像ファイル
   * @param {string} formId - フォームID
   * @returns {Promise<Object>} アップロード結果とURL
   */
  static async uploadHeaderImage(file, formId) {
    try {
      // ファイル名を生成（重複を避けるため）
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `header-${formId}-${timestamp}.${fileExtension}`;
      const filePath = `header-image/${fileName}`;

      console.log('Uploading header image:', { fileName, filePath, fileSize: file.size });

      // Supabaseストレージにアップロード
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('review-form-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`ヘッダー画像アップロードエラー: ${uploadError.message}`);
      }

      // パブリックURLを取得
      const { data: urlData } = supabase.storage
        .from('review-form-assets')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('Header image uploaded successfully:', publicUrl);

      return {
        success: true,
        data: {
          url: publicUrl,
          path: filePath,
          fileName: fileName
        },
        error: null
      };

    } catch (error) {
      console.error('Header image upload error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * ロゴ画像をSupabaseストレージにアップロードしてURLを取得
   * @param {File} file - アップロードする画像ファイル
   * @param {string} formId - フォームID
   * @returns {Promise<Object>} アップロード結果とURL
   */
  static async uploadLogoImage(file, formId) {
    try {
      // ファイル名を生成（重複を避けるため）
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `logo-${formId}-${timestamp}.${fileExtension}`;
      const filePath = `logo/${fileName}`;

      console.log('Uploading logo image:', { fileName, filePath, fileSize: file.size });

      // Supabaseストレージにアップロード
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('review-form-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`ロゴ画像アップロードエラー: ${uploadError.message}`);
      }

      // パブリックURLを取得
      const { data: urlData } = supabase.storage
        .from('review-form-assets')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('Logo image uploaded successfully:', publicUrl);

      return {
        success: true,
        data: {
          url: publicUrl,
          path: filePath,
          fileName: fileName
        },
        error: null
      };

    } catch (error) {
      console.error('Logo image upload error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * ログイン背景画像をSupabaseストレージにアップロードしてURLを取得
   * @param {File} file - アップロードする画像ファイル
   * @param {string} formId - フォームID
   * @returns {Promise<Object>} アップロード結果とURL
   */
  static async uploadLoginBackgroundImage(file, formId) {
    try {
      // ファイル名を生成（重複を避けるため）
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `login-bg-${formId}-${timestamp}.${fileExtension}`;
      const filePath = `background-image/${fileName}`;

      console.log('Uploading login background image:', { fileName, filePath, fileSize: file.size });

      // Supabaseストレージにアップロード
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('review-form-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`ログイン背景画像アップロードエラー: ${uploadError.message}`);
      }

      // パブリックURLを取得
      const { data: urlData } = supabase.storage
        .from('review-form-assets')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('Login background image uploaded successfully:', publicUrl);

      return {
        success: true,
        data: {
          url: publicUrl,
          path: filePath,
          fileName: fileName
        },
        error: null
      };

    } catch (error) {
      console.error('Login background image upload error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * 古い画像ファイルを削除
   * @param {string} filePath - 削除するファイルのパス
   * @returns {Promise<Object>} 削除結果
   */
  static async deleteImage(filePath) {
    try {
      if (!filePath) {
        return { success: true, error: null };
      }

      // review-form-assetsバケットからのパスを抽出
      const pathParts = filePath.split('/storage/v1/object/public/review-form-assets/');
      const actualPath = pathParts.length > 1 ? pathParts[1] : filePath;

      console.log('Deleting image:', actualPath);

      const { error } = await supabase.storage
        .from('review-form-assets')
        .remove([actualPath]);

      if (error) {
        console.warn('Image deletion warning:', error.message);
        // 削除エラーは警告として扱い、処理を続行
      }

      return {
        success: true,
        error: null
      };

    } catch (error) {
      console.error('Image deletion error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 画像ファイルの検証
   * @param {File} file - 検証するファイル
   * @returns {Object} 検証結果
   */
  static validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!file) {
      return { valid: false, error: 'ファイルが選択されていません' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'JPEG、PNG、WebP形式の画像ファイルのみ対応しています' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'ファイルサイズは5MB以下にしてください' };
    }

    return { valid: true, error: null };
  }
}

export default ImageUploadService;