const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStoreStructure() {
  console.log('=== Checking stores table structure ===\n');
  
  try {
    // 1. storesテーブルから1件取得してカラム構造を確認
    console.log('1. Getting sample store record...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(1);
    
    if (storesError) {
      console.error('Error fetching stores:', storesError);
    } else if (stores && stores.length > 0) {
      console.log('Store columns:', Object.keys(stores[0]));
      console.log('Sample store data:', stores[0]);
    } else {
      console.log('No stores found in the table');
    }
    
    console.log('\n');
    
    // 2. store_review_formsテーブルの構造も確認
    console.log('2. Getting sample store_review_forms record...');
    const { data: storeReviewForms, error: srfError } = await supabase
      .from('store_review_forms')
      .select('*')
      .limit(1);
    
    if (srfError) {
      console.error('Error fetching store_review_forms:', srfError);
    } else if (storeReviewForms && storeReviewForms.length > 0) {
      console.log('Store review forms columns:', Object.keys(storeReviewForms[0]));
      console.log('Sample data:', storeReviewForms[0]);
    } else {
      console.log('No store_review_forms found');
    }
    
    console.log('\n');
    
    // 3. IDで店舗を検索（1fc07097がstore_idの可能性）
    console.log('3. Trying to find store by ID: 1fc07097');
    const { data: storeById, error: idError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', '1fc07097')
      .single();
    
    if (idError) {
      console.log('No store found with ID 1fc07097');
    } else {
      console.log('Found store by ID:', storeById);
    }
    
    // 4. store_nameで検索してみる（部分一致）
    console.log('\n4. Searching stores by name containing "1fc07097"...');
    const { data: storesByName, error: nameError } = await supabase
      .from('stores')
      .select('*')
      .ilike('store_name', '%1fc07097%');
    
    if (nameError) {
      console.error('Error searching by name:', nameError);
    } else if (storesByName && storesByName.length > 0) {
      console.log('Found stores by name:', storesByName);
    } else {
      console.log('No stores found with "1fc07097" in name');
    }
    
    // 5. review_formsテーブルで1fc07097を検索
    console.log('\n5. Checking if 1fc07097 is a review_form ID...');
    const { data: reviewForm, error: rfError } = await supabase
      .from('review_forms')
      .select('id, title, is_published, is_deleted')
      .eq('id', '1fc07097')
      .single();
    
    if (rfError) {
      console.log('No review form found with ID 1fc07097');
    } else {
      console.log('Found review form:', reviewForm);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStoreStructure();