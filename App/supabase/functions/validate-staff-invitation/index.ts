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
    // サービスロール用のSupabaseクライアントを作成（RLS回避）
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // リクエストボディから招待トークンを取得
    const { invitationToken } = await req.json()
    
    if (!invitationToken) {
      throw new Error('招待トークンが必要です')
    }

    // トークンの基本的なフォーマット検証（セキュリティ）
    if (!/^[a-f0-9-]{36}$/.test(invitationToken)) {
      throw new Error('無効なトークン形式です')
    }

    // 一括期限切れクリーンアップ処理を削除（招待URLアクセス時に他の招待に影響しないよう修正）
    console.log('一括期限切れクリーンアップ処理は削除されました')

    // サービスロールで招待情報を取得（RLSポリシーを回避）
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

    if (invitationError) {
      throw new Error(`招待情報の取得に失敗: ${invitationError.message}`)
    }

    if (!invitationData || invitationData.length === 0) {
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
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})