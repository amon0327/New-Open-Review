import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { sql } = await req.json()
    const dbUrl = Deno.env.get('SUPABASE_DB_URL') ?? ''
    
    // Use postgres connection directly via Deno's postgres module
    const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts')
    const client = new Client(dbUrl)
    await client.connect()
    const result = await client.queryArray(sql)
    await client.end()
    
    return new Response(JSON.stringify({ success: true, result: result.rows }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
    })
  }
})
