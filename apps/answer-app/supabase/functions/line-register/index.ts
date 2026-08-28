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

  console.log('line-register function called')
  console.log('Request method:', req.method)
  
  try {
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body))
    
    const { lineProfile } = body
    
    if (!lineProfile || !lineProfile.userId) {
      console.error('LINE profile validation failed:', lineProfile)
      throw new Error('LINE profile is required')
    }
    
    console.log('Processing LINE user:', lineProfile.userId)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const lineEmail = `${lineProfile.userId.toLowerCase()}@line.local`
    
    console.log('Checking for existing user with email:', lineEmail)
    
    // まずusersテーブルで検索 (大文字混在の既存行に備えて ilike で
    // 大文字小文字を無視して厳密一致)
    let { data: userMatches, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', lineEmail)
      .limit(1)

    let user = userMatches && userMatches.length > 0 ? userMatches[0] : null
    console.log('User search result:', { user, error: error?.message })

    if (error) {
      console.error('Error searching user:', error)
      throw error
    }

    let isNewUser = false

    if (!user) {
      // 新規ユーザー作成
      isNewUser = true
      console.log('Creating new user for LINE ID:', lineProfile.userId)
      
      // auth.usersに作成（外部キー制約のため）
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: lineEmail,
        email_confirm: true,
        user_metadata: {
          line_user_id: lineProfile.userId,
          name: lineProfile.displayName,
          is_line_user: true
        }
      })
      
      console.log('Auth user creation result:', { 
        success: !authError, 
        userId: authData?.user?.id,
        error: authError?.message 
      })
      
      if (authError) {
        // ユーザーが既に存在する場合はそのユーザーを使用
        const isEmailExists = authError.code === 'email_exists'
          || /already\s+(been\s+)?registered/i.test(authError.message || '')
        if (isEmailExists) {
          // auth.users から既存ユーザーを引く (listUsers は filter が効かないため
          // ページングで探す。LINE ユーザー総数 < 数千の前提で最初の数ページのみ)
          let existingUser = null
          for (let page = 1; page <= 20 && !existingUser; page++) {
            const { data: pageData, error: listError } = await supabase.auth.admin.listUsers({
              page,
              perPage: 200
            })
            if (listError || !pageData?.users?.length) break
            existingUser = pageData.users.find(u => (u.email || '').toLowerCase() === lineEmail) || null
            if (pageData.users.length < 200) break
          }

          if (existingUser) {
            // public.users に対応行があるか upsert
            const { data: existingPublicUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', existingUser.id)
              .maybeSingle()

            if (existingPublicUser) {
              user = existingPublicUser
            } else {
              const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                  id: existingUser.id,
                  name: lineProfile.displayName || 'LINEユーザー',
                  email: lineEmail
                })
                .select()
                .single()
              if (!insertError) {
                user = newUser
              }
            }
          }

          if (!user) {
            console.error('Failed to recover existing user for LINE login:', lineEmail)
            throw authError
          }
        } else {
          throw authError
        }
      } else {
        // public.usersに作成
        console.log('Creating user in public.users table with:', {
          id: authData.user.id,
          name: lineProfile.displayName || 'LINEユーザー',
          email: lineEmail
        })
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: lineProfile.displayName || 'LINEユーザー',
            email: lineEmail
          })
          .select()
          .single()
          
        console.log('Public users insert result:', { 
          success: !insertError, 
          user: newUser,
          error: insertError?.message 
        })
          
        if (insertError) {
          console.error('Failed to create user in public.users:', insertError)
          throw insertError
        }
        
        user = newUser
      }
    } else {
      // 既存ユーザーの名前を更新
      if (user.name !== lineProfile.displayName) {
        const { data: updatedUser } = await supabase
          .from('users')
          .update({ name: lineProfile.displayName })
          .eq('id', user.id)
          .select()
          .single()
          
        if (updatedUser) {
          user = updatedUser
        }
      }
    }

    console.log('Returning user data:', {
      userId: user?.id,
      email: user?.email,
      name: user?.name,
      isNewUser
    })
    
    return new Response(
      JSON.stringify({
        user: user,
        isNewUser: isNewUser
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('LINE register error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})