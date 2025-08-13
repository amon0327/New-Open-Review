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
async function callClaudeAPI(message: string, conversationHistory: any[], systemPrompt?: string, mcpMode: boolean = false, userToken?: string): Promise<any> {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  
  if (!ANTHROPIC_API_KEY) {
    throw new Error('API設定エラー');
  }
  
  const messages = [
    ...conversationHistory,
    { role: 'user', content: message }
  ];
  
  // MCPツールの定義（データモード時のみ）
  const tools = mcpMode ? [
    {
      name: 'get_survey_questions',
      description: 'アンケート質問一覧を取得します',
      input_schema: {
        type: 'object',
        properties: {
          jwt_token: { type: 'string', description: 'SupabaseのJWTトークン' },
          survey_id: { type: 'string', description: '特定のサーベイID（オプション）' },
          limit: { type: 'number', default: 50, description: '取得件数 (1-100)' },
          question_type: { type: 'number', description: '質問タイプでフィルター' }
        },
        required: ['jwt_token']
      }
    },
    {
      name: 'get_survey_responses',
      description: '指定質問の回答データを取得します',
      input_schema: {
        type: 'object',
        properties: {
          jwt_token: { type: 'string', description: 'SupabaseのJWTトークン' },
          question_id: { type: 'string', description: '質問ID' },
          limit: { type: 'number', default: 500, description: '取得件数 (1-1000)' },
          filters: {
            type: 'object',
            properties: {
              gender: { type: 'string' },
              age_group: { type: 'string' },
              department: { type: 'string' }
            }
          }
        },
        required: ['jwt_token', 'question_id']
      }
    },
    {
      name: 'analyze_text_responses',
      description: 'テキスト回答を分析します（キーワード抽出、感情分析、要約）',
      input_schema: {
        type: 'object',
        properties: {
          jwt_token: { type: 'string', description: 'SupabaseのJWTトークン' },
          question_id: { type: 'string', description: '質問ID' },
          analysis_type: { 
            type: 'string',
            enum: ['keyword', 'sentiment', 'summary'],
            description: '分析タイプ'
          },
          limit: { type: 'number', default: 100, description: '分析対象回答数' }
        },
        required: ['jwt_token', 'question_id', 'analysis_type']
      }
    },
    {
      name: 'get_filtered_analytics_data',
      description: 'フィルター条件による分析データを取得します',
      input_schema: {
        type: 'object',
        properties: {
          jwt_token: { type: 'string', description: 'SupabaseのJWTトークン' },
          question_ids: { 
            type: 'array',
            items: { type: 'string' },
            description: '質問IDの配列'
          },
          filters: { type: 'object', description: 'フィルター条件' },
          group_by: { 
            type: 'string',
            enum: ['gender', 'age_group', 'department', 'none'],
            default: 'none',
            description: 'グルーピング条件'
          }
        },
        required: ['jwt_token', 'question_ids']
      }
    }
  ] : undefined;

  const requestBody: any = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: messages,
    system: systemPrompt || "You are a helpful AI assistant for business review forms and data analysis. Please respond in Japanese when appropriate."
  };

  // ツールを追加（MCPモード時のみ）
  if (tools && tools.length > 0) {
    requestBody.tools = tools;
  }
  
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
  
  const claudeResponse = await response.json();

  // ツール呼び出しがある場合はMCPサーバーに転送
  if (claudeResponse.content) {
    const toolUses = claudeResponse.content.filter((item: any) => item.type === 'tool_use');
    
    if (toolUses.length > 0 && userToken) {
      console.log('Tool uses detected, calling MCP server:', toolUses.length);
      
      // 各ツール呼び出しを実行
      for (const toolUse of toolUses) {
        try {
          const mcpResult = await executeDatabaseTool(toolUse.name, toolUse.input, userToken);
          
          // ツール結果をClaudeに送り返す
          const toolResultMessages = [
            ...messages,
            { role: 'assistant', content: claudeResponse.content },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(mcpResult)
                }
              ]
            }
          ];

          // 最終結果を取得
          const finalRequestBody = {
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            messages: toolResultMessages,
            system: systemPrompt || "You are a helpful AI assistant for business review forms and data analysis. Please respond in Japanese when appropriate."
          };

          const finalResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify(finalRequestBody)
          });

          if (finalResponse.ok) {
            return await finalResponse.json();
          }
        } catch (dbError) {
          console.error('Database tool error:', dbError);
          // データベースエラーの場合でも元のレスポンスを返す
        }
      }
    }
  }

  return claudeResponse;
}

// Supabaseデータ取得ツール（MCPサーバー代替）
async function executeDatabaseTool(toolName: string, args: any, userToken: string): Promise<any> {
  console.log(`Executing database tool: ${toolName}`, args);
  
  // Supabaseクライアントを認証付きで作成
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // JWTトークンでユーザーを認証
  const authenticatedSupabase = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${userToken}` } } }
  );

  try {
    // ユーザー認証確認
    const { data: userRes, error: authErr } = await authenticatedSupabase.auth.getUser();
    if (authErr || !userRes?.user) {
      throw new Error('認証が無効です: ' + (authErr?.message || '不明なエラー'));
    }

    const userId = userRes.user.id;
    console.log(`Tool execution for user: ${userId.substring(0, 8)}...`);

    switch (toolName) {
      case 'get_survey_questions': {
        const { survey_id, limit = 50, question_type } = args;
        
        let query = supabase
          .from('survey_questions')
          .select('id, title, question_types_id, survey_id, options, created_at')
          .order('created_at', { ascending: false })
          .limit(Math.min(limit, 100));

        if (survey_id) query = query.eq('survey_id', survey_id);
        if (question_type) query = query.eq('question_types_id', question_type);

        const { data, error } = await query;
        if (error) throw new Error(`質問取得エラー: ${error.message}`);

        return {
          success: true,
          data: data,
          count: data?.length || 0
        };
      }

      case 'get_survey_responses': {
        const { question_id, limit = 500, filters } = args;
        
        if (!question_id) throw new Error('question_idは必須です');

        let query = supabase
          .from('responses')
          .select(`
            id, 
            answer, 
            submitted_at,
            respondents (
              id,
              gender,
              age_group,
              department
            )
          `)
          .eq('question_id', question_id)
          .order('submitted_at', { ascending: false })
          .limit(Math.min(limit, 1000));

        const { data, error } = await query;
        if (error) throw new Error(`回答取得エラー: ${error.message}`);

        // フィルター適用
        let filteredData = data;
        if (filters && data) {
          filteredData = data.filter(response => {
            const respondent = response.respondents;
            if (!respondent) return false;
            
            if (filters.gender && respondent.gender !== filters.gender) return false;
            if (filters.age_group && respondent.age_group !== filters.age_group) return false;
            if (filters.department && respondent.department !== filters.department) return false;
            
            return true;
          });
        }

        return {
          success: true,
          data: filteredData,
          count: filteredData?.length || 0,
          total_count: data?.length || 0
        };
      }

      case 'analyze_text_responses': {
        const { question_id, analysis_type, limit = 100 } = args;
        
        if (!question_id) throw new Error('question_idは必須です');
        if (!analysis_type) throw new Error('analysis_typeは必須です');

        const { data, error } = await supabase
          .from('responses')
          .select('id, answer, submitted_at')
          .eq('question_id', question_id)
          .not('answer', 'is', null)
          .order('submitted_at', { ascending: false })
          .limit(Math.min(limit, 500));

        if (error) throw new Error(`回答取得エラー: ${error.message}`);
        if (!data || data.length === 0) {
          return {
            success: true,
            analysis: {
              type: analysis_type,
              message: 'データが見つかりませんでした',
              total_responses: 0
            }
          };
        }

        // 簡単な分析処理
        let analysisResult: any = { type: analysis_type };
        
        switch (analysis_type) {
          case 'keyword': {
            const allText = data.map(r => r.answer).join(' ');
            const words = allText.split(/\s+/).filter(word => word.length > 2);
            const wordCount: Record<string, number> = {};
            
            words.forEach(word => {
              const cleanWord = word.toLowerCase().replace(/[.,!?;]/g, '');
              wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
            });
            
            const topKeywords = Object.entries(wordCount)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 20)
              .map(([word, count]) => ({ word, count }));
              
            analysisResult = {
              ...analysisResult,
              keywords: topKeywords,
              total_words: words.length,
              unique_words: Object.keys(wordCount).length
            };
            break;
          }

          case 'sentiment': {
            const positiveWords = ['良い', '素晴らしい', '満足', '嬉しい', 'good', 'great', 'excellent'];
            const negativeWords = ['悪い', '不満', '問題', '困る', 'bad', 'poor', 'terrible'];
            
            let positive = 0, negative = 0, neutral = 0;
            
            data.forEach(response => {
              const text = response.answer.toLowerCase();
              const hasPositive = positiveWords.some(word => text.includes(word));
              const hasNegative = negativeWords.some(word => text.includes(word));
              
              if (hasPositive && !hasNegative) positive++;
              else if (hasNegative && !hasPositive) negative++;
              else neutral++;
            });
            
            analysisResult = {
              ...analysisResult,
              positive,
              negative,
              neutral,
              total: data.length
            };
            break;
          }

          case 'summary': {
            const responseLengths = data.map(r => r.answer.length);
            const avgLength = responseLengths.reduce((a, b) => a + b, 0) / responseLengths.length;
            
            analysisResult = {
              ...analysisResult,
              total_responses: data.length,
              average_length: Math.round(avgLength),
              min_length: Math.min(...responseLengths),
              max_length: Math.max(...responseLengths),
              recent_responses: data.slice(0, 5).map(r => ({
                id: r.id,
                preview: r.answer.substring(0, 100) + (r.answer.length > 100 ? '...' : ''),
                submitted_at: r.submitted_at
              }))
            };
            break;
          }
        }

        return {
          success: true,
          analysis: analysisResult
        };
      }

      case 'get_filtered_analytics_data': {
        const { question_ids, filters, group_by = 'none' } = args;
        
        if (!question_ids || !Array.isArray(question_ids)) {
          throw new Error('question_idsは必須です（配列形式）');
        }

        let query = supabase
          .from('responses')
          .select(`
            id,
            question_id,
            answer,
            submitted_at,
            respondents (
              id,
              gender,
              age_group,
              department
            ),
            survey_questions (
              id,
              title,
              question_types_id,
              options
            )
          `)
          .in('question_id', question_ids)
          .order('submitted_at', { ascending: false });

        // 日付フィルター
        if (filters?.date_range?.start) {
          query = query.gte('submitted_at', filters.date_range.start);
        }
        if (filters?.date_range?.end) {
          query = query.lte('submitted_at', filters.date_range.end);
        }

        const { data, error } = await query;
        if (error) throw new Error(`データ取得エラー: ${error.message}`);

        // フィルター適用
        let filteredData = data?.filter(response => {
          const respondent = response.respondents;
          if (!respondent) return false;
          
          if (filters?.gender && !filters.gender.includes(respondent.gender)) return false;
          if (filters?.age_group && !filters.age_group.includes(respondent.age_group)) return false;
          if (filters?.department && !filters.department.includes(respondent.department)) return false;
          
          return true;
        }) || [];

        // グルーピング処理
        let result: any = filteredData;
        if (group_by !== 'none') {
          result = filteredData.reduce((acc, response) => {
            const groupKey = response.respondents?.[group_by as keyof typeof response.respondents] || 'unknown';
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(response);
            return acc;
          }, {} as Record<string, any[]>);
        }

        return {
          success: true,
          data: result,
          total_count: filteredData.length,
          original_count: data?.length || 0,
          group_by: group_by,
          filters_applied: filters
        };
      }

      default:
        throw new Error(`未対応のツール: ${toolName}`);
    }
  } catch (error) {
    console.error(`Database tool error (${toolName}):`, error);
    throw error;
  }
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
    const { systemPrompt, mcpMode } = requestBody;
    
    // Claude API呼び出し
    let claudeResponse;
    const requestStart = Date.now();
    
    try {
      console.log(`Claude API request: User=${userId}, Message length=${message.length}, History count=${conversationHistory.length}, MCP Mode=${mcpMode}`);
      
      // MCPモードの場合、ユーザーのJWTトークンを取得
      let userToken = undefined;
      if (mcpMode && authHeader?.startsWith('Bearer ')) {
        userToken = authHeader.substring(7);
      }
      
      claudeResponse = await callClaudeAPI(message, conversationHistory, systemPrompt, mcpMode, userToken);
      
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