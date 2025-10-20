import { supabase } from '../lib/supabase';

export class QuestionDisplayService {
  
  // 質問表示設定の作成
  static async createDisplaySetting(reviewQuestionId, displayName) {
    try {
      const { data, error } = await supabase
        .from('question_display_settings')
        .insert([
          {
            review_question_id: reviewQuestionId,
            display_name: displayName
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('質問表示設定の作成に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 質問表示設定の取得
  static async getDisplaySettings() {
    try {
      const { data, error } = await supabase
        .from('question_display_settings')
        .select(`
          *,
          review_questions (
            id,
            question_text,
            question_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('質問表示設定の取得に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 特定の質問の表示設定を取得
  static async getDisplaySettingByQuestionId(reviewQuestionId) {
    try {
      const { data, error } = await supabase
        .from('question_display_settings')
        .select('*')
        .eq('review_question_id', reviewQuestionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      console.error('質問表示設定の取得に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 質問表示設定の更新
  static async updateDisplaySetting(id, updates) {
    try {
      const { data, error } = await supabase
        .from('question_display_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('質問表示設定の更新に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 質問表示設定の削除
  static async deleteDisplaySetting(id) {
    try {
      // まず関連するルール設定を削除
      await this.deleteRuleSettingsByDisplaySettingId(id);

      const { error } = await supabase
        .from('question_display_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('質問表示設定の削除に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // ルール設定の作成（質問タイプ3,5,8用）
  static async createRuleSetting(questionDisplaySettingsId, npsSegments = null, questionOptionChoicesId = null) {
    try {
      const { data, error } = await supabase
        .from('question_display_rule_settings')
        .insert([
          {
            question_display_settings_id: questionDisplaySettingsId,
            nps_segments: npsSegments,
            question_option_choices_id: questionOptionChoicesId
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('ルール設定の作成に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // ルール設定の取得
  static async getRuleSettings(questionDisplaySettingsId) {
    try {
      const { data, error } = await supabase
        .from('question_display_rule_settings')
        .select(`
          *,
          question_option_choices (
            id,
            option_text
          )
        `)
        .eq('question_display_settings_id', questionDisplaySettingsId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('ルール設定の取得に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // ルール設定の更新
  static async updateRuleSetting(id, updates) {
    try {
      const { data, error } = await supabase
        .from('question_display_rule_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('ルール設定の更新に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // ルール設定の削除
  static async deleteRuleSetting(id) {
    try {
      const { error } = await supabase
        .from('question_display_rule_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('ルール設定の削除に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 表示設定IDに関連するすべてのルール設定を削除
  static async deleteRuleSettingsByDisplaySettingId(questionDisplaySettingsId) {
    try {
      const { error } = await supabase
        .from('question_display_rule_settings')
        .delete()
        .eq('question_display_settings_id', questionDisplaySettingsId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('ルール設定の削除に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 質問タイプに基づいてルール設定が必要かチェック
  static needsRuleSettings(questionType) {
    return [3, 5, 8].includes(questionType);
  }

  // 質問の選択肢を取得（質問タイプ3,5,8の場合）
  static async getQuestionOptions(reviewQuestionId) {
    try {
      const { data, error } = await supabase
        .from('question_option_choices')
        .select('*')
        .eq('review_question_id', reviewQuestionId)
        .order('option_order', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('質問選択肢の取得に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // NPSセグメントの定義を取得
  static getNpsSegments() {
    return [
      { value: 'promoter', label: 'Promoter (9-10点)', description: '推奨者' },
      { value: 'passive', label: 'Passive (7-8点)', description: '中立者' },
      { value: 'detractor', label: 'Detractor (0-6点)', description: '批判者' }
    ];
  }

  // 質問と表示設定をまとめて取得
  static async getQuestionsWithDisplaySettings() {
    try {
      // まず質問を取得
      const { data: questions, error: questionsError } = await supabase
        .from('review_questions')
        .select(`
          id,
          question_text,
          question_type,
          question_display_settings (
            id,
            display_name,
            created_at,
            question_display_rule_settings (
              id,
              nps_segments,
              question_option_choices_id,
              question_option_choices (
                id,
                option_text
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;

      return { success: true, data: questions };
    } catch (error) {
      console.error('質問と表示設定の取得に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 表示設定付きの質問を完全に削除（表示設定とルール設定も含む）
  static async deleteQuestionWithDisplaySettings(reviewQuestionId) {
    try {
      // トランザクション的な処理
      // 1. 表示設定を取得
      const displaySettingsResult = await this.getDisplaySettingByQuestionId(reviewQuestionId);
      
      if (displaySettingsResult.success && displaySettingsResult.data) {
        // 2. ルール設定を削除
        await this.deleteRuleSettingsByDisplaySettingId(displaySettingsResult.data.id);
        
        // 3. 表示設定を削除
        await this.deleteDisplaySetting(displaySettingsResult.data.id);
      }

      return { success: true };
    } catch (error) {
      console.error('質問と関連設定の削除に失敗:', error);
      return { success: false, error: error.message };
    }
  }
}

export default QuestionDisplayService;