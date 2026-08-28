const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDetailed() {
  console.log('=== 詳細なデバッグ情報 ===\n');
  
  try {
    // 1. すべての店舗を確認
    console.log('1. すべての店舗を表示:');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, store_url_code, company_id')
      .limit(10);
    
    if (storesError) {
      console.error('Stores error:', storesError);
    } else {
      console.table(stores);
    }
    
    // 2. store_review_formsの関係を確認
    console.log('\n2. store_review_formsテーブル:');
    const { data: storeReviewForms, error: srfError } = await supabase
      .from('store_review_forms')
      .select('store_id, review_form_id')
      .limit(10);
    
    if (srfError) {
      console.error('Store review forms error:', srfError);
    } else {
      console.table(storeReviewForms);
    }
    
    // 3. 1fc07097で検索（store_url_codeとして）
    console.log('\n3. store_url_code = 1fc07097 で検索:');
    const { data: specificStore, error: specificError } = await supabase
      .from('stores')
      .select(`
        *,
        store_review_forms (
          review_form_id,
          review_forms (
            id,
            title,
            is_published,
            is_deleted
          )
        )
      `)
      .eq('store_url_code', '1fc07097')
      .single();
    
    if (specificError) {
      console.error('検索エラー:', specificError);
      
      // 4. 1fc07097をreview_form_idとして検索
      console.log('\n4. review_form_id = 1fc07097 で検索:');
      const { data: reviewForm, error: rfError } = await supabase
        .from('review_forms')
        .select('id, title, is_published, is_deleted')
        .eq('id', '1fc07097')
        .single();
      
      if (rfError) {
        console.error('Review form not found:', rfError);
      } else {
        console.log('Review form found:', reviewForm);
        
        // この場合、直接reviewFormIdとして使用可能
        console.log('\n=> 1fc07097 は review_form_id です。');
        console.log('=> 以下のURLを使用してください:');
        console.log(`   https://liff.line.me/2008812855-Ig8w1gkY?reviewFormId=1fc07097`);
      }
    } else {
      console.log('Store found:', specificStore);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDetailed();