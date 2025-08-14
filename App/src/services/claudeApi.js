// Claude APIとの通信を担当するサービスクラス
// セキュアな認証付きAPI呼び出し実装
import { supabase } from '../lib/supabase';

class ClaudeApiService {
  constructor() {
    // Supabase Edge Functions経由でClaude APIを呼び出し
    this.baseUrl = 'https://otfreskkeaenahqziriz.supabase.co/functions/v1';
    
    // デフォルトのリクエスト設定
    this.defaultConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60秒タイムアウト（データベース処理を考慮）
    };
  }

  /**
   * Claude APIにメッセージを送信
   * @param {string} message - 送信するメッセージ
   * @param {Array} conversationHistory - 会話履歴（オプション）
   * @param {Object} options - 追加オプション（systemPrompt、isDataMode等）
   * @returns {Promise<Object>} Claude APIからのレスポンス
   */
  async sendMessage(message, conversationHistory = [], options = {}) {
    try {
      // 入力検証
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new Error('メッセージが無効です');
      }

      if (message.length > 4000) {
        throw new Error('メッセージが長すぎます（最大4000文字）');
      }

      // Supabaseセッション取得
      const { data: { session } } = await supabase.auth.getSession();

      // データモード用のシステムプロンプト構築
      let systemPrompt = options.systemPrompt || '';
      if (options.isDataMode && session?.access_token) {
        systemPrompt = `
あなたはOpenReviewのデータ分析専門アシスタントです。
以下のMCPツールを使ってSupabaseからデータを取得・分析してください：

利用可能なMCPツール：
1. get_survey_questions - アンケート質問の取得
   - パラメータ: jwt_token, survey_id(opt), limit, question_type(opt)
   
2. get_survey_responses - 回答データの取得
   - パラメータ: jwt_token, question_id, limit, filters(opt)
   
3. analyze_text_responses - テキスト回答の分析
   - パラメータ: jwt_token, question_id, analysis_type(keyword/sentiment/summary), limit
   
4. get_filtered_analytics_data - フィルター分析
   - パラメータ: jwt_token, question_ids[], filters(opt), group_by

5. execute_custom_sql - 【新機能】選択されたデータの包括的分析
   - パラメータ: jwt_token, question_ids[], filters(opt), analysis_type
   - 機能: 現在選択されている質問とフィルターに基づいて完全な分析を実行
   - 推奨: UIで選択されたデータを分析する場合はこのツールを使用

重要な注意事項：
- 必ずjwt_token: "${session.access_token}" を各ツール呼び出しで使用してください
- 分析を完了するには複数のツールを順次実行する必要があります

**ツール実行の流れ：**
1. get_survey_questions → 質問一覧を取得
2. get_survey_responses → 特定質問の回答データを取得  
3. analyze_text_responses → テキスト回答を分析（キーワード・感情・要約）

**重要：分析を完了するまで、必要なすべてのツールを実行してください。質問情報を取得しただけでは分析は完了していません。**

**エラー処理に関する重要な指示：**
- ツール実行でエラーが発生した場合、エラーの技術的詳細をそのまま表示してください
- エラーメッセージを自分なりに解釈して親切な文章に変えてはいけません
- 「申し訳ありません」「システム管理者に問い合わせて」などの曖昧な表現は使わないでください
- 具体的なエラー内容（テーブル名、カラム名、SQL エラーコードなど）をそのまま表示してください

例：
❌ 悪い例: "申し訳ありません。データベースへのアクセス中にエラーが発生しました。"
✅ 良い例: "PostgreSQL Error: column 'title' does not exist in table 'review_questions'"

分析結果は日本語で分かりやすく説明し、チャートやグラフの提案も行ってください

${systemPrompt}
        `.trim();
      }

      // リクエストボディの構築
      const requestBody = {
        message: message.trim(),
        conversationHistory: this.formatConversationHistory(conversationHistory),
        systemPrompt: systemPrompt || undefined,
        mcpMode: options.isDataMode || false,
        testMode: options.testMode || true  // デフォルトでテストモードを有効
      };

      // セキュアな認証ヘッダーの構築
      const headers = {
        ...this.defaultConfig.headers
      };

      // 認証トークンがある場合は優先的に使用
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // Supabase APIキーを環境変数から取得
      const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      if (!supabaseAnonKey) {
        throw new Error('環境変数が設定されていません: REACT_APP_SUPABASE_ANON_KEY');
      }
      headers['apikey'] = supabaseAnonKey;

      // フェッチリクエストの実行
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.defaultConfig.timeout);

      const response = await fetch(`${this.baseUrl}/claude-api`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // HTTPエラーステータスの処理
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // サーバーからの詳細エラー情報をコンソールに出力
        if (errorData.details) {
          console.error('🔍 Server Error Details:', {
            errorType: errorData.details.error_type,
            toolName: errorData.details.tool_name,
            testMode: errorData.details.test_mode,
            timestamp: errorData.details.timestamp,
            rawError: errorData.details.raw_error,
            stackTrace: errorData.details.stack_trace
          });
        }

        // デバッグ情報もコンソールに出力
        if (errorData.debug_info) {
          console.error('🛠️ Debug Info:', errorData.debug_info);
        }

        // エラーヘッダー情報もログ出力
        const errorHeaders = {
          'X-Error-Source': response.headers.get('X-Error-Source'),
          'X-Error-Type': response.headers.get('X-Error-Type')
        };
        console.error('📋 Error Headers:', errorHeaders);
        
        // エラーメッセージの処理
        const errorMessage = errorData.message || errorData.error || 'APIエラーが発生しました';
        
        switch (response.status) {
          case 400:
            throw new Error(errorMessage);
          case 401:
            throw new Error('認証エラーです。ログインし直してください');
          case 429:
            const isAuth = session?.access_token;
            const limitMsg = isAuth 
              ? 'リクエスト制限に達しました（認証済み：1分間に20回まで）'
              : 'リクエスト制限に達しました（未認証：1分間に5回まで）。ログインすると制限が緩和されます';
            throw new Error(limitMsg);
          case 500:
            // サーバーエラーの場合は詳細情報を含める
            if (errorData.details?.error_type) {
              throw new Error(`Database Error: ${errorMessage}\n\nDetails: ${errorData.details.raw_error || 'No additional details'}`);
            }
            throw new Error('サーバーエラーが発生しました。しばらく待ってから再試行してください');
          case 502:
          case 503:
            throw new Error('サーバーエラーが発生しました。しばらく待ってから再試行してください');
          default:
            throw new Error(`APIエラー (${response.status}): ${errorMessage}`);
        }
      }

      // レスポンスデータの解析
      const data = await response.json();
      
      // 📊 詳細なレスポンスログ出力
      console.log('📊 Claude API Full Response:', {
        fullData: data,
        responseText: data.response,
        responseLength: data.response?.length || 0,
        usage: data.usage,
        metadata: data.metadata,
        responseKeys: Object.keys(data || {}),
        timestamp: new Date().toISOString()
      });
      
      // レスポンスの検証
      if (!data.response) {
        console.error('❌ Invalid response structure:', data);
        throw new Error('サーバーから無効なレスポンスを受信しました');
      }

      return {
        message: data.response,
        usage: data.usage || { input_tokens: 0, output_tokens: 0 },
        metadata: data.metadata || {},
        timestamp: data.metadata?.timestamp || new Date().toISOString()
      };

    } catch (error) {
      // ネットワークエラーの処理
      if (error.name === 'AbortError') {
        console.error('Claude API Timeout - Request details:', {
          message: message.substring(0, 100) + '...',
          isDataMode: options.isDataMode,
          testMode: options.testMode,
          timeout: this.defaultConfig.timeout
        });
        throw new Error('リクエストがタイムアウトしました。データベース処理に時間がかかっている可能性があります。');
      }

      // その他のエラー
      console.error('Claude API Error:', {
        error: error.message,
        stack: error.stack,
        requestDetails: {
          isDataMode: options.isDataMode,
          testMode: options.testMode,
          messageLength: message.length
        }
      });
      throw error;
    }
  }

  /**
   * 会話履歴を適切な形式に変換
   * @param {Array} messages - 会話メッセージの配列
   * @returns {Array} Claude API用の形式に変換されたメッセージ配列
   */
  formatConversationHistory(messages) {
    if (!Array.isArray(messages)) {
      return [];
    }
    
    return messages
      .filter(msg => msg && typeof msg === 'object' && msg.role && msg.content)
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: typeof msg.content === 'string' 
          ? msg.content.trim().substring(0, 2000) // 長すぎるメッセージをカット
          : ''
      }))
      .filter(msg => msg.content.length > 0)
      .slice(-10); // 最新10件のみ保持
  }

  /**
   * APIの接続状態をチェック
   * @returns {Promise<boolean>} 接続可能かどうか
   */
  async checkConnection() {
    try {
      // 軽量なテストメッセージでAPI接続をチェック
      await this.sendMessage('接続テスト', []);
      return true;
    } catch (error) {
      console.warn('Claude API connection check failed:', error);
      return false;
    }
  }

  /**
   * 現在の認証状態を取得
   * @returns {Promise<Object>} 認証情報
   */
  async getAuthStatus() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('認証状態の取得に失敗:', error);
        return { authenticated: false, error: error.message };
      }
      
      return {
        authenticated: !!session,
        user: session?.user || null,
        expiresAt: session?.expires_at || null
      };
    } catch (error) {
      console.error('認証状態チェックエラー:', error);
      return { authenticated: false, error: error.message };
    }
  }

  /**
   * レート制限情報を取得
   * @returns {Object} レート制限情報
   */
  getRateLimitInfo() {
    return {
      anonymous: {
        requests: 5,
        window: '1分間',
        message: '未認証ユーザーは1分間に5回までリクエスト可能です'
      },
      authenticated: {
        requests: 20,
        window: '1分間', 
        message: '認証済みユーザーは1分間に20回までリクエスト可能です'
      }
    };
  }
}

// シングルトンインスタンスをエクスポート
export const claudeApiService = new ClaudeApiService();

// デフォルトエクスポート
export default ClaudeApiService;