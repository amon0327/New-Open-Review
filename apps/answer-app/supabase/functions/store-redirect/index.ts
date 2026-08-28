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
    // Get store code from query parameters
    const url = new URL(req.url)
    const storeCode = url.searchParams.get('code')
    
    if (!storeCode) {
      return new Response(
        JSON.stringify({ error: 'Store code is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Looking up store with code:', storeCode)

    // First, try to find the store by store_url_code
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, company_id, companies!inner(line_mini_app_url)')
      .eq('store_url_code', storeCode)
      .single()

    if (storeError || !storeData) {
      console.error('Store not found:', storeError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Store not found',
          details: {
            storeCode,
            errorMessage: storeError?.message || 'No store found with this code'
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    console.log('Found store:', storeData)

    // Then find the published review form for this store
    const { data: storeReviewForms, error: formError } = await supabase
      .from('store_review_forms')
      .select(`
        review_form_id,
        is_published,
        created_at,
        review_forms!inner (
          id,
          is_published,
          is_deleted
        )
      `)
      .eq('store_id', storeData.id)
      .eq('is_published', true)
      .eq('review_forms.is_published', true)
      .eq('review_forms.is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (formError || !storeReviewForms || storeReviewForms.length === 0) {
      console.error('No published review form found for store:', formError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No published review form found for this store',
          details: {
            storeId: storeData.id,
            storeCode,
            errorMessage: formError?.message || 'Store has no published review form'
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    const storeReviewForm = storeReviewForms[0]

    console.log('Found review form:', storeReviewForm.review_form_id)

    // The review form is already verified in the join query above

    // Return the review form ID
    return new Response(
      JSON.stringify({
        success: true,
        formId: storeReviewForm.review_form_id,
        storeId: storeData.id,
        companyId: storeData.company_id,
        lineMiniAppUrl: storeData.companies?.line_mini_app_url ?? null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Store redirect error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})