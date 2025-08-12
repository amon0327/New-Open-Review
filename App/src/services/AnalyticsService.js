import { supabase } from '../supabaseClient';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { getDatabaseConfig, TABLE_NAMES } from '../config/databaseConfig';

export class AnalyticsService {
  // 基本統計データ取得
  static async getBasicStats(userId, isTestMode = false) {
    try {
      const config = getDatabaseConfig(isTestMode); // テストモード削除時: getDatabaseConfig()

      let formsQuery, submissionsQuery, questionsQuery;

      if (isTestMode) {
        // ========= テストモード用クエリ（削除予定） =========
        [formsQuery, submissionsQuery, questionsQuery] = [
          supabase
            .from(config.REVIEW_FORMS)
            .select('id')
            .eq('is_deleted', false),
          
          supabase
            .from(config.REVIEW_FORM_SUBMISSIONS)
            .select('id, created_at'),
          
          supabase
            .from(config.REVIEW_QUESTIONS)
            .select('id, review_fome_id')
        ];
        // ================================================
      } else {
        // 本番モード用クエリ（削除不要）
        [formsQuery, submissionsQuery, questionsQuery] = [
          supabase
            .from(config.REVIEW_FORMS)
            .select('id')
            .eq('business_users', userId)
            .eq('is_deleted', false),
          
          supabase
            .from(config.REVIEW_FORM_SUBMISSIONS)
            .select('id, created_at, review_forms!inner(business_users)')
            .eq('review_forms.business_users', userId),
          
          supabase
            .from(config.REVIEW_QUESTIONS)
            .select('id, review_fome_id, review_forms!inner(business_users)')
            .eq('review_forms.business_users', userId)
        ];
      }

      const [formsResult, submissionsResult, questionsResult] = await Promise.all([
        formsQuery, submissionsQuery, questionsQuery
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
      console.error('基本統計データ取得エラー:', error);
      return { totalForms: 0, totalSubmissions: 0, totalQuestions: 0, avgQuestionsPerForm: 0 };
    }
  }

  // 時系列データ取得（過去30日間の回答数推移）
  static async getTimeSeriesData(userId, days = 30, isTestMode = false) {
    try {
      const config = getDatabaseConfig(isTestMode); // テストモード削除時: getDatabaseConfig()
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      
      let submissionsQuery;
      
      if (isTestMode) {
        // ========= テストモード用クエリ（削除予定） =========
        submissionsQuery = supabase
          .from(config.REVIEW_FORM_SUBMISSIONS)
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });
        // ================================================
      } else {
        // 本番モード用クエリ（削除不要）
        submissionsQuery = supabase
          .from(config.REVIEW_FORM_SUBMISSIONS)
          .select('created_at, review_forms!inner(business_users)')
          .eq('review_forms.business_users', userId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });
      }

      const { data: submissions } = await submissionsQuery;

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
      console.error('時系列データ取得エラー:', error);
      return [];
    }
  }

  // 質問カテゴリ別分析
  static async getCategoryAnalysis(userId) {
    try {
      const { data: questions } = await supabase
        .from('review_questions')
        .select(`
          id,
          question_categories!inner(id, japanese_name),
          review_forms!inner(business_users)
        `)
        .eq('review_forms.business_users', userId);

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
      console.error('カテゴリ分析データ取得エラー:', error);
      return [];
    }
  }

  // フォーム別パフォーマンス分析
  static async getFormPerformance(userId) {
    try {
      const { data: forms } = await supabase
        .from('review_forms')
        .select(`
          id,
          title,
          created_at,
          is_published,
          review_form_submissions(count),
          review_questions(count)
        `)
        .eq('business_users', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);

      return forms?.map(form => ({
        id: form.id,
        name: form.title || '名称未設定',
        submissions: form.review_form_submissions?.[0]?.count || 0,
        questions: form.review_questions?.[0]?.count || 0,
        status: form.is_published ? 'published' : 'draft',
        createdAt: form.created_at,
        responseRate: form.review_questions?.[0]?.count > 0 
          ? Math.round((form.review_form_submissions?.[0]?.count || 0) / (form.review_questions?.[0]?.count || 1) * 100)
          : 0
      })) || [];
    } catch (error) {
      console.error('フォームパフォーマンス取得エラー:', error);
      return [];
    }
  }

  // 質問タイプ別分析
  static async getQuestionTypeAnalysis(userId) {
    try {
      const { data: questions } = await supabase
        .from('review_questions')
        .select(`
          id,
          question_types!inner(id, japanese),
          review_forms!inner(business_users)
        `)
        .eq('review_forms.business_users', userId);

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
      console.error('質問タイプ分析データ取得エラー:', error);
      return [];
    }
  }

  // リアルタイム統計（今日のデータ）
  static async getTodayStats(userId) {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      const [submissionsResult, formsResult] = await Promise.all([
        supabase
          .from('review_form_submissions')
          .select('id, review_forms!inner(business_users)')
          .eq('review_forms.business_users', userId)
          .gte('created_at', startOfToday.toISOString())
          .lte('created_at', endOfToday.toISOString()),
        
        supabase
          .from('review_forms')
          .select('id')
          .eq('business_users', userId)
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
      console.error('今日の統計データ取得エラー:', error);
      return { todaySubmissions: 0, publishedForms: 0, avgSubmissionsPerForm: 0 };
    }
  }

  // 回答の質分析（リニアスケール回答の平均など）
  static async getResponseQualityAnalysis(userId) {
    try {
      const { data: linearResponses } = await supabase
        .from('question_answer_option_linear_scale')
        .select(`
          answer_number,
          review_question_answers!inner(
            review_questions!inner(
              review_forms!inner(business_users)
            )
          )
        `)
        .eq('review_question_answers.review_questions.review_forms.business_users', userId);

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
      console.error('回答質分析データ取得エラー:', error);
      return { averageRating: 0, totalRatings: 0, distribution: [] };
    }
  }
}