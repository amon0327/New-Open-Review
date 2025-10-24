import { supabase } from '../lib/supabase';

export class QuestionDisplayService {
  
  // 質問表示設定の作成
  static async createDisplaySetting(reviewQuestionId, displayName) {
    try {
      console.log('=== 表示設定作成開始 ===');
      console.log('パラメータ:', { reviewQuestionId, displayName });
      
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

      console.log('表示設定作成結果:', { data, error });

      if (error) {
        console.error('表示設定作成エラー詳細:', error);
        throw error;
      }
      
      console.log('表示設定作成成功:', data);
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
            choice_name
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
  static needsRuleSettings(questionTypesId) {
    // 質問タイプID 3,5,8 がルール設定が必要なタイプと仮定
    // 実際のquestion_typesテーブルの構造に応じて調整が必要
    return [3, 5, 8].includes(questionTypesId);
  }

  // 質問の選択肢を取得（質問タイプ3,5,8の場合）
  static async getQuestionOptions(reviewQuestionId) {
    try {
      const { data, error } = await supabase
        .from('question_option_choices')
        .select('*')
        .eq('review_questions_id', reviewQuestionId)
        .order('choice_number', { ascending: true });

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
      { value: 'promoter', label: '推奨者', description: '推奨者' },
      { value: 'passive', label: '中立者', description: '中立者' },
      { value: 'detractor', label: '批判者', description: '批判者' }
    ];
  }

  // 質問選択肢を3つのカテゴリに強制分類
  static categorizeQuestionChoices(choices) {
    if (!choices || choices.length === 0) {
      return { promoter: [], passive: [], detractor: [] };
    }

    // 選択肢数に応じて自動分類
    const total = choices.length;
    let promoterCount, passiveCount, detractorCount;

    if (total <= 3) {
      // 3つ以下の場合は均等分散
      promoterCount = Math.floor(total / 3);
      passiveCount = Math.floor(total / 3);
      detractorCount = total - promoterCount - passiveCount;
    } else if (total <= 5) {
      // 5つ以下の場合は1:1:3 または 1:2:2 の分布
      promoterCount = 1;
      passiveCount = total <= 4 ? 1 : 2;
      detractorCount = total - promoterCount - passiveCount;
    } else {
      // 6つ以上の場合は約1/3ずつ分配
      promoterCount = Math.ceil(total / 3);
      passiveCount = Math.ceil((total - promoterCount) / 2);
      detractorCount = total - promoterCount - passiveCount;
    }

    const categorized = {
      promoter: choices.slice(0, promoterCount),
      passive: choices.slice(promoterCount, promoterCount + passiveCount),
      detractor: choices.slice(promoterCount + passiveCount)
    };

    return categorized;
  }

  // 質問選択肢のカテゴリ分類を保存
  static async saveChoiceCategorization(reviewQuestionId, categorization) {
    try {
      // 既存のカテゴリ分類を削除
      await supabase
        .from('question_choice_categorization')
        .delete()
        .eq('review_question_id', reviewQuestionId);

      // 新しいカテゴリ分類を保存
      const insertData = [];
      
      Object.entries(categorization).forEach(([category, choices]) => {
        choices.forEach(choice => {
          insertData.push({
            review_question_id: reviewQuestionId,
            choice_id: choice.id,
            category: category
          });
        });
      });

      if (insertData.length > 0) {
        const { data, error } = await supabase
          .from('question_choice_categorization')
          .insert(insertData)
          .select();

        if (error) throw error;
        return { success: true, data };
      }

      return { success: true, data: [] };
    } catch (error) {
      console.error('選択肢カテゴリ分類の保存に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // レビューフォーム一覧を取得
  static async getReviewForms() {
    try {
      const { data, error } = await supabase
        .from('review_forms')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          is_published,
          is_deleted
        `)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // 各フォームの質問数を取得
      const formsWithQuestionCount = await Promise.all(
        data.map(async (form) => {
          try {
            const { data: questions, error: questionsError } = await supabase
              .from('review_questions')
              .select('id')
              .eq('review_fome_id', form.id);
            
            return {
              ...form,
              question_count: questionsError ? 0 : (questions?.length || 0)
            };
          } catch (err) {
            console.error(`フォーム ${form.id} の質問数取得エラー:`, err);
            return {
              ...form,
              question_count: 0
            };
          }
        })
      );

      console.log('取得したフォーム一覧:', formsWithQuestionCount);
      return { success: true, data: formsWithQuestionCount };
    } catch (error) {
      console.error('フォーム一覧の取得に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 指定されたフォームの質問を取得
  static async getQuestionsByFormId(formId) {
    try {
      const { data, error } = await supabase
        .from('review_questions')
        .select(`
          id,
          question_text,
          question_number,
          is_required,
          question_detail_text,
          is_detail_enabled,
          created_at,
          question_types_id,
          question_categories_id,
          question_subcategories_id,
          review_fome_id
        `)
        .eq('review_fome_id', formId)
        .order('question_number', { ascending: true });

      if (error) throw error;
      
      console.log(`フォーム ${formId} の質問データ:`, data);
      return { success: true, data };
    } catch (error) {
      console.error('質問の取得に失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // すべての質問を取得（後方互換性のため残す）
  static async getAllQuestions() {
    try {
      const { data, error } = await supabase
        .from('review_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabaseエラー:', error);
        throw error;
      }
      
      console.log('取得した質問データ (raw):', data);
      console.log('データ件数:', data?.length || 0);
      
      return { success: true, data };
    } catch (error) {
      console.error('質問の取得に失敗:', error);
      return { success: false, error: error.message };
    }
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
          question_types_id,
          created_at,
          updated_at,
          question_types!review_questions_question_types_id_fkey (
            id,
            name,
            japanese
          ),
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

  // 表示設定済みの質問のみを取得
  static async getQuestionsWithDisplaySettingsOnly() {
    try {
      console.log('=== 表示設定済み質問取得開始 ===');
      
      const { data, error } = await supabase
        .from('question_display_settings')
        .select(`
          id,
          display_name,
          created_at,
          review_questions (
            id,
            question_text,
            question_types_id,
            question_types!review_questions_question_types_id_fkey (
              id,
              name,
              japanese
            )
          ),
          question_display_rule_settings (
            id,
            nps_segments,
            question_option_choices_id,
            question_option_choices (
              id,
              choice_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Supabaseクエリ結果:', { data, error });
      console.log('取得した表示設定の件数:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('表示設定詳細:', data);
      }

      if (error) {
        console.error('Supabaseクエリエラー:', error);
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('表示設定済み質問の取得に失敗:', error);
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