import { supabase } from '../lib/supabase';

export class LotteryService {
  static async getLotteryByFormId(formId) {
    try {
      const { data, error } = await supabase
        .from('lottery')
        .select('*')
        .eq('review_form_id', formId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('抽選設定取得エラー:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('抽選設定取得処理エラー:', error);
      throw error;
    }
  }

  static async updateLotterySettings(formId, settings) {
    try {
      const { max_wins_per_month, win_rate_divisor } = settings;

      console.log('抽選設定更新開始 (Edge Function経由):', {
        formId,
        max_wins_per_month,
        win_rate_divisor
      });

      // セッションを取得して認証ヘッダーを設定
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('セッションが見つかりません。再度ログインしてください。');
      }

      // Edge Functionを呼び出し
      const { data: response, error } = await supabase.functions.invoke('update-lottery-settings', {
        body: {
          review_form_id: formId,
          max_wins_per_month: max_wins_per_month,
          win_rate_divisor: win_rate_divisor
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Edge Function呼び出しエラー:', error);
        throw new Error(error.message || '抽選設定の更新に失敗しました');
      }

      if (!response.success) {
        console.error('Edge Function実行エラー:', response.error);
        throw new Error(response.error || '抽選設定の更新に失敗しました');
      }

      console.log('更新成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('抽選設定更新処理エラー:', error);
      throw error;
    }
  }

  static async createLotteryForForm(formId, settings = {}) {
    try {
      const defaultSettings = {
        max_wins_per_month: 1,
        win_rate_divisor: 1000,
        current_wins: 0,
        current_trials: 0,
        ...settings
      };

      const { data, error } = await supabase
        .from('lottery')
        .insert([{
          review_form_id: formId,
          max_wins_per_month: defaultSettings.max_wins_per_month,
          win_rate_divisor: defaultSettings.win_rate_divisor,
          current_wins: defaultSettings.current_wins,
          current_trials: defaultSettings.current_trials
        }])
        .select()
        .single();

      if (error) {
        console.error('抽選設定作成エラー:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('抽選設定作成処理エラー:', error);
      throw error;
    }
  }

}

export default LotteryService;