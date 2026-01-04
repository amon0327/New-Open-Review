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
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
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

    // トランザクション的な処理
    // 1. 同じ店舗の既存の公開フォームをすべて非公開にする
    const { error: unpublishError } = await supabase
      .from('store_review_forms')
      .update({ is_published: false })
      .eq('store_id', storeId)
      .neq('review_form_id', reviewFormId)

    if (unpublishError) {
      console.error('Unpublish error:', unpublishError)
      throw unpublishError
    }

    // 2. 指定された店舗とフォームの組み合わせを探す
    const { data: existingRecord, error: searchError } = await supabase
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
      const { data, error: updateError } = await supabase
        .from('store_review_forms')
        .update({ 
          is_published: true,
          updated_at: new Date().toISOString()
        })
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
      const { data, error: insertError } = await supabase
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
    const { error: formUpdateError } = await supabase
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