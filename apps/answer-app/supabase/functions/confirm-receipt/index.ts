import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConfirmReceiptResult {
  success: boolean;
  message: string;
  error?: string;
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

    const { winnerId } = await req.json()

    if (!winnerId) {
      throw new Error('Winner ID is required')
    }

    // Check if the winner record exists and is not already received
    const { data: winnerData, error: fetchError } = await supabase
      .from('lottery_winners')
      .select('*')
      .eq('id', winnerId)
      .eq('is_received', false)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error('当選記録が見つからないか、既に受取済みです')
      }
      throw fetchError
    }

    if (!winnerData) {
      throw new Error('当選記録が見つからないか、既に受取済みです')
    }

    // Update the winner record to mark as received
    const { error: updateError } = await supabase
      .from('lottery_winners')
      .update({
        is_received: true,
        received_at: new Date().toISOString()
      })
      .eq('id', winnerId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true,
        message: '受取が確認されました'
      } as ConfirmReceiptResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Confirm receipt function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'エラーが発生しました',
        error: error.message
      } as ConfirmReceiptResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})