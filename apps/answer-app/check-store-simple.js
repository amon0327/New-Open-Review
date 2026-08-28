require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkStore() {
  const storeCode = '1fc07097';
  
  console.log('=== Store Data Check for code: ' + storeCode + ' ===\n');
  
  // 1. Check stores table
  try {
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .eq('store_code', storeCode);
    
    if (error) {
      console.error('Error checking stores:', error);
      return;
    }
    
    console.log('Stores found:', stores.length);
    if (stores.length > 0) {
      console.log('Store details:', JSON.stringify(stores[0], null, 2));
      
      const storeId = stores[0].id;
      
      // 2. Check store_review_forms
      const { data: storeReviewForms, error: srfError } = await supabase
        .from('store_review_forms')
        .select('*')
        .eq('store_id', storeId);
      
      if (srfError) {
        console.error('Error checking store_review_forms:', srfError);
      } else {
        console.log('\nStore review forms found:', storeReviewForms.length);
        if (storeReviewForms.length > 0) {
          console.log('Store review forms:', JSON.stringify(storeReviewForms, null, 2));
          
          // 3. Check each review form
          for (const srf of storeReviewForms) {
            const { data: reviewForm, error: rfError } = await supabase
              .from('review_forms')
              .select('id, title, is_published, is_deleted')
              .eq('id', srf.review_form_id)
              .single();
            
            if (rfError) {
              console.error('Error checking review form:', rfError);
            } else {
              console.log('\nReview form details:');
              console.log('- ID:', reviewForm.id);
              console.log('- Title:', reviewForm.title);
              console.log('- Published:', reviewForm.is_published);
              console.log('- Deleted:', reviewForm.is_deleted);
            }
          }
        }
      }
    } else {
      console.log('No store found with code:', storeCode);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkStore().then(() => process.exit(0));