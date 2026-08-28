import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { userHasCompanyAccess } from '../_shared/companyAccess.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// conditions JSONB:
//   store_ids?: string[]
//   result_types?: number[]
//   selected_qsc?: string[]
//   top_preferences?: string[]
//   second_preferences?: string[]
//   answered_from?: string (ISO)
//   answered_to?: string (ISO)
interface RequestBody {
  company_id: string
  conditions?: Record<string, unknown>
  preview_only?: boolean
  limit?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('認証情報がありません')

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) throw new Error('認証エラー')

    const body: RequestBody = await req.json()
    const { company_id, conditions = {}, preview_only = false, limit = 10000 } = body
    if (!company_id) throw new Error('company_id が必要です')

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const allowed = await userHasCompanyAccess(admin, user.id, company_id)
    if (!allowed) throw new Error('この企業のターゲット計算権限がありません')

    const { data, error } = await admin.rpc('compute_line_audience', {
      p_company_id: company_id,
      p_conditions: conditions,
      p_limit: Math.min(Number(limit) || 10000, 50000),
    })
    if (error) throw new Error('audience 計算失敗: ' + error.message)

    const rows = (data ?? []) as Array<{
      line_user_id: string
      user_id: string
      display_name: string
      last_answered_at: string
      answer_count: number
    }>

    return new Response(
      JSON.stringify({
        success: true,
        count: rows.length,
        line_user_ids: preview_only ? undefined : rows.map(r => r.line_user_id),
        user_ids: preview_only ? undefined : rows.map(r => r.user_id),
        audience: preview_only ? undefined : rows,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('compute-line-target-audience error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
