import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ----------------------------------------
// 失敗理由の分類 (フロント側で文言切り替え用)
//   フロントは error.reason で分岐し、ユーザー向けメッセージを表示する。
//   ここで使う文字列はフロントの STAFF_INVITATION_REASON_MESSAGES と完全一致させること。
// ----------------------------------------
type FailReason =
  | 'auth_required'        // ログイントークンが無い
  | 'auth_failed'          // セッション失効など
  | 'bad_request'          // body 不正、token 不在など
  | 'invitation_not_found' // 招待が無い (URL 改変や削除)
  | 'invitation_used_by_other' // 完了済みで別ユーザー
  | 'invitation_status_unknown' // 想定外ステータス
  | 'store_info_missing'   // 招待は取れたが store / company が解決できない
  | 'user_create_failed'   // business_users insert/update 失敗
  | 'membership_failed'    // store_memberships upsert 失敗
  | 'unknown'

class InvitationError extends Error {
  reason: FailReason
  status: number
  constructor(message: string, reason: FailReason, status = 400) {
    super(message)
    this.reason = reason
    this.status = status
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Edge Function開始 ===')
    console.log('Request URL:', req.url)
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))

    // サービスロール用のSupabaseクライアントを作成
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 認証用のSupabaseクライアント（JWTトークン検証用）
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // JWTトークンからユーザー情報を取得
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    console.log('Authorization token present:', !!token)
    if (!token) {
      throw new InvitationError('認証トークンが必要です', 'auth_required', 401)
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    console.log('User auth result:', { user: !!user, userError })
    if (userError || !user) {
      console.error('Auth error details:', userError)
      throw new InvitationError('認証に失敗しました: ' + (userError?.message || 'Unknown error'), 'auth_failed', 401)
    }

    // リクエストボディから招待トークンを取得
    const requestBody = await req.text()
    console.log('Request body:', requestBody)

    let parsedBody
    try {
      parsedBody = JSON.parse(requestBody)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new InvitationError('リクエストボディが無効なJSONです', 'bad_request', 400)
    }

    const { invitationToken } = parsedBody
    console.log('Invitation token:', invitationToken)

    if (!invitationToken) {
      throw new InvitationError('招待トークンが必要です', 'bad_request', 400)
    }

    // 招待情報を取得（サービスロールで）
    // 24時間制限無効化に伴い、invitedとexpiredの両方を取得可能にする
    console.log('Fetching invitation data for token:', invitationToken)
    const { data: invitationData, error: invitationError } = await supabaseAdmin
      .from('store_invitations')
      .select(`
        *,
        stores (
          id,
          name,
          company_id,
          companies (
            id,
            name
          )
        )
      `)
      .eq('token', invitationToken)
      .in('status', ['invited', 'expired', 'completed'])

    console.log('Invitation query result:', { invitationData, invitationError })

    if (invitationError) {
      throw new InvitationError(`招待情報の取得に失敗: ${invitationError.message}`, 'store_info_missing', 500)
    }

    if (!invitationData || invitationData.length === 0) {
      throw new InvitationError('招待が見つからないか、既に使用済みです', 'invitation_not_found', 404)
    }

    const invitation = invitationData[0]
    console.log('Found invitation:', invitation)

    // ----- 冪等性ガード -----
    // status='completed' の招待を再送信してきた場合:
    //   - 同じ user が既にこの店舗のメンバーなら「すでに登録済み」として 200 を返す
    //   - 別 user が completed にしたなら 409 (このトークンは使用済み)
    // これによりリロード/再送/StrictMode 二重実行で 400 が返る誤動作を防ぐ。
    if (invitation.status === 'completed') {
      const { data: alreadyMember, error: alreadyErr } = await supabaseAdmin
        .from('store_memberships')
        .select('id')
        .eq('business_user_id', user.id)
        .eq('store_id', invitation.store_id)
        .maybeSingle()
      if (alreadyErr) {
        console.error('Idempotent membership check error:', alreadyErr)
        throw new InvitationError(`メンバーシップの確認に失敗: ${alreadyErr.message}`, 'membership_failed', 500)
      }
      if (alreadyMember) {
        console.log('Idempotent re-entry: already registered, returning 200')
        return new Response(
          JSON.stringify({
            success: true,
            message: 'すでに登録済みです',
            alreadyMember: true,
            store: invitation.stores,
            role: invitation.role,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      // 別ユーザーが完了済 = 共有/盗用された可能性
      throw new InvitationError('招待は既に他のユーザーで使用済みです', 'invitation_used_by_other', 409)
    }

    // expired は 24時間制限無効化に伴い受け入れる。それ以外の未知ステータスは拒否。
    if (invitation.status && invitation.status !== 'invited' && invitation.status !== 'expired') {
      throw new InvitationError(`招待は既に${invitation.status}です`, 'invitation_status_unknown', 400)
    }

    // 24時間チェック（一時的に無効化）
    const invitationDate = new Date(invitation.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - invitationDate.getTime()) / (1000 * 60 * 60)

    console.log('Time check:', { invitationDate, now, hoursDiff })
    console.log('24時間制限チェックは一時的に無効化されています')

    // 24時間制限を一時的に無効化
    // if (hoursDiff > 24) {
    //   // 期限切れの招待をexpiredに更新（サービスロールで）
    //   console.log('Invitation expired, updating status')
    //   await supabaseAdmin
    //     .from('store_invitations')
    //     .update({ status: 'expired' })
    //     .eq('token', invitationToken)
    //   
    //   throw new Error('招待の有効期限が切れています（24時間）')
    // }

    // business_usersテーブルにレコードが存在することを確認（サービスロールで）
    console.log('Checking business_users for user:', user.id)
    const { data: existingBusinessUser, error: checkError } = await supabaseAdmin
      .from('business_users')
      .select('id')
      .eq('id', user.id)

    console.log('Business user check result:', { existingBusinessUser, checkError })

    if (checkError) {
      console.error('business_users確認エラー:', checkError)
      throw new InvitationError(`ユーザー情報の確認に失敗: ${checkError.message}`, 'user_create_failed', 500)
    }

    if (!existingBusinessUser || existingBusinessUser.length === 0) {
      console.log('Creating business_users record for user:', user.id)

      // LINE IDパターンの名前を除外するヘルパー関数
      const isValidName = (name: string | undefined | null): boolean => {
        if (!name || name.trim() === '') return false
        // LINE ID形式（@line.localを含む）の場合は無効
        if (name.includes('@line.local')) return false
        // u + 英数字32文字のパターン（LINE内部ID）も除外
        if (/^u[a-f0-9]{32}$/i.test(name)) return false
        return true
      }

      // 名前の優先順位: 招待時の名前 > Googleアカウントの名前（LINE ID除外）> 空文字
      let userName = ''
      if (isValidName(invitation.name)) {
        userName = invitation.name
      } else if (isValidName(user.user_metadata?.name)) {
        userName = user.user_metadata.name
      } else if (isValidName(user.user_metadata?.full_name)) {
        userName = user.user_metadata.full_name
      }

      console.log('Name resolution:', {
        invitationName: invitation.name,
        metadataName: user.user_metadata?.name,
        metadataFullName: user.user_metadata?.full_name,
        resolvedName: userName
      })

      // business_usersテーブルにレコードを作成
      const businessUserData = {
        id: user.id,
        email: user.email,
        name: userName
      }
      
      console.log('Business user data to insert:', businessUserData)
      
      const { data: newBusinessUser, error: businessUserError } = await supabaseAdmin
        .from('business_users')
        .insert([businessUserData])
        .select()

      console.log('Business user creation result:', { newBusinessUser, businessUserError })

      if (businessUserError) {
        console.error('business_users作成エラー:', businessUserError)
        throw new InvitationError(`ユーザー情報の作成に失敗: ${businessUserError.message}`, 'user_create_failed', 500)
      }
      
      console.log('Business user created successfully:', newBusinessUser)
    } else {
      console.log('Business user already exists:', existingBusinessUser[0])

      // LINE IDパターンの名前を除外するヘルパー関数
      const isValidNameForUpdate = (name: string | undefined | null): boolean => {
        if (!name || name.trim() === '') return false
        if (name.includes('@line.local')) return false
        if (/^u[a-f0-9]{32}$/i.test(name)) return false
        return true
      }

      // 招待時に入力された有効な名前がある場合、既存ユーザーの名前を更新
      if (isValidNameForUpdate(invitation.name)) {
        console.log('Updating business_users name with invitation name:', invitation.name)
        const { error: updateError } = await supabaseAdmin
          .from('business_users')
          .update({ name: invitation.name })
          .eq('id', user.id)

        if (updateError) {
          console.error('business_users名前更新エラー:', updateError)
          // エラーでも処理は続行（名前更新は必須ではない）
        } else {
          console.log('Business user name updated successfully')
        }
      }
    }

    // store_membershipsに登録（サービスロールで）
    // UNIQUE(business_user_id, store_id) 制約 + onConflict 'ignoreDuplicates' で
    // race condition による重複行挿入を物理的に防ぐ。
    // 並列 POST が走っても、後発のリクエストは insert がスキップされて 0 行になる。
    const membershipData = {
      business_user_id: user.id,
      store_id: invitation.store_id,
      role: invitation.role,
      company_id: invitation.stores?.company_id || null,
      shift_name: invitation.shift_name || null,
      name: invitation.name || null,
    }

    console.log('Upserting store membership with data:', membershipData)

    const { data: membershipResult, error: membershipError } = await supabaseAdmin
      .from('store_memberships')
      .upsert([membershipData], {
        onConflict: 'business_user_id,store_id',
        ignoreDuplicates: true,
      })
      .select()

    console.log('Store membership upsert result:', { membershipResult, membershipError })

    if (membershipError) {
      console.error('store_memberships登録エラー:', membershipError)
      throw new InvitationError(`メンバー登録に失敗: ${membershipError.message}`, 'membership_failed', 500)
    }

    // ignoreDuplicates: true の場合、既存行があると select は空配列を返すが、
    // それは「既に登録済み = 成功」と等価なので 200 で返す。
    // (上の冪等性ガードで完全には拾えない、UNIQUE 違反タイミングのケース対応)
    const isAlreadyMember = !membershipResult || membershipResult.length === 0
    if (isAlreadyMember) {
      console.log('Membership already existed (race-safe path), treating as success')
    } else {
      console.log('store_memberships登録成功:', membershipResult)
    }

    // 招待ステータスを完了に更新（サービスロールで）
    const { error: statusError } = await supabaseAdmin
      .from('store_invitations')
      .update({ status: 'completed' })
      .eq('token', invitationToken)

    if (statusError) {
      console.error('Status update error:', statusError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: isAlreadyMember ? 'すでに登録済みです' : 'スタッフ登録が完了しました',
        alreadyMember: isAlreadyMember,
        store: invitation.stores,
        role: invitation.role,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Complete staff invitation error:', error)

    // エラーの詳細をログに記録
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      reason: error.reason,
    })

    // InvitationError なら reason / status をそのまま使う。
    // それ以外はメッセージ含意で推定 (旧呼び出し互換)、最終的に unknown。
    let reason: FailReason = (error as InvitationError).reason
    let statusCode: number = (error as InvitationError).status || 400

    if (!reason) {
      const m = String(error?.message || '')
      if (m.includes('認証')) { reason = 'auth_failed'; statusCode = 401 }
      else if (m.includes('招待が見つからない') || m.includes('使用済み')) { reason = 'invitation_not_found'; statusCode = 404 }
      else if (m.includes('既にこの店舗のメンバー')) { reason = 'membership_failed'; statusCode = 500 }
      else { reason = 'unknown'; statusCode = 400 }
    }

    return new Response(
      JSON.stringify({
        success: false,
        reason,                 // フロント側で文言マッピングのキーとして使う
        error: error.message,   // デバッグ用 (ユーザーには表示しない)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    )
  }
})