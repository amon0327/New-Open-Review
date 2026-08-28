import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { lineProfile } = await req.json()
    
    if (!lineProfile || !lineProfile.userId) {
      return new Response(
        JSON.stringify({ error: 'LINE profile is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // LINE IDをemail形式に変換
    const lineEmail = `${lineProfile.userId}@line.local`
    
    // まずpublic.usersテーブルでユーザーを検索
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', lineEmail)
      .single()

    let userId: string
    let isNewUser = false

    if (existingUser && !searchError) {
      // 既存ユーザーが見つかった
      userId = existingUser.id
      console.log('Existing LINE user found:', userId)
      
      // ユーザー情報を更新
      if (existingUser.name !== lineProfile.displayName) {
        await supabase
          .from('users')
          .update({
            name: lineProfile.displayName || existingUser.name
          })
          .eq('id', userId)
      }
    } else {
      // ユーザーが見つからない場合、auth.usersを確認
      const { data: authUsers } = await supabase.auth.admin.listUsers({
        filter: `email.eq.${lineEmail}`
      })
      
      if (authUsers && authUsers.users && authUsers.users.length > 0) {
        // auth.usersには存在するがpublic.usersには存在しない場合
        userId = authUsers.users[0].id
        console.log('Found existing auth user, creating public.users record:', userId)
        
        // public.usersテーブルにレコードを作成
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            name: lineProfile.displayName || 'LINEユーザー',
            email: lineEmail
          })
        
        if (insertError) {
          console.error('Failed to create user in public.users:', insertError)
        }
        
        // メタデータを更新
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            line_user_id: lineProfile.userId,
            name: lineProfile.displayName,
            avatar_url: lineProfile.pictureUrl,
            is_line_user: true
          }
        })
      } else {
        // 完全に新規のユーザー
        isNewUser = true
        console.log('Creating new user for LINE ID:', lineProfile.userId)
        
        // auth.usersにユーザーを作成
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: lineEmail,
          email_confirm: true,
          user_metadata: {
            line_user_id: lineProfile.userId,
            name: lineProfile.displayName,
            avatar_url: lineProfile.pictureUrl,
            is_line_user: true
          },
          app_metadata: {
            provider: 'line',
            providers: ['line']
          }
        })
        
        if (authError) {
          console.error('Failed to create auth user:', authError)
          throw authError
        }
        
        userId = authData.user.id
        console.log('Created new auth user:', userId)
        
        // public.usersテーブルにもレコードを作成
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            name: lineProfile.displayName || 'LINEユーザー',
            email: lineEmail
          })
        
        if (insertError) {
          console.error('Failed to create user in public.users:', insertError)
          // auth.usersの作成は成功しているので、エラーでも続行
        }
      }
    }

    // セッションを作成
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      userId: userId
    })

    if (sessionError || !sessionData.session) {
      console.error('Failed to create session:', sessionError)
      throw new Error('Failed to create session')
    }

    // ユーザー情報を返す
    return new Response(
      JSON.stringify({
        session: sessionData.session,
        user: {
          id: userId,
          email: lineEmail,
          line_user_id: lineProfile.userId,
          name: lineProfile.displayName || 'LINEユーザー'
        },
        isNewUser
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('LINE auth error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})