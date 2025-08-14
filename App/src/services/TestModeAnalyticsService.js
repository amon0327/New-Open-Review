// ========================================
// テストモード専用サービス
// 本番環境との分離でテストデータを安全に管理
// ========================================

import { supabase } from '../supabaseClient';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { TEST_DATABASE_SCHEMA } from '../constants/testDatabaseSchema';

export class TestModeAnalyticsService {
  // テストモード用基本統計データ取得
  static async getBasicStats() {
    try {
      const [formsResult, submissionsResult, questionsResult] = await Promise.all([
        // テスト用総フォーム数
        supabase
          .from(TEST_DATABASE_SCHEMA.TEST_REVIEW_FORMS)
          .select('id')
          .eq('is_deleted', false),
        
        // テスト用総回答数
        supabase
          .from(TEST_DATABASE_SCHEMA.TEST_REVIEW_FORM_SUBMISSIONS)
          .select('id, created_at'),
        
        // テスト用総質問数
        supabase
          .from(TEST_DATABASE_SCHEMA.TEST_REVIEW_QUESTIONS)
          .select('id, review_fome_id')
      ]);

      return {
        totalForms: formsResult.data?.length || 0,
        totalSubmissions: submissionsResult.data?.length || 0,
        totalQuestions: questionsResult.data?.length || 0,
        avgQuestionsPerForm: questionsResult.data?.length > 0 && formsResult.data?.length > 0 
          ? Math.round((questionsResult.data.length / formsResult.data.length) * 10) / 10 
          : 0
      };
    } catch (error) {
      console.error('テストモード基本統計データ取得エラー:', error);
      return { totalForms: 0, totalSubmissions: 0, totalQuestions: 0, avgQuestionsPerForm: 0 };
    }
  }

  // テストモード用時系列データ取得
  static async getTimeSeriesData(days = 30) {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      
      const { data: submissions } = await supabase
        .from(TEST_DATABASE_SCHEMA.TEST_REVIEW_FORM_SUBMISSIONS)
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // 日付別にグループ化
      const dailyData = {};
      
      // 全日付を初期化
      for (let i = 0; i < days; i++) {
        const date = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd');
        dailyData[date] = { date, submissions: 0, responses: 0 };
      }

      // 実際のデータをマッピング
      submissions?.forEach(submission => {
        const date = format(new Date(submission.created_at), 'yyyy-MM-dd');
        if (dailyData[date]) {
          dailyData[date].submissions += 1;
          dailyData[date].responses += 1;
        }
      });

      return Object.values(dailyData);
    } catch (error) {
      console.error('テストモード時系列データ取得エラー:', error);
      return [];
    }
  }

  // テストモード用質問カテゴリ別分析
  static async getCategoryAnalysis() {
    try {
      const { data: questions } = await supabase
        .from(TEST_DATABASE_SCHEMA.TEST_REVIEW_QUESTIONS)
        .select(`
          id,
          question_categories!inner(id, japanese_name)
        `);

      const categoryStats = {};
      
      questions?.forEach(question => {
        const categoryName = question.question_categories?.japanese_name || 'その他';
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = { name: categoryName, count: 0, percentage: 0 };
        }
        categoryStats[categoryName].count++;
      });

      const total = questions?.length || 0;
      const categoryArray = Object.values(categoryStats).map(cat => ({
        ...cat,
        percentage: total > 0 ? Math.round((cat.count / total) * 100) : 0
      })).sort((a, b) => b.count - a.count);

      return categoryArray;
    } catch (error) {
      console.error('テストモードカテゴリ分析データ取得エラー:', error);
      return [];
    }
  }

  // テストモード用フォーム別パフォーマンス分析
  static async getFormPerformance() {
    try {
      const { data: forms } = await supabase
        .from(TEST_DATABASE_SCHEMA.TEST_REVIEW_FORMS)
        .select(`
          id,
          title,
          created_at,
          is_published,
          ${TEST_DATABASE_SCHEMA.TEST_REVIEW_FORM_SUBMISSIONS}(count),
          ${TEST_DATABASE_SCHEMA.TEST_REVIEW_QUESTIONS}(count)
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);

      return forms?.map(form => ({
        id: form.id,
        name: form.title || '名称未設定',
        submissions: form[TEST_DATABASE_SCHEMA.TEST_REVIEW_FORM_SUBMISSIONS]?.[0]?.count || 0,
        questions: form[TEST_DATABASE_SCHEMA.TEST_REVIEW_QUESTIONS]?.[0]?.count || 0,
        status: form.is_published ? 'published' : 'draft',
        createdAt: form.created_at,
        responseRate: form[TEST_DATABASE_SCHEMA.TEST_REVIEW_QUESTIONS]?.[0]?.count > 0 
          ? Math.round((form[TEST_DATABASE_SCHEMA.TEST_REVIEW_FORM_SUBMISSIONS]?.[0]?.count || 0) / (form[TEST_DATABASE_SCHEMA.TEST_REVIEW_QUESTIONS]?.[0]?.count || 1) * 100)
          : 0
      })) || [];
    } catch (error) {
      console.error('テストモードフォームパフォーマンス取得エラー:', error);
      return [];
    }
  }

  // テストモード用質問タイプ別分析
  static async getQuestionTypeAnalysis() {
    try {
      const { data: questions } = await supabase
        .from(TEST_DATABASE_SCHEMA.TEST_REVIEW_QUESTIONS)
        .select(`
          id,
          question_types!inner(id, japanese)
        `);

      const typeStats = {};
      
      questions?.forEach(question => {
        const typeName = question.question_types?.japanese || 'その他';
        if (!typeStats[typeName]) {
          typeStats[typeName] = { name: typeName, value: 0 };
        }
        typeStats[typeName].value++;
      });

      return Object.values(typeStats).sort((a, b) => b.value - a.value);
    } catch (error) {
      console.error('テストモード質問タイプ分析データ取得エラー:', error);
      return [];
    }
  }

  // テストモード用リアルタイム統計
  static async getTodayStats() {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      const [submissionsResult, formsResult] = await Promise.all([
        supabase
          .from(TEST_DATABASE_SCHEMA.TEST_REVIEW_FORM_SUBMISSIONS)
          .select('id')
          .gte('created_at', startOfToday.toISOString())
          .lte('created_at', endOfToday.toISOString()),
        
        supabase
          .from(TEST_DATABASE_SCHEMA.TEST_REVIEW_FORMS)
          .select('id')
          .eq('is_published', true)
          .eq('is_deleted', false)
      ]);

      const todaySubmissions = submissionsResult.data?.length || 0;
      const publishedForms = formsResult.data?.length || 0;

      return {
        todaySubmissions,
        publishedForms,
        avgSubmissionsPerForm: publishedForms > 0 ? Math.round((todaySubmissions / publishedForms) * 10) / 10 : 0
      };
    } catch (error) {
      console.error('テストモード今日の統計データ取得エラー:', error);
      return { todaySubmissions: 0, publishedForms: 0, avgSubmissionsPerForm: 0 };
    }
  }

  // テストモード用回答の質分析
  static async getResponseQualityAnalysis() {
    try {
      const { data: linearResponses } = await supabase
        .from(TEST_DATABASE_SCHEMA.TEST_QUESTION_ANSWER_OPTION_LINEAR_SCALE)
        .select(`
          answer_number,
          ${TEST_DATABASE_SCHEMA.TEST_REVIEW_QUESTION_ANSWERS}!inner(
            ${TEST_DATABASE_SCHEMA.TEST_REVIEW_QUESTIONS}!inner(id)
          )
        `);

      if (!linearResponses || linearResponses.length === 0) {
        return { averageRating: 0, totalRatings: 0, distribution: [] };
      }

      const ratings = linearResponses.map(r => r.answer_number).filter(r => r !== null);
      const averageRating = ratings.length > 0 
        ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10 
        : 0;

      // 1-5のスケール分布を計算
      const distribution = [1, 2, 3, 4, 5].map(scale => ({
        scale,
        count: ratings.filter(r => r === scale).length,
        percentage: ratings.length > 0 ? Math.round((ratings.filter(r => r === scale).length / ratings.length) * 100) : 0
      }));

      return {
        averageRating,
        totalRatings: ratings.length,
        distribution
      };
    } catch (error) {
      console.error('テストモード回答質分析データ取得エラー:', error);
      return { averageRating: 0, totalRatings: 0, distribution: [] };
    }
  }
}