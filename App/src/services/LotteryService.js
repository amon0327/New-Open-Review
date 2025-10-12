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
      
      const { data, error } = await supabase
        .from('lottery')
        .update({
          max_wins_per_month,
          win_rate_divisor,
          updated_at: new Date().toISOString()
        })
        .eq('review_form_id', formId)
        .select()
        .single();

      if (error) {
        console.error('抽選設定更新エラー:', error);
        throw error;
      }

      return data;
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

  static async incrementTrials(formId) {
    try {
      const { data, error } = await supabase
        .rpc('increment_lottery_trials', {
          form_id: formId
        });

      if (error) {
        console.error('試行回数増加エラー:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('試行回数増加処理エラー:', error);
      throw error;
    }
  }

  static async incrementWins(formId) {
    try {
      const { data, error } = await supabase
        .rpc('increment_lottery_wins', {
          form_id: formId
        });

      if (error) {
        console.error('当選回数増加エラー:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('当選回数増加処理エラー:', error);
      throw error;
    }
  }

  static async checkLotteryEligibility(formId) {
    try {
      const lottery = await this.getLotteryByFormId(formId);
      
      if (!lottery) {
        return { eligible: false, reason: 'lottery_not_found' };
      }

      if (lottery.current_wins >= lottery.max_wins_per_month) {
        return { 
          eligible: false, 
          reason: 'max_wins_reached',
          currentWins: lottery.current_wins,
          maxWins: lottery.max_wins_per_month
        };
      }

      return { 
        eligible: true, 
        lottery,
        winRate: 1 / lottery.win_rate_divisor
      };
    } catch (error) {
      console.error('抽選資格確認処理エラー:', error);
      throw error;
    }
  }

  static async executeLottery(formId) {
    try {
      const eligibility = await this.checkLotteryEligibility(formId);
      
      if (!eligibility.eligible) {
        return {
          success: false,
          won: false,
          reason: eligibility.reason,
          ...eligibility
        };
      }

      await this.incrementTrials(formId);

      const randomValue = Math.random();
      const winRate = eligibility.winRate;
      const won = randomValue < winRate;

      if (won) {
        await this.incrementWins(formId);
      }

      return {
        success: true,
        won,
        winRate,
        randomValue,
        lottery: eligibility.lottery
      };
    } catch (error) {
      console.error('抽選実行処理エラー:', error);
      throw error;
    }
  }

  static async resetMonthlyStats(formId) {
    try {
      const { data, error } = await supabase
        .from('lottery')
        .update({
          current_wins: 0,
          current_trials: 0,
          updated_at: new Date().toISOString()
        })
        .eq('review_form_id', formId)
        .select()
        .single();

      if (error) {
        console.error('月間統計リセットエラー:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('月間統計リセット処理エラー:', error);
      throw error;
    }
  }
}

export default LotteryService;