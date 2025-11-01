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
    console.log('=== validate-staff-invitation Edge Function開始 ===')
    console.log('Request URL:', req.url)
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))

    // サービスロール用のSupabaseクライアントを作成（RLS回避）
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Supabase URL:', Deno.env.get('SUPABASE_URL'))
    console.log('Service Role Key exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

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
    console.log('Token format validation:', invitationToken, 'matches:', /^[a-f0-9-]{36}$/.test(invitationToken))
    if (!/^[a-f0-9-]{36}$/.test(invitationToken)) {
      throw new Error('無効なトークン形式です')
    }

    // 一括期限切れクリーンアップ処理を削除（招待URLアクセス時に他の招待に影響しないよう修正）
    console.log('一括期限切れクリーンアップ処理は削除されました')

    // サービスロールで招待情報を取得（RLSポリシーを回避）
    console.log('Querying store_invitations with token:', invitationToken)
    const { data: invitationData, error: invitationError } = await supabaseAdmin
      .from('store_invitations')
      .select(`
        *,
        stores (
          id,
          name,
          address,
          companies (
            id,
            name
          )
        )
      `)
      .eq('token', invitationToken)
      .in('status', ['invited', 'expired'])

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

    // 24時間チェック（一時的に無効化）
    const invitationDate = new Date(invitation.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - invitationDate.getTime()) / (1000 * 60 * 60)

    console.log('Time check:', { invitationDate, now, hoursDiff })
    console.log('24時間制限チェックは一時的に無効化されています')

    // 24時間制限を一時的に無効化
    // if (hoursDiff > 24) {
    //   // 期限切れの招待をexpiredに更新
    //   await supabaseAdmin
    //     .from('store_invitations')
    //     .update({ status: 'expired' })
    //     .eq('token', invitationToken)
    //   
    //   throw new Error('招待の有効期限が切れています（24時間）')
    // }

    // セキュリティ：必要最小限の情報のみを返す
    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          name: invitation.name,
          role: invitation.role,
          store: {
            id: invitation.stores.id,
            name: invitation.stores.name,
            address: invitation.stores.address,
            company: {
              id: invitation.stores.companies.id,
              name: invitation.stores.companies.name
            }
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
    console.error('=== validate-staff-invitation Edge Function エラー ===')
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
    } else if (error.message.includes('有効期限が切れています')) {
      statusCode = 410
      errorMessage = '招待の有効期限が切れています（24時間）。新しい招待をリクエストしてください。'
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