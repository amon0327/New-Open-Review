const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStoreData() {
  console.log('Checking store data for store_code: 1fc07097\n');

  // 1. Check stores table
  console.log('=== STORES TABLE ===');
  const { data: storeData, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .eq('store_code', '1fc07097');

  if (storeError) {
    console.error('Error querying stores:', storeError);
  } else {
    console.log('Store data:', JSON.stringify(storeData, null, 2));
  }

  if (!storeData || storeData.length === 0) {
    console.log('\n❌ No store found with store_code: 1fc07097');
    return;
  }

  const storeId = storeData[0].id;
  console.log(`\n✓ Found store with ID: ${storeId}`);

  // 2. Check store_review_forms and related review_forms
  console.log('\n=== STORE_REVIEW_FORMS TABLE ===');
  const { data: storeReviewFormsData, error: storeReviewFormsError } = await supabase
    .from('store_review_forms')
    .select(`
      *,
      review_forms (
        id,
        title,
        is_published,
        is_deleted,
        created_at,
        updated_at
      )
    `)
    .eq('store_id', storeId);

  if (storeReviewFormsError) {
    console.error('Error querying store_review_forms:', storeReviewFormsError);
  } else {
    console.log('Store review forms data:', JSON.stringify(storeReviewFormsData, null, 2));
    
    if (storeReviewFormsData && storeReviewFormsData.length > 0) {
      console.log(`\n✓ Found ${storeReviewFormsData.length} review form(s) for this store`);
      
      storeReviewFormsData.forEach((srf, index) => {
        console.log(`\nForm ${index + 1}:`);
        console.log(`  - Review Form ID: ${srf.review_form_id}`);
        console.log(`  - Title: ${srf.review_forms?.title || 'N/A'}`);
        console.log(`  - Published: ${srf.review_forms?.is_published || false}`);
        console.log(`  - Deleted: ${srf.review_forms?.is_deleted || false}`);
        console.log(`  - Created: ${srf.created_at}`);
      });
    } else {
      console.log('\n❌ No review forms found for this store');
    }
  }

  // 3. Also check all available review forms for context
  console.log('\n=== ALL PUBLISHED REVIEW FORMS ===');
  const { data: allFormsData, error: allFormsError } = await supabase
    .from('review_forms')
    .select('id, title, is_published, is_deleted')
    .eq('is_published', true)
    .eq('is_deleted', false);

  if (allFormsError) {
    console.error('Error querying all review forms:', allFormsError);
  } else {
    console.log(`Total published forms: ${allFormsData?.length || 0}`);
    if (allFormsData && allFormsData.length > 0) {
      console.log('Available forms:', allFormsData.map(f => `${f.id}: ${f.title}`).join('\n'));
    }
  }

  // 4. Check if there are any stores with review forms
  console.log('\n=== STORES WITH REVIEW FORMS ===');
  const { data: storesWithForms, error: storesWithFormsError } = await supabase
    .from('stores')
    .select(`
      id,
      store_name,
      store_code,
      store_review_forms (
        review_form_id
      )
    `)
    .not('store_review_forms', 'is', null);

  if (storesWithFormsError) {
    console.error('Error querying stores with forms:', storesWithFormsError);
  } else {
    console.log(`\nTotal stores with review forms: ${storesWithForms?.length || 0}`);
    if (storesWithForms && storesWithForms.length > 0) {
      storesWithForms.forEach(store => {
        console.log(`- ${store.store_name} (${store.store_code}): ${store.store_review_forms.length} form(s)`);
      });
    }
  }
}

checkStoreData()
  .then(() => {
    console.log('\n✓ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });