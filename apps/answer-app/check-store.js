const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStore() {
  const storeCode = '1fc07097';
  
  console.log('=== Checking store code:', storeCode, '===\n');
  
  try {
    // 1. Check if store exists
    console.log('1. Checking stores table...');
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('store_url_code', storeCode)
      .single();
    
    if (storeError) {
      console.error('Store error:', storeError);
      return;
    }
    
    console.log('Store found:', storeData);
    console.log('\n');
    
    // 2. Check store_review_forms
    console.log('2. Checking store_review_forms...');
    const { data: storeReviewForm, error: formError } = await supabase
      .from('store_review_forms')
      .select('*')
      .eq('store_id', storeData.id)
      .single();
    
    if (formError) {
      console.error('Store review form error:', formError);
      return;
    }
    
    console.log('Store review form found:', storeReviewForm);
    console.log('\n');
    
    // 3. Check review_forms
    console.log('3. Checking review_forms...');
    const { data: reviewForm, error: reviewFormError } = await supabase
      .from('review_forms')
      .select('id, title, is_published, is_deleted')
      .eq('id', storeReviewForm.review_form_id)
      .single();
    
    if (reviewFormError) {
      console.error('Review form error:', reviewFormError);
      return;
    }
    
    console.log('Review form found:', reviewForm);
    console.log('\n');
    
    // 4. Summary
    console.log('=== Summary ===');
    console.log('Store exists:', !!storeData);
    console.log('Store has review form:', !!storeReviewForm);
    console.log('Review form is published:', reviewForm?.is_published);
    console.log('Review form is deleted:', reviewForm?.is_deleted);
    console.log('Review form should be accessible:', reviewForm?.is_published && !reviewForm?.is_deleted);
    
    // 5. Test Edge Function
    console.log('\n=== Testing Edge Function ===');
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/store-redirect?code=${storeCode}`;
    console.log('Edge Function URL:', edgeFunctionUrl);
    
    try {
      const response = await fetch(edgeFunctionUrl, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Edge Function response:', {
        status: response.status,
        ok: response.ok,
        data
      });
    } catch (fetchError) {
      console.error('Edge Function error:', fetchError);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStore();