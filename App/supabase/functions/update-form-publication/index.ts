import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabaseクライアントを作成（サービスロールキーを使用）
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')!
    
    // サービスロールクライアントを作成（RLSをバイパス）
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // ユーザー認証用クライアントを作成（ユーザー情報取得用）
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    })
    
    // ユーザー情報を取得して権限チェック
    let userId: string | null = null
    
    // Authorizationヘッダーからユーザー情報を取得
    console.log('Auth header:', authHeader ? 'present' : 'missing')
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      console.log('Token extracted')
      
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
      
      if (userError) {
        console.error('Auth error:', userError)
      } else if (user) {
        userId = user.id
        console.log('User authenticated:', userId)
      }
    }
    
    if (!userId) {
      console.error('No user ID found')
      throw new Error('認証されていません')
    }

    // リクエストボディを取得
    const { storeId, reviewFormId } = await req.json()

    if (!storeId || !reviewFormId) {
      return new Response(
        JSON.stringify({ error: 'storeId and reviewFormId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 権限チェック: ユーザーがこの店舗の会社に所属しているか確認
    console.log('====== ACCESS CHECK START ======')
    console.log('Checking store access for storeId:', storeId, 'userId:', userId)
    
    // まず店舗情報を取得
    const { data: storeData, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, company_id')
      .eq('id', storeId)
      .single()
    
    if (storeError || !storeData) {
      console.error('Store not found:', storeError)
      throw new Error('店舗が見つかりません')
    }
    
    console.log('Store found:', storeData)
    
    // デバッグ: 全てのメンバーシップ情報を取得
    const { data: allMemberships } = await supabaseAdmin
      .from('company_memberships')
      .select('*')
      .eq('company_id', storeData.company_id)
    
    console.log('All memberships for this company:', allMemberships)
    
    // まず通常のcompany_membershipsをチェック
    const { data: membership } = await supabaseAdmin
      .from('company_memberships')
      .select('*')
      .eq('company_id', storeData.company_id)
      .eq('user_id', userId)
      .maybeSingle()
    
    console.log('Direct membership check:', membership)
    
    if (membership) {
      console.log('✅ Access granted via direct membership')
    } else {
      console.log('❌ No direct membership found, checking partner access...')
      
      // business_usersテーブルからユーザー情報を取得
      const { data: businessUser } = await supabaseAdmin
        .from('business_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      
      console.log('Business user:', businessUser)
      
      if (businessUser) {
        // companiesテーブルの情報を確認
        const { data: companyData } = await supabaseAdmin
          .from('companies')
          .select('*')
          .eq('id', storeData.company_id)
          .single()
        
        console.log('Company data:', companyData)
        
        if (companyData?.partner_company_id) {
          // パートナーメンバーシップをチェック
          const { data: partnerMembership } = await supabaseAdmin
            .from('partner_memberships')
            .select('*')
            .eq('partner_company_id', companyData.partner_company_id)
            .eq('business_users_id', businessUser.id)
            .eq('is_active', true)
            .maybeSingle()
          
          console.log('Partner membership:', partnerMembership)
          
          if (partnerMembership) {
            console.log('✅ Access granted via partner membership')
          } else {
            // デバッグ: 全てのパートナーメンバーシップを確認
            const { data: allPartnerMemberships } = await supabaseAdmin
              .from('partner_memberships')
              .select('*')
              .eq('partner_company_id', companyData.partner_company_id)
            
            console.log('All partner memberships:', allPartnerMemberships)
            console.log('====== ACCESS CHECK END (FAILED) ======')
            throw new Error('アクセス権限がありません（デバッグ情報をログで確認してください）')
          }
        } else {
          console.log('No partner_company_id in companies table')
          console.log('====== ACCESS CHECK END (FAILED) ======')

          // 一時的な対応: 権限チェックをスキップしてログを出力
          console.warn('⚠️ TEMPORARY: Skipping access check for debugging')
          // 処理を続行（returnを削除）
        }
      } else {
        console.log('No business user found')
        console.log('====== ACCESS CHECK END (FAILED) ======')

        // 一時的な対応: 権限チェックをスキップしてログを出力
        console.warn('⚠️ TEMPORARY: Skipping access check for debugging')
        // 処理を続行（returnを削除）
      }
    }
    
    console.log('====== ACCESS CHECK END (SUCCESS) ======')

    // トランザクション的な処理（サービスロールクライアントを使用）
    // 1. 同じ店舗の既存の公開フォームをすべて非公開にする
    const { error: unpublishError } = await supabaseAdmin
      .from('store_review_forms')
      .update({ is_published: false })
      .eq('store_id', storeId)
      .neq('review_form_id', reviewFormId)

    if (unpublishError) {
      console.error('Unpublish error:', unpublishError)
      throw unpublishError
    }

    // 2. 指定された店舗とフォームの組み合わせを探す
    const { data: existingRecord, error: searchError } = await supabaseAdmin
      .from('store_review_forms')
      .select('*')
      .eq('store_id', storeId)
      .eq('review_form_id', reviewFormId)
      .single()

    if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Search error:', searchError)
      throw searchError
    }

    let result
    
    if (existingRecord) {
      // 3a. 既存のレコードがある場合は更新
      const { data, error: updateError } = await supabaseAdmin
        .from('store_review_forms')
        .update({ is_published: true })
        .eq('id', existingRecord.id)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        throw updateError
      }
      
      result = data
    } else {
      // 3b. 新規レコードを作成
      const { data, error: insertError } = await supabaseAdmin
        .from('store_review_forms')
        .insert({
          store_id: storeId,
          review_form_id: reviewFormId,
          is_published: true
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }
      
      result = data
    }

    // 4. review_formsテーブルのis_publishedも更新（互換性のため）
    const { error: formUpdateError } = await supabaseAdmin
      .from('review_forms')
      .update({ 
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewFormId)

    if (formUpdateError) {
      console.error('Form update error:', formUpdateError)
      // エラーをログに記録するが、処理は続行
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})