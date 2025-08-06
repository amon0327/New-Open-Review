// Claude APIとの通信を担当するサービスクラス
// フロントエンド側でのセキュアなAPI呼び出し

class ClaudeApiService {
  constructor() {
    // 本番環境とローカル環境でのAPI URLの切り替え
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://openreview-server-jicrq0f8n-yuto-mochizukis-projects.vercel.app/api'
      : 'https://openreview-server-jicrq0f8n-yuto-mochizukis-projects.vercel.app/api';
    
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

      // リクエストボディの構築
      const requestBody = {
        message: message.trim(),
        conversationHistory: conversationHistory.slice(-10) // 最新10件のみ
      };

      // フェッチリクエストの実行
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.defaultConfig.timeout);

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: this.defaultConfig.headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // HTTPエラーステータスの処理
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        switch (response.status) {
          case 400:
            throw new Error(errorData.error || '無効なリクエストです');
          case 429:
            throw new Error('リクエストが多すぎます。しばらく待ってから再試行してください');
          case 500:
            throw new Error('サーバーエラーが発生しました。しばらく待ってから再試行してください');
          default:
            throw new Error(`APIエラー: ${response.status}`);
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
        timestamp: new Date().toISOString()
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
    return messages
      .filter(msg => msg.role && msg.content)
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: typeof msg.content === 'string' ? msg.content.trim() : ''
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
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('Claude API connection check failed:', error);
      return false;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const claudeApiService = new ClaudeApiService();

// デフォルトエクスポート
export default ClaudeApiService;