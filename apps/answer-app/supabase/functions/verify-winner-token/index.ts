import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyTokenResult {
  success: boolean;
  isValid: boolean;
  isReceived?: boolean;
  error?: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({
          success: true,
          isValid: false,
          error: '無効なURLです'
        } as VerifyTokenResult),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Check if the token (which is lottery_winners.id UUID) exists in lottery_winners table
    const { data: winnerData, error: fetchError } = await supabase
      .from('lottery_winners')
      .select('*')
      .eq('id', token)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // Record not found
        return new Response(
          JSON.stringify({
            success: true,
            isValid: false,
            error: '無効なURLです'
          } as VerifyTokenResult),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }
      throw fetchError
    }

    if (!winnerData) {
      return new Response(
        JSON.stringify({
          success: true,
          isValid: false,
          error: '無効なURLです'
        } as VerifyTokenResult),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Token is valid, check if already received
    return new Response(
      JSON.stringify({
        success: true,
        isValid: true,
        isReceived: winnerData.is_received,
        message: winnerData.is_received ? 'すでに受取済みです' : 'Token検証成功'
      } as VerifyTokenResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Verify token function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        isValid: false,
        error: 'システムエラーが発生しました'
      } as VerifyTokenResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})