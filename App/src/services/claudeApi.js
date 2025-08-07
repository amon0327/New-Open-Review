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
      timeout: 30000, // 30秒タイムアウト
    };
  }

  /**
   * Claude APIにメッセージを送信
   * @param {string} message - 送信するメッセージ
   * @param {Array} conversationHistory - 会話履歴（オプション）
   * @returns {Promise<Object>} Claude APIからのレスポンス
   */
  async sendMessage(message, conversationHistory = []) {
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

      // リクエストボディの構築
      const requestBody = {
        message: message.trim(),
        conversationHistory: this.formatConversationHistory(conversationHistory)
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
          case 502:
          case 503:
            throw new Error('サーバーエラーが発生しました。しばらく待ってから再試行してください');
          default:
            throw new Error(`APIエラー (${response.status}): ${errorMessage}`);
        }
      }

      // レスポンスデータの解析
      const data = await response.json();
      
      // レスポンスの検証
      if (!data.response) {
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
        throw new Error('リクエストがタイムアウトしました');
      }

      // その他のエラー
      console.error('Claude API Error:', error);
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