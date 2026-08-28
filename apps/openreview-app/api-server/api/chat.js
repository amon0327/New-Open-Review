// OpenReview Claude API - セキュアプロキシサーバー
// 基本的なAPIキー認証とレート制限を実装

// 環境変数の検証
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

// Claude API設定
const CLAUDE_CONFIG = {
  url: 'https://api.anthropic.com/v1/messages',
  version: '2023-06-01',
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 1000
};

// 基本的なAPIキー認証（フロントエンド用）
const VALID_API_KEYS = [
  process.env.FRONTEND_API_KEY || 'openreview-frontend-key-2024',
  process.env.MOBILE_API_KEY || 'openreview-mobile-key-2024'
];

// レート制限ストレージ
const rateLimitStore = new Map();
const RATE_LIMITS = {
  windowMs: 60 * 1000,        // 1分間
  maxRequests: 30,            // 1分間に30リクエスト
  blockDuration: 5 * 60 * 1000 // 5分間ブロック
};

// CORS設定
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // セキュリティヘッダー
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

// APIキー認証
function validateApiKey(req) {
  const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key'];
  return VALID_API_KEYS.includes(apiKey);
}

// レート制限チェック
function checkRateLimit(clientIP) {
  const now = Date.now();
  const windowStart = now - RATE_LIMITS.windowMs;
  
  if (!rateLimitStore.has(clientIP)) {
    rateLimitStore.set(clientIP, []);
  }
  
  const requests = rateLimitStore.get(clientIP);
  const validRequests = requests.filter(time => time > windowStart);
  
  if (validRequests.length >= RATE_LIMITS.maxRequests) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitStore.set(clientIP, validRequests);
  
  // 古いエントリをクリーンアップ
  if (rateLimitStore.size > 1000) {
    const cutoff = now - RATE_LIMITS.blockDuration;
    for (const [ip, requests] of rateLimitStore.entries()) {
      const validRequests = requests.filter(time => time > cutoff);
      if (validRequests.length === 0) {
        rateLimitStore.delete(ip);
      } else {
        rateLimitStore.set(ip, validRequests);
      }
    }
  }
  
  return true;
}

// 入力検証とサニタイゼーション
function validateInput(data) {
  const { message, conversationHistory = [] } = data || {};
  
  if (!message || typeof message !== 'string') {
    throw new Error('メッセージが必要です');
  }
  
  if (message.length > 4000) {
    throw new Error('メッセージが長すぎます（最大4000文字）');
  }
  
  if (message.trim().length === 0) {
    throw new Error('メッセージが空です');
  }
  
  if (!Array.isArray(conversationHistory)) {
    throw new Error('会話履歴の形式が正しくありません');
  }
  
  // 会話履歴のサニタイゼーション
  const sanitizedHistory = conversationHistory
    .slice(-10)
    .filter(msg => msg && msg.role && msg.content)
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: typeof msg.content === 'string' ? msg.content.substring(0, 2000) : ''
    }))
    .filter(msg => msg.content.trim().length > 0);
  
  return {
    message: message.trim(),
    conversationHistory: sanitizedHistory
  };
}

// Claude API呼び出し
async function callClaudeAPI(message, conversationHistory) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: message }
  ];
  
  const requestBody = {
    model: CLAUDE_CONFIG.model,
    max_tokens: CLAUDE_CONFIG.maxTokens,
    messages: messages,
    system: "You are a helpful AI assistant for data analysis and general questions. Please respond in Japanese when appropriate."
  };
  
  const response = await fetch(CLAUDE_CONFIG.url, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': CLAUDE_CONFIG.version,
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }
  
  return await response.json();
}

// メインハンドラー
export default async function handler(req, res) {
  // CORS設定
  setCorsHeaders(res);
  
  // OPTIONSリクエスト処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // POSTメソッドのみ許可
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'POSTリクエストのみサポートしています'
      });
    }
    
    // APIキー認証
    if (!validateApiKey(req)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '有効なAPIキーが必要です'
      });
    }
    
    // クライアントIP取得
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     'unknown';
    
    // レート制限チェック
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `リクエストが多すぎます。1分間に最大${RATE_LIMITS.maxRequests}リクエストまでです。`,
        retryAfter: Math.ceil(RATE_LIMITS.windowMs / 1000)
      });
    }
    
    // 入力検証
    const { message, conversationHistory } = validateInput(req.body);
    
    // Claude API呼び出し
    const claudeResponse = await callClaudeAPI(message, conversationHistory);
    
    // レスポンス検証
    if (!claudeResponse.content?.[0]?.text) {
      throw new Error('Claude APIからの無効なレスポンス');
    }
    
    // 成功レスポンス
    return res.status(200).json({
      response: claudeResponse.content[0].text,
      usage: {
        input_tokens: claudeResponse.usage?.input_tokens || 0,
        output_tokens: claudeResponse.usage?.output_tokens || 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // エラーログ
    console.error('API Error:', {
      message: error.message,
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || 'unknown'
    });
    
    // エラーレスポンス
    if (error.message.includes('メッセージ') || 
        error.message.includes('会話履歴') ||
        error.message.includes('長すぎ') ||
        error.message.includes('空です')) {
      return res.status(400).json({
        error: 'Bad request',
        message: error.message
      });
    }
    
    if (error.message.includes('Claude API error 401') || 
        error.message.includes('Authentication')) {
      return res.status(500).json({
        error: 'Service unavailable',
        message: 'APIサービスに問題が発生しています'
      });
    }
    
    if (error.message.includes('Claude API error 429')) {
      return res.status(429).json({
        error: 'Service rate limit',
        message: 'APIの利用制限に達しました。しばらく待ってから再試行してください'
      });
    }
    
    // 一般的なエラー
    return res.status(500).json({
      error: 'Internal server error',
      message: 'サーバーエラーが発生しました。しばらく待ってから再試行してください'
    });
  }
}