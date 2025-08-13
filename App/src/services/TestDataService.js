import { supabase } from '../lib/supabase';

// テストデータ投入サービス
export class TestDataService {
  
  // 完全なテストデータセットを作成（テストテーブル用）
  static async createCompleteTestDataSet() {
    try {
      console.log('完全なテストデータセット作成開始');
      
      // 1. テストビジネスユーザー作成
      const businessUser = await this.createTestBusinessUser();
      if (!businessUser.success) {
        throw new Error(`ビジネスユーザー作成失敗: ${businessUser.error}`);
      }
      
      // 2. テストユーザー作成
      const testUser = await this.createTestUser();
      if (!testUser.success) {
        throw new Error(`ユーザー作成失敗: ${testUser.error}`);
      }
      
      // 3. テストレビューフォーム作成
      const reviewForm = await this.createTestReviewForm(businessUser.data.id);
      if (!reviewForm.success) {
        throw new Error(`レビューフォーム作成失敗: ${reviewForm.error}`);
      }
      
      // 4. テストページ作成
      const formPage = await this.createTestFormPage(reviewForm.data.id);
      if (!formPage.success) {
        throw new Error(`フォームページ作成失敗: ${formPage.error}`);
      }
      
      // 5. テストテキスト質問作成
      const textQuestion = await this.createTestTextQuestion(reviewForm.data.id, formPage.data.id);
      if (!textQuestion.success) {
        throw new Error(`テキスト質問作成失敗: ${textQuestion.error}`);
      }
      
      // 6. テストフォーム回答作成
      const formSubmissions = await this.createTestFormSubmissions(reviewForm.data.id, testUser.data.id);
      if (!formSubmissions.success) {
        throw new Error(`フォーム回答作成失敗: ${formSubmissions.error}`);
      }
      
      // 7. テスト質問回答とテキスト回答作成
      const textAnswers = await this.createTestTextAnswersWithRelations(
        formSubmissions.data, 
        textQuestion.data.id
      );
      if (!textAnswers.success) {
        throw new Error(`テキスト回答作成失敗: ${textAnswers.error}`);
      }
      
      console.log('完全なテストデータセット作成完了');
      return {
        success: true,
        data: {
          businessUser: businessUser.data,
          testUser: testUser.data,
          reviewForm: reviewForm.data,
          formPage: formPage.data,
          textQuestion: textQuestion.data,
          formSubmissions: formSubmissions.data,
          textAnswers: textAnswers.data
        }
      };
      
    } catch (error) {
      console.error('完全なテストデータセット作成エラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // テストビジネスユーザー作成
  static async createTestBusinessUser() {
    try {
      const { data, error } = await supabase
        .from('test_business_users')
        .insert({
          name: 'テスト企業ユーザー',
          email: 'test-business@example.com'
        })
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('テストビジネスユーザー作成エラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // テストユーザー作成
  static async createTestUser() {
    try {
      const { data, error } = await supabase
        .from('test_users')
        .insert({
          name: 'テストユーザー',
          email: 'test-user@example.com'
        })
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('テストユーザー作成エラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // テストレビューフォーム作成
  static async createTestReviewForm(businessUserId) {
    try {
      const { data, error } = await supabase
        .from('test_review_forms')
        .insert({
          business_users: businessUserId,
          title: 'テスト商品レビューフォーム',
          is_published: true
        })
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('テストレビューフォーム作成エラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // テストフォームページ作成
  static async createTestFormPage(reviewFormId) {
    try {
      const { data, error } = await supabase
        .from('test_review_form_pages')
        .insert({
          review_forms_id: reviewFormId,
          page_number: 1,
          name: 'メインページ'
        })
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('テストフォームページ作成エラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // テストテキスト質問作成
  static async createTestTextQuestion(reviewFormId, formPageId) {
    try {
      const { data, error } = await supabase
        .from('test_review_questions')
        .insert({
          review_fome_id: reviewFormId,
          review_form_pages_id: formPageId,
          question_text: '商品についてのご感想をお聞かせください',
          question_types_id: 2, // 長文回答
          question_categories_id: 1, // 基本情報
          question_number: 1,
          is_required: true
        })
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('テストテキスト質問作成エラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // テストフォーム回答作成（複数）
  static async createTestFormSubmissions(reviewFormId, userId) {
    try {
      const submissions = Array.from({ length: 10 }, (_, i) => ({
        review_forms_id: reviewFormId,
        users: userId,
        created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString() // 10日前から1日ずつ
      }));
      
      const { data, error } = await supabase
        .from('test_review_form_submissions')
        .insert(submissions)
        .select();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('テストフォーム回答作成エラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // テスト質問回答とテキスト回答作成
  static async createTestTextAnswersWithRelations(formSubmissions, questionId) {
    try {
      const textContents = [
        "商品の品質が非常に良く、期待以上でした。特にパッケージングが丁寧で好印象です。リピート購入を検討しています。",
        "価格に対して満足のいく内容でした。今後もリピートしたいと思います。配送も迅速で助かりました。",
        "配送が早くて助かりました。商品も想像通りで良かったです。梱包も丁寧でした。",
        "思っていたより小さかったですが、品質は良好です。説明文をもう少し詳しく書いてもらえると良いかもしれません。",
        "色が写真と少し違いましたが、使い心地は良いです。全体的には満足しています。",
        "スタッフの対応が親切で、安心して利用できました。また機会があれば利用したいと思います。",
        "初回利用でしたが、思った以上に良いサービスでした。友人にも勧めたいと思います。",
        "デザインが気に入りました。機能性も十分で、日常使いにぴったりです。",
        "期待していた通りの商品でした。次回も同じシリーズを購入したいと考えています。",
        "少し高めの価格設定ですが、品質を考えると妥当だと思います。長く使えそうです。"
      ];
      
      const allResults = [];
      
      for (let i = 0; i < formSubmissions.length; i++) {
        const submission = formSubmissions[i];
        const textContent = textContents[i];
        
        // 1. テスト質問回答作成
        const { data: questionAnswer, error: qaError } = await supabase
          .from('test_review_question_answers')
          .insert({
            review_form_submissions_id: submission.id,
            review_questions_id: questionId,
            created_at: submission.created_at
          })
          .select()
          .single();
        
        if (qaError) {
          console.error('質問回答作成エラー:', qaError);
          continue;
        }
        
        // 2. テストテキスト回答作成
        const { data: textAnswer, error: taError } = await supabase
          .from('test_question_answer_texts')
          .insert({
            review_questions_answers_id: questionAnswer.id,
            answer_text: textContent,
            created_at: submission.created_at
          })
          .select()
          .single();
        
        if (taError) {
          console.error('テキスト回答作成エラー:', taError);
          continue;
        }
        
        allResults.push({
          questionAnswer,
          textAnswer
        });
      }
      
      return { success: true, data: allResults };
    } catch (error) {
      console.error('テキスト回答関連作成エラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 既存テストデータ削除
  static async clearAllTestData() {
    try {
      console.log('全テストデータ削除開始');
      
      // 逆順で削除（外部キー制約を考慮）
      const tables = [
        'test_question_answer_texts',
        'test_question_answer_option_choices',
        'test_question_answer_option_linear_scale',
        'test_review_question_answers',
        'test_review_form_submissions',
        'test_question_option_choices',
        'test_question_option_linear_scale',
        'test_review_questions',
        'test_review_form_pages',
        'test_review_forms',
        'test_business_users',
        'test_users'
      ];
      
      for (const table of tables) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // 全削除
          
          if (error) {
            console.warn(`${table}削除エラー:`, error);
          } else {
            console.log(`${table}削除完了`);
          }
        } catch (tableError) {
          console.warn(`${table}削除でエラー:`, tableError);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('全テストデータ削除エラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 既存のテストデータを削除
  static async clearTestTextAnswers() {
    try {
      console.log('既存テストデータ削除開始');
      
      const { error } = await supabase
        .from('question_answer_texts')
        .delete()
        .like('answer_text', '%商品の品質が非常に良く%');
      
      if (error) {
        console.error('テストデータ削除エラー:', error);
        return { success: false, error: error.message };
      }
      
      console.log('既存テストデータ削除完了');
      return { success: true };
      
    } catch (error) {
      console.error('テストデータ削除処理エラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // データベースの接続確認
  static async testConnection() {
    try {
      console.log('データベース接続テスト開始');
      
      const { data, error } = await supabase
        .from('question_answer_texts')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('接続テストエラー:', error);
        return { success: false, error: error.message };
      }
      
      console.log('データベース接続テスト成功');
      return { success: true, data };
      
    } catch (error) {
      console.error('接続テスト処理エラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 現在のデータ件数を確認
  static async getDataCount() {
    try {
      const { count, error } = await supabase
        .from('question_answer_texts')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('データ件数取得エラー:', error);
        return { success: false, error: error.message };
      }
      
      console.log('現在のテキスト回答データ件数:', count);
      return { success: true, count };
      
    } catch (error) {
      console.error('データ件数取得処理エラー:', error);
      return { success: false, error: error.message };
    }
  }
  
  // テストデータの初期化（削除→作成）
  static async initializeTestData() {
    try {
      console.log('テストデータ初期化開始');
      
      // 1. 接続確認
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        return { success: false, error: 'データベース接続に失敗しました' };
      }
      
      // 2. 既存データ件数確認
      const countResult = await this.getDataCount();
      console.log('初期化前のデータ件数:', countResult);
      
      // 3. 既存テストデータ削除
      const clearResult = await this.clearTestTextAnswers();
      if (!clearResult.success) {
        console.warn('既存データ削除でエラー:', clearResult.error);
      }
      
      // 4. 新しいテストデータ作成
      const createResult = await this.createTestTextAnswers();
      if (!createResult.success) {
        return { success: false, error: createResult.error };
      }
      
      // 5. 完了後のデータ件数確認
      const finalCountResult = await this.getDataCount();
      console.log('初期化後のデータ件数:', finalCountResult);
      
      return { 
        success: true, 
        message: 'テストデータの初期化が完了しました',
        initialCount: countResult.count,
        finalCount: finalCountResult.count,
        createdData: createResult.data
      };
      
    } catch (error) {
      console.error('テストデータ初期化エラー:', error);
      return { success: false, error: error.message };
    }
  }
}

export default TestDataService;