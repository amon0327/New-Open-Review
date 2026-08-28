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

    // LINE IDをemail形式に変換（既存のテーブル構造に合わせる）
    const lineEmail = `${lineProfile.userId}@line.local`
    
    // まずpublic.usersテーブルでユーザーを検索
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', lineEmail)
      .single()

    let user;
    let isNewUser = false;

    if (existingUser && !searchError) {
      // 既存ユーザーが見つかった
      console.log('Existing LINE user found:', existingUser.id)
      
      // ユーザー情報を更新
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: lineProfile.displayName || existingUser.name
        })
        .eq('id', existingUser.id)
        .select()
        .single()
        
      if (updateError) {
        console.error('Failed to update user:', updateError)
        user = existingUser
      } else {
        user = updatedUser
      }
    } else {
      // 新規ユーザーを作成
      isNewUser = true
      console.log('Creating new user for LINE ID:', lineProfile.userId)
      
      // auth.usersに先に作成する必要がある（外部キー制約のため）
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: lineEmail,
        email_confirm: true,
        user_metadata: {
          line_user_id: lineProfile.userId,
          name: lineProfile.displayName,
          is_line_user: true
        }
      })
      
      if (authError) {
        console.error('Failed to create auth user:', authError)
        throw authError
      }
      
      const newUserId = authData.user.id
      
      // public.usersテーブルにレコードを作成
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          name: lineProfile.displayName || 'LINEユーザー',
          email: lineEmail
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('Failed to create user:', insertError)
        throw insertError
      }
      
      user = newUser
      console.log('Created new user:', user)
    }

    // ユーザー情報を返す（認証トークンなし、シンプルにユーザー情報のみ）
    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          line_user_id: lineProfile.userId,
          line_display_name: lineProfile.displayName,
          line_picture_url: lineProfile.pictureUrl
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