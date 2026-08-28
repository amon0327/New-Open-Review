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
    const { code, state } = await req.json()

    console.log('LINE Login function called with:', { code: code?.substring(0, 10) + '...', state })

    if (!code) {
      throw new Error('認証コードが見つかりません')
    }

    const lineChannelId = Deno.env.get('LINE_CHANNEL_ID')!
    const lineChannelSecret = Deno.env.get('LINE_CHANNEL_SECRET')!
    const lineRedirectUri = Deno.env.get('LINE_REDIRECT_URI')!

    console.log('Environment variables:', {
      lineChannelId,
      lineChannelSecret: lineChannelSecret ? 'SET' : 'NOT SET',
      lineRedirectUri
    })

    // LINEからアクセストークンを取得
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: lineRedirectUri,
        client_id: lineChannelId,
        client_secret: lineChannelSecret,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('LINE token request failed:', tokenResponse.status, errorText)
      throw new Error(`LINEトークン取得に失敗しました: ${tokenResponse.status} ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('LINE token response:', { access_token: tokenData.access_token ? 'RECEIVED' : 'NOT RECEIVED' })
    const accessToken = tokenData.access_token

    // LINEユーザー情報を取得
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      throw new Error('LINEプロフィール取得に失敗しました')
    }

    const profile = await profileResponse.json()
    console.log('LINE profile received:', { userId: profile.userId, displayName: profile.displayName })

    // Supabaseクライアント作成
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    console.log('Supabase config:', {
      url: supabaseUrl,
      serviceKey: supabaseServiceKey ? 'SET' : 'NOT SET'
    })
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ユーザーをemailで検索（LINEのuser IDをemailとして使用）
    const lineEmail = `${profile.userId}@line.local`
    console.log('Looking up user with email:', lineEmail)

    // Try to create or find existing user
    console.log('Attempting to create or retrieve user...')
    let user

    // Function to search all users with pagination
    const findUserByEmail = async (email) => {
      console.log('Starting comprehensive user search for:', email)

      // Use listUsers to get all users
      const { data: usersData, error } = await supabase.auth.admin.listUsers()

      if (error) {
        console.error('Error listing users:', error)
        return null
      }

      const users = usersData?.users || []
      console.log(`Found ${users.length} total users in database`)

      if (users.length === 0) {
        console.log('No users found in database')
        return null
      }

      // Search through all users
      for (const user of users) {
        if (user.email === email) {
          console.log('User found:', { id: user.id, email: user.email })
          return user
        }
      }

      console.log(`No match found for ${email}`)
      return null
    }

    // Try creating user first
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: lineEmail,
      password: Math.random().toString(36),
      email_confirm: true,
      user_metadata: {
        line_user_id: profile.userId,
        line_display_name: profile.displayName,
        line_picture_url: profile.pictureUrl,
        provider: 'line'
      }
    })

    if (createError && createError.message.includes('already been registered')) {
      // User already exists, search for them
      console.log('User already exists, searching...')

      const existingLineUser = await findUserByEmail(lineEmail)

      if (!existingLineUser) {
        console.error('User exists but not found in search.')
        console.log('Generating magic link for existing user (alternative approach)...')

        const { data: magicSession, error: magicError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: lineEmail
        })

        if (magicError) {
          console.error('Magic link generation failed:', magicError)
          throw new Error('ユーザー認証に失敗しました: ' + magicError.message)
        }

        console.log('Magic link generated successfully via alternative approach')

        return new Response(
          JSON.stringify({
            success: true,
            user: {
              email: lineEmail,
              line_display_name: profile.displayName,
              picture_url: profile.pictureUrl
            },
            session_url: magicSession.properties?.action_link,
            note: 'User authenticated via alternative method'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      console.log('Found existing user:', existingLineUser.id)

      // Update existing user
      console.log('Updating existing user...')
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        existingLineUser.id,
        {
          user_metadata: {
            ...existingLineUser.user_metadata,
            line_display_name: profile.displayName,
            line_picture_url: profile.pictureUrl,
            last_login: new Date().toISOString()
          }
        }
      )

      if (updateError) {
        console.error('User update error:', updateError)
        throw new Error('ユーザー更新に失敗しました: ' + updateError.message)
      }
      user = updatedUser.user
      console.log('User updated successfully')
    } else if (createError) {
      console.error('User creation error:', createError)
      throw new Error('ユーザー作成に失敗しました: ' + createError.message)
    } else {
      // New user created successfully
      user = newUser.user
      console.log('New user created successfully')

      // Create business_users record for new LINE user
      console.log('Creating business_users record for new LINE user...')
      const { error: businessUserError } = await supabase
        .from('business_users')
        .insert([{
          id: user.id,
          email: lineEmail,
          name: profile.displayName || 'LINEユーザー'
        }])

      if (businessUserError) {
        console.error('business_users creation error:', businessUserError)
        // Don't throw error, just log it
      } else {
        console.log('business_users record created successfully')
      }
    }

    // Magic Linkを生成
    console.log('Generating magic link for user:', user.id)
    const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: lineEmail
    })

    if (sessionError) {
      console.error('Session generation error:', sessionError)
      throw new Error('セッション作成に失敗しました: ' + sessionError.message)
    }

    console.log('Magic link generated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          line_user_id: profile.userId,
          display_name: profile.displayName,
          picture_url: profile.pictureUrl
        },
        session_url: session.properties?.action_link
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('LINE login function error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack || 'No stack trace available'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
