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
    console.log('=== validate-partner-invitation Edge Function開始 ===')

    // サービスロール用のSupabaseクライアントを作成（RLS回避）
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // リクエストボディから招待トークンを取得
    const requestBody = await req.text()
    console.log('Raw request body:', requestBody)

    let parsedBody
    try {
      parsedBody = JSON.parse(requestBody)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('リクエストボディが無効なJSONです')
    }

    const { invitationToken } = parsedBody
    console.log('Parsed invitation token:', invitationToken)

    if (!invitationToken) {
      throw new Error('招待トークンが必要です')
    }

    // トークンの基本的なフォーマット検証（セキュリティ）
    if (!/^[a-f0-9-]{36}$/.test(invitationToken)) {
      throw new Error('無効なトークン形式です')
    }

    // サービスロールで招待情報を取得（RLSポリシーを回避）
    console.log('Querying partner_user_invitations with token:', invitationToken)
    const { data: invitationData, error: invitationError } = await supabaseAdmin
      .from('partner_user_invitations')
      .select(`
        *,
        partner_company (
          id,
          company_name
        )
      `)
      .eq('token', invitationToken)
      .eq('status', 'invited')

    console.log('Invitation query result:', { invitationData, invitationError })

    if (invitationError) {
      console.error('Database query error:', invitationError)
      throw new Error(`招待情報の取得に失敗: ${invitationError.message}`)
    }

    if (!invitationData || invitationData.length === 0) {
      console.log('No invitation found for token:', invitationToken)
      throw new Error('招待が見つからないか、既に使用済みです')
    }

    const invitation = invitationData[0]

    // セキュリティ：必要最小限の情報のみを返す
    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          email: invitation.email,
          role: invitation.role,
          partnerCompany: {
            id: invitation.partner_company.id,
            name: invitation.partner_company.company_name
          },
          created_at: invitation.created_at
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('=== validate-partner-invitation Edge Function エラー ===')
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })

    // より詳細なエラーメッセージを返す
    let errorMessage = error.message
    let statusCode = 400

    // 特定のエラーケースに対する対処
    if (error.message.includes('招待が見つからない')) {
      statusCode = 404
      errorMessage = '指定された招待URLは無効です。'
    } else if (error.message.includes('無効なトークン形式')) {
      statusCode = 400
      errorMessage = '招待URLの形式が正しくありません。'
    } else if (error.message.includes('JSON')) {
      statusCode = 400
      errorMessage = 'リクエストデータが無効です。'
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: {
          originalError: error.message,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    )
  }
})
