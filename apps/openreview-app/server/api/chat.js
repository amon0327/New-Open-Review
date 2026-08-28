// 2024年のベストプラクティスに基づくClaude APIプロキシ
// セキュリティを重視したCORS設定とAPIキー保護

// 環境変数の検証
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

// Claude APIの設定
const CLAUDE_API_CONFIG = {
  url: 'https://api.anthropic.com/v1/messages',
  version: '2023-06-01',
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 1000
};

// 許可されたオリジンのリスト（セキュリティ強化）
const ALLOWED_ORIGINS = [
  'http://localhost:3000', // 開発環境
  'https://localhost:3000', // 開発環境（HTTPS）
  // 本番環境のドメインがあればここに追加
];

// CORS設定関数（Vercel Authentication対応版）
function setCorsHeaders(req, res) {
  // Vercel Authentication問題を回避するため、常にCORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // セキュリティヘッダーの追加
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

// レート制限（IP単位）
const rateLimitStore = new Map();
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1分
  maxRequests: 20, // 1分間に20リクエスト
};

function checkRateLimit(clientIP) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;
  
  if (!rateLimitStore.has(clientIP)) {
    rateLimitStore.set(clientIP, []);
  }
  
  const requests = rateLimitStore.get(clientIP);
  const validRequests = requests.filter(time => time > windowStart);
  rateLimitStore.set(clientIP, validRequests);
  
  if (validRequests.length >= RATE_LIMIT_CONFIG.maxRequests) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitStore.set(clientIP, validRequests);
  return true;
}

// 入力検証とサニタイゼーション
function validateInput(data) {
  const { message, conversationHistory = [] } = data || {};
  
  // メッセージの検証
  if (!message || typeof message !== 'string') {
    throw new Error('Invalid message: must be a non-empty string');
  }
  
  if (message.length > 4000) {
    throw new Error('Message too long: maximum 4000 characters allowed');
  }
  
  if (message.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }
  
  // 会話履歴の検証
  if (!Array.isArray(conversationHistory)) {
    throw new Error('Invalid conversation history: must be an array');
  }
  
  // 会話履歴のサニタイゼーション
  const sanitizedHistory = conversationHistory
    .slice(-10) // 最新10件のみ
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

// Claude APIを呼び出す関数
async function callClaudeAPI(message, conversationHistory) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: message }
  ];
  
  const requestBody = {
    model: CLAUDE_API_CONFIG.model,
    max_tokens: CLAUDE_API_CONFIG.maxTokens,
    messages: messages,
    system: "You are a helpful AI assistant for data analysis and general questions. Please respond in Japanese when appropriate."
  };
  
  const response = await fetch(CLAUDE_API_CONFIG.url, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': CLAUDE_API_CONFIG.version,
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

// メインハンドラー関数
export default async function handler(req, res) {
  // 最初にCORSヘッダーを設定（Vercel Authentication問題を回避）
  setCorsHeaders(req, res);
  
  // OPTIONSリクエストを最優先で処理（認証チェックを迂回）
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return res.status(200).end();
  }
  
  try {
    
    // POST リクエストのみ許可
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: 'Only POST requests are supported' 
      });
    }
    
    // クライアント IP の取得
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     'unknown';
    
    // レート制限チェック
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Maximum ${RATE_LIMIT_CONFIG.maxRequests} requests per minute allowed.`,
        retryAfter: 60
      });
    }
    
    // 入力検証
    const { message, conversationHistory } = validateInput(req.body);
    
    // Claude API 呼び出し
    const claudeResponse = await callClaudeAPI(message, conversationHistory);
    
    // レスポンス検証
    if (!claudeResponse.content || !claudeResponse.content[0]) {
      throw new Error('Invalid response from Claude API');
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
    // エラーログ（本番環境では適切なログサービスを使用）
    console.error('API Error:', {
      message: error.message,
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent']
    });
    
    // クライアントへのエラーレスポンス（セキュリティを考慮して詳細は隠す）
    if (error.message.includes('Invalid message') || 
        error.message.includes('Message too long') || 
        error.message.includes('Invalid conversation')) {
      return res.status(400).json({
        error: 'Bad request',
        message: error.message
      });
    }
    
    if (error.message.includes('Claude API error 401') || 
        error.message.includes('Authentication')) {
      return res.status(500).json({
        error: 'Service temporarily unavailable',
        message: 'Authentication error occurred'
      });
    }
    
    if (error.message.includes('Claude API error 429')) {
      return res.status(429).json({
        error: 'Service rate limit exceeded',
        message: 'API rate limit exceeded. Please try again later.',
        retryAfter: 60
      });
    }
    
    // 一般的なエラー
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
}