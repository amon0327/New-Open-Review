import { supabase } from '../supabaseClient';

// ログイン画面設定を取得する関数
export const getLoginScreenSettings = async (reviewFormId) => {
  try {
    const { data, error } = await supabase
      .from('login_screen_settings')
      .select('*')
      .eq('review_forms_id', reviewFormId)
      .single();

    if (error) {
      // データが存在しない場合はnullを返す（デフォルト値を使用）
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching login screen settings:', error);
    return null;
  }
};

// レビューフォーム設定を取得する関数（ロゴとテーマ色）
export const getReviewFormSettings = async (reviewFormId) => {
  try {
    const { data, error } = await supabase
      .from('review_form_settings')
      .select('*')
      .eq('review_form_id', reviewFormId)
      .single();

    if (error) {
      // データが存在しない場合はnullを返す（デフォルト値を使用）
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching review form settings:', error);
    return null;
  }
};

// ログイン画面とレビューフォーム設定を両方取得する関数
export const getLoginPageData = async (reviewFormId) => {
  try {
    const [loginSettings, formSettings] = await Promise.all([
      getLoginScreenSettings(reviewFormId),
      getReviewFormSettings(reviewFormId)
    ]);

    // デフォルト値
    const defaultLoginSettings = {
      background_image_url: 'https://img.freepik.com/premium-photo/generative-ai-illustration-luxury-stores-decorated-different-colors-with-beautiful-interior-design_58460-12582.jpg',
      title_text: 'OpenReviewへようこそ！',
      detail_text: 'あなたの目的に合わせたレビュー項目を設定できます\n質問項目を追加して、最適なレビューを作成しましょう'
    };

    const defaultFormSettings = {
      logo_image_url: 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png',
      is_dark_mode: false,
      theme_color: '#5e17eb'
    };

    return {
      loginSettings: loginSettings || defaultLoginSettings,
      formSettings: formSettings || defaultFormSettings
    };
  } catch (error) {
    console.error('Error fetching login page data:', error);
    // エラーの場合はデフォルト値を返す
    return {
      loginSettings: {
        background_image_url: 'https://img.freepik.com/premium-photo/generative-ai-illustration-luxury-stores-decorated-different-colors-with-beautiful-interior-design_58460-12582.jpg',
        title_text: 'OpenReviewへようこそ！',
        detail_text: 'あなたの目的に合わせたレビュー項目を設定できます\n質問項目を追加して、最適なレビューを作成しましょう'
      },
      formSettings: {
        logo_image_url: 'https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewWhiteThemeLoog.png',
        is_dark_mode: false,
        theme_color: '#5e17eb'
      }
    };
  }
};