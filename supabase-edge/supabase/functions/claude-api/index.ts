// OpenReview Claude API - Production Implementation
// セキュアな認証付きClaude API Edge Function

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 強化されたレート制限設定
const RATE_LIMITS = {
  ANONYMOUS: { requests: 3, windowMs: 60 * 1000 }, // 1分間に3回に縮小
  AUTHENTICATED: { requests: 15, windowMs: 60 * 1000 }, // 1分間に15回に縮小
  // IPベースの全体制限
  IP_GLOBAL: { requests: 50, windowMs: 60 * 1000 }, // 1IPからの全リクエストは1分間に50回まで
  // 急速リクエスト制限（10秒間のバースト制限）
  BURST: { requests: 10, windowMs: 10 * 1000 } // 10秒間に10回まで
};

// 強化されたレート制限ストレージ
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const ipGlobalLimitStore = new Map<string, { count: number; resetTime: number }>();
const burstLimitStore = new Map<string, { count: number; resetTime: number }>();

// ブラックリスト（悪意あるIPの一時ブロック）
const blacklistedIPs = new Set<string>();
const suspiciousIPs = new Map<string, { violations: number; lastViolation: number }>();

// 監視とアラートシステム
interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  suspiciousActivity: number;
  errors: number;
  lastAlertTime: number;
}

const securityMetrics: SecurityMetrics = {
  totalRequests: 0,
  blockedRequests: 0,
  suspiciousActivity: 0,
  errors: 0,
  lastAlertTime: 0
};

// アラート闾値
const ALERT_THRESHOLDS = {
  BLOCKED_REQUESTS_PER_MINUTE: 10,
  ERROR_RATE_PERCENT: 20,
  ALERT_COOLDOWN_MS: 5 * 60 * 1000
};

// 改善されたメモリクリーンアップ
setInterval(() => {
  const now = Date.now();
  
  // メインレート制限ストレージのクリーンアップ
  [rateLimitStore, ipGlobalLimitStore, burstLimitStore].forEach(store => {
    for (const [key, value] of store.entries()) {
      if (value.resetTime <= now) {
        store.delete(key);
      }
    }
    
    // サイズ制限で古いエントリを削除
    if (store.size > 1000) {
      const entries = Array.from(store.entries())
        .sort(([,a], [,b]) => b.resetTime - a.resetTime) // 新しい順にソート
        .slice(0, 500);
      store.clear();
      entries.forEach(([key, value]) => store.set(key, value));
    }
  });
  
  // 古い疑いあるアクティビティ記録を清理（1時間以上古いもの）
  for (const [ip, data] of suspiciousIPs.entries()) {
    if (now - data.lastViolation > 60 * 60 * 1000) { // 1時間
      suspiciousIPs.delete(ip);
    }
  }
  
  console.log(`Rate limit cleanup: ${rateLimitStore.size} entries, ${blacklistedIPs.size} blocked IPs, ${suspiciousIPs.size} suspicious IPs`);
}, 60000); // 1分ごとにクリーンアップ

// 本番用CORS設定（セキュア）
function setCorsHeaders(requestOrigin?: string): Headers {
  const headers = new Headers();
  
  // 許可されたオリジンのリスト
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    // 本番ドメインを設定してください
    // 'https://your-production-domain.com',
    // 'https://your-app.vercel.app'
  ];
  
  // Origin検証
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    headers.set('Access-Control-Allow-Origin', requestOrigin);
  } else if (!requestOrigin) {
    // Originヘッダーがない場合（直接APIアクセス等）
    headers.set('Access-Control-Allow-Origin', 'null');
  } else {
    // 許可されていないOriginは拒否
    console.warn(`Blocked request from unauthorized origin: ${requestOrigin}`);
    throw new Error('Unauthorized origin');
  }
  
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
  headers.set('Access-Control-Allow-Credentials', 'false');
  headers.set('Access-Control-Max-Age', '3600'); // 1時間に短縮
  headers.set('Content-Type', 'application/json');
  
  // セキュリティヘッダー
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  return headers;
}

// エラーレスポンス作成
function createErrorResponse(status: number, error: string, message: string, headers: Headers, debug?: any) {
  const response: any = { error, message };
  
  // デバッグ情報は開発環境でのみ含める
  if (debug && Deno.env.get('DENO_DEPLOYMENT_ID')) {
    response.debug = debug;
  }
  
  return new Response(
    JSON.stringify(response),
    { status, headers }
  );
}

// 強化されたレート制限チェック
function checkRateLimit(clientId: string, clientIp: string, isAuthenticated: boolean): { allowed: boolean; reason?: string } {
  const now = Date.now();
  
  // 1. ブラックリストチェック
  if (blacklistedIPs.has(clientIp)) {
    return { allowed: false, reason: 'IP blocked due to abuse' };
  }
  
  // 2. バースト制限チェック（10秒間の急速アクセス）
  const burstKey = `burst_${clientIp}`;
  const burstEntry = burstLimitStore.get(burstKey);
  
  if (!burstEntry || burstEntry.resetTime <= now) {
    burstLimitStore.set(burstKey, { count: 1, resetTime: now + RATE_LIMITS.BURST.windowMs });
  } else if (burstEntry.count >= RATE_LIMITS.BURST.requests) {
    // 悪意あるアクセスとして記録
    recordSuspiciousActivity(clientIp, 'burst_limit_exceeded');
    return { allowed: false, reason: 'Burst limit exceeded (10 requests/10sec)' };
  } else {
    burstLimitStore.set(burstKey, { count: burstEntry.count + 1, resetTime: burstEntry.resetTime });
  }
  
  // 3. IPベースの全体制限チェック
  const ipGlobalKey = `ip_global_${clientIp}`;
  const ipGlobalEntry = ipGlobalLimitStore.get(ipGlobalKey);
  
  if (!ipGlobalEntry || ipGlobalEntry.resetTime <= now) {
    ipGlobalLimitStore.set(ipGlobalKey, { count: 1, resetTime: now + RATE_LIMITS.IP_GLOBAL.windowMs });
  } else if (ipGlobalEntry.count >= RATE_LIMITS.IP_GLOBAL.requests) {
    recordSuspiciousActivity(clientIp, 'ip_global_limit_exceeded');
    return { allowed: false, reason: 'IP global limit exceeded (50 requests/min)' };
  } else {
    ipGlobalLimitStore.set(ipGlobalKey, { count: ipGlobalEntry.count + 1, resetTime: ipGlobalEntry.resetTime });
  }
  
  // 4. ユーザーベースの制限チェック
  const limit = isAuthenticated ? RATE_LIMITS.AUTHENTICATED : RATE_LIMITS.ANONYMOUS;
  const entry = rateLimitStore.get(clientId);
  
  if (!entry || entry.resetTime <= now) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + limit.windowMs });
    return { allowed: true };
  }
  
  if (entry.count >= limit.requests) {
    return { allowed: false, reason: `User limit exceeded (${limit.requests} requests/min)` };
  }
  
  rateLimitStore.set(clientId, { count: entry.count + 1, resetTime: entry.resetTime });
  return { allowed: true };
}

// 悪意あるアクティビティの記録
function recordSuspiciousActivity(ip: string, reason: string): void {
  const now = Date.now();
  const suspicious = suspiciousIPs.get(ip) || { violations: 0, lastViolation: 0 };
  
  suspicious.violations += 1;
  suspicious.lastViolation = now;
  suspiciousIPs.set(ip, suspicious);
  
  // 5回違反で一時ブロック（30分間）
  if (suspicious.violations >= 5) {
    blacklistedIPs.add(ip);
    console.warn(`IP ${ip} temporarily blocked due to ${suspicious.violations} violations. Reason: ${reason}`);
    
    // 30分後にブロック解除
    setTimeout(() => {
      blacklistedIPs.delete(ip);
      suspiciousIPs.delete(ip);
      console.log(`IP ${ip} unblocked after 30 minutes`);
    }, 30 * 60 * 1000);
  }
  
  console.warn(`Suspicious activity from IP ${ip}: ${reason} (${suspicious.violations} violations)`);
  
  securityMetrics.suspiciousActivity++;
}

// セキュリティアラートチェック
function checkSecurityAlerts(): void {
  const now = Date.now();
  
  if (now - securityMetrics.lastAlertTime < ALERT_THRESHOLDS.ALERT_COOLDOWN_MS) {
    return;
  }
  
  if (securityMetrics.blockedRequests >= ALERT_THRESHOLDS.BLOCKED_REQUESTS_PER_MINUTE) {
    console.error(`🚨 SECURITY ALERT: ${securityMetrics.blockedRequests} blocked requests`);
    securityMetrics.lastAlertTime = now;
  }
  
  const errorRate = securityMetrics.totalRequests > 0 
    ? (securityMetrics.errors / securityMetrics.totalRequests) * 100 
    : 0;
    
  if (errorRate >= ALERT_THRESHOLDS.ERROR_RATE_PERCENT && securityMetrics.totalRequests > 10) {
    console.error(`🚨 PERFORMANCE ALERT: ${errorRate.toFixed(1)}% error rate`);
    securityMetrics.lastAlertTime = now;
  }
}

// 入力検証
function validateInput(data: any): { message: string; conversationHistory: any[] } {
  if (!data || typeof data !== 'object') {
    throw new Error('リクエストデータが無効です');
  }

  const { message, conversationHistory = [] } = data;
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('メッセージが必要です');
  }
  
  if (message.length > 4000) {
    throw new Error('メッセージが長すぎます（最大4000文字）');
  }
  
  // 会話履歴のサニタイゼーション
  const sanitizedHistory = (Array.isArray(conversationHistory) ? conversationHistory : [])
    .slice(-10) // 最新10件のみ
    .filter((msg: any) => msg && typeof msg === 'object' && msg.role && msg.content)
    .map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: typeof msg.content === 'string' ? msg.content.substring(0, 2000).trim() : ''
    }))
    .filter((msg: any) => msg.content.length > 0);
  
  return {
    message: message.trim(),
    conversationHistory: sanitizedHistory
  };
}

// Claude API呼び出し
async function callClaudeAPI(message: string, conversationHistory: any[]): Promise<any> {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  
  if (!ANTHROPIC_API_KEY) {
    throw new Error('API設定エラー');
  }
  
  const messages = [
    ...conversationHistory,
    { role: 'user', content: message }
  ];
  
  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    messages: messages,
    system: "You are a helpful AI assistant for business review forms and data analysis. Please respond in Japanese when appropriate."
  };
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.error('Claude API error:', response.status, errorText);
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }
  
  return await response.json();
}

// メインハンドラー
serve(async (req: Request): Promise<Response> => {
  try {
    // Origin検証とCORSヘッダー設定
    const requestOrigin = req.headers.get('origin');
    let headers: Headers;
    
    try {
      headers = setCorsHeaders(requestOrigin);
    } catch (corsError) {
      // CORSエラーの場合は拒否
      return new Response(
        JSON.stringify({ error: 'Forbidden', message: '許可されていないオリジンからのアクセスです' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // OPTIONSリクエスト処理
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers });
    }

    // POSTメソッドのみ許可
    if (req.method !== 'POST') {
      return createErrorResponse(405, 'Method not allowed', 'POSTリクエストのみサポートしています', headers);
    }

    // リクエスト情報を安全にログ出力
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const safeIp = clientIp.length > 8 ? clientIp.substring(0, 6) + '***' : 'unknown';
    const origin = req.headers.get('origin') || req.headers.get('referer') || 'direct';
    console.log(`Request: ${safeIp} from ${origin}`);

    // Supabase認証の検証
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 認証トークンの取得
    const authHeader = req.headers.get('authorization');
    const apikey = req.headers.get('apikey');
    
    let isAuthenticated = false;
    let userId = 'anonymous';
    
    // JWT認証を試行
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          isAuthenticated = true;
          userId = user.id;
        }
      } catch (authError) {
        // 認証エラーは無視して匿名として処理
      }
    }
    
    // APIキー認証をフォールバック
    if (!isAuthenticated && apikey) {
      const expectedApikey = Deno.env.get('SUPABASE_ANON_KEY');
      if (apikey === expectedApikey) {
        isAuthenticated = false; // 匿名として扱う
        userId = 'anon_' + (req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown');
      }
    }

    // 強化されたレート制限チェック
    const clientId = isAuthenticated ? userId : `anon_${clientIp}`;
    
    const rateLimitResult = checkRateLimit(clientId, clientIp, isAuthenticated);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit blocked: ${clientId}, IP: ${clientIp}, Reason: ${rateLimitResult.reason}`);
      
      return createErrorResponse(
        429, 
        'Rate limit exceeded', 
        `アクセス制限に達しました。しばらくお待ちください。`, 
        headers,
        { 
          retryAfter: 60,
          limitType: rateLimitResult.reason?.includes('burst') ? 'burst' : 'standard'
        }
      );
    }

    // リクエストボディの解析
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      return createErrorResponse(400, 'Bad request', '無効なJSONデータです', headers);
    }

    // 入力検証
    let validatedInput;
    try {
      validatedInput = validateInput(requestBody);
    } catch (error) {
      return createErrorResponse(
        400, 
        'Bad request', 
        error instanceof Error ? error.message : '入力データが無効です', 
        headers
      );
    }

    const { message, conversationHistory } = validatedInput;
    
    // Claude API呼び出し
    let claudeResponse;
    const requestStart = Date.now();
    
    try {
      console.log(`Claude API request: User=${userId}, Message length=${message.length}, History count=${conversationHistory.length}`);
      
      claudeResponse = await callClaudeAPI(message, conversationHistory);
      
      const responseTime = Date.now() - requestStart;
      console.log(`Claude API success: User=${userId}, Response time=${responseTime}ms, Tokens=${claudeResponse.usage?.total_tokens || 0}`);
      
    } catch (error) {
      const responseTime = Date.now() - requestStart;
      console.error(`Claude API error: User=${userId}, Response time=${responseTime}ms, Error=${error instanceof Error ? error.message : 'Unknown'}`);
      
      return createErrorResponse(
        503, 
        'Service error', 
        'AIサービスでエラーが発生しました。しばらく後に再試行してください。', 
        headers
      );
    }
    
    // レスポンス検証
    if (!claudeResponse?.content?.[0]?.text) {
      console.error('Invalid Claude response:', claudeResponse);
      return createErrorResponse(
        502, 
        'Service error', 
        'AIサービスから無効なレスポンスを受信しました', 
        headers
      );
    }

    // 成功レスポンス
    return new Response(
      JSON.stringify({
        response: claudeResponse.content[0].text,
        usage: {
          input_tokens: claudeResponse.usage?.input_tokens || 0,
          output_tokens: claudeResponse.usage?.output_tokens || 0
        },
        metadata: {
          timestamp: new Date().toISOString(),
          authenticated: isAuthenticated,
          model: 'claude-3-5-sonnet-20241022'
        }
      }), 
      { status: 200, headers }
    );

  } catch (error) {
    // 最終的なエラーハンドリング
    console.error('Unexpected error in claude-api function:', error);
    return createErrorResponse(
      500, 
      'Internal server error', 
      '予期しないエラーが発生しました', 
      headers
    );
  }
});