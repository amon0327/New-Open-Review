// 認証不要のルートレベルエンドポイント（Vercel Authentication回避用）
// /chat ではなく /api/chat を使用

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

// CORS設定関数
function setCorsHeaders(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// Claude APIを呼び出す関数
async function callClaudeAPI(message, conversationHistory) {
  const messages = [
    ...conversationHistory.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
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
  // 最初にCORSヘッダーを設定
  setCorsHeaders(req, res);
  
  // OPTIONSリクエストを最優先で処理
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
    
    // 入力検証
    const { message, conversationHistory = [] } = req.body || {};
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid message: must be a non-empty string'
      });
    }
    
    if (message.length > 4000) {
      return res.status(400).json({
        error: 'Bad request', 
        message: 'Message too long: maximum 4000 characters allowed'
      });
    }
    
    // Claude API 呼び出し
    const claudeResponse = await callClaudeAPI(message.trim(), conversationHistory);
    
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
    console.error('API Error:', error.message);
    
    // エラーレスポンス
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
}