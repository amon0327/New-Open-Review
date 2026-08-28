const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLotterySchema() {
  try {
    console.log('🔍 Checking lottery table schema...\n');
    
    // Try to get information about the lottery table structure
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: 'lottery' })
      .select();
    
    if (error) {
      console.log('RPC function not available, trying direct query...');
      
      // Try to insert a minimal record to see what columns are expected
      const { data, error: insertError } = await supabase
        .from('lottery')
        .insert([{
          review_form_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID that won't pass FK constraint
          win_rate_divisor: 1
        }])
        .select();
      
      console.log('Insert error (expected):', insertError);
      
      // Now try to check existing lottery table by selecting all columns from any record
      const { data: existingData, error: selectError } = await supabase
        .from('lottery')
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.error('Select error:', selectError);
      } else {
        if (existingData && existingData.length > 0) {
          console.log('Existing lottery record structure:');
          console.log(Object.keys(existingData[0]));
        } else {
          console.log('No existing lottery records found');
        }
      }
    } else {
      console.log('Table columns:', columns);
    }
    
    // Try a simple insert without updated_at
    console.log('\n🧪 Testing lottery record insertion...');
    
    // Get the first review form ID for testing
    const { data: formsData } = await supabase
      .from('review_forms')
      .select('id')
      .limit(1);
    
    if (formsData && formsData.length > 0) {
      const testFormId = formsData[0].id;
      
      // Try inserting a record without updated_at
      const { data: testInsert, error: testError } = await supabase
        .from('lottery')
        .insert([{
          review_form_id: testFormId,
          win_rate_divisor: 1,
          max_wins_per_month: 1000,
          current_wins: 0,
          current_trials: 0
        }])
        .select();
      
      if (testError) {
        if (testError.code === '23505') {
          console.log('✅ Test insert failed due to unique constraint (record already exists) - this is expected');
        } else {
          console.error('❌ Test insert error:', testError);
        }
      } else {
        console.log('✅ Test insert successful:', testInsert);
        
        // Clean up test record
        const { error: deleteError } = await supabase
          .from('lottery')
          .delete()
          .eq('id', testInsert[0].id);
        
        if (deleteError) {
          console.error('Warning: Could not clean up test record:', deleteError);
        } else {
          console.log('✅ Test record cleaned up');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkLotterySchema().then(() => {
  console.log('\n✅ Schema check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});