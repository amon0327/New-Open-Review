import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { debugInfo, userAgent, url } = await req.json()

    // デバッグ情報をログテーブルに保存
    const { data, error } = await supabaseClient
      .from('liff_debug_logs')
      .insert({
        debug_info: debugInfo,
        user_agent: userAgent,
        url: url,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving debug log:', error)
      // エラーがあってもクライアントには成功を返す
    }

    // デバッグ情報から問題を分析
    const analysis = analyzeDebugInfo(debugInfo)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Debug info logged',
        analysis: analysis
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in debug-liff function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // エラーでも200を返してクライアントが処理できるようにする
      }
    )
  }
})

function analyzeDebugInfo(debugInfo: string[]): any {
  const analysis = {
    liffInitialized: false,
    isLoggedIn: false,
    hasAccessToken: false,
    errors: [],
    warnings: []
  }

  debugInfo.forEach(line => {
    if (line.includes('LIFF initialized: true')) {
      analysis.liffInitialized = true
    }
    if (line.includes('Is logged in: true')) {
      analysis.isLoggedIn = true
    }
    if (line.includes('Access token: exists')) {
      analysis.hasAccessToken = true
    }
    if (line.includes('ERROR') || line.includes('error')) {
      analysis.errors.push(line)
    }
    if (line.includes('false') && (line.includes('logged') || line.includes('token'))) {
      analysis.warnings.push(line)
    }
  })

  return analysis
}