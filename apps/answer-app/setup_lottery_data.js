const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupLotteryData() {
  try {
    console.log('🎯 Setting up lottery data for 1/1 probability (always win)...\n');
    
    // First, get all active review forms
    const { data: formsData, error: formsError } = await supabase
      .from('review_forms')
      .select('id, title')
      .eq('is_deleted', false)
      .eq('is_published', true);
    
    if (formsError) {
      console.error('❌ Error fetching review forms:', formsError);
      return;
    }
    
    if (!formsData || formsData.length === 0) {
      console.log('⚠️  No published review forms found');
      return;
    }
    
    console.log(`📋 Found ${formsData.length} published review form(s):`);
    formsData.forEach((form, index) => {
      console.log(`   ${index + 1}. ${form.title} (ID: ${form.id})`);
    });
    console.log('');
    
    // Create lottery records for each form
    const lotteryRecords = [];
    for (const form of formsData) {
      // Check if lottery record already exists
      const { data: existingLottery, error: checkError } = await supabase
        .from('lottery')
        .select('*')
        .eq('review_form_id', form.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`❌ Error checking existing lottery for form ${form.id}:`, checkError);
        continue;
      }
      
      if (existingLottery) {
        console.log(`✅ Lottery record already exists for "${form.title}" (Form ID: ${form.id})`);
        console.log(`   Current settings: win_rate_divisor=${existingLottery.win_rate_divisor}, max_wins=${existingLottery.max_wins_per_month}, current_wins=${existingLottery.current_wins}, current_trials=${existingLottery.current_trials}`);
        
        // Update to ensure 1/1 probability if needed
        if (existingLottery.win_rate_divisor !== 1) {
          console.log(`   🔄 Updating win_rate_divisor from ${existingLottery.win_rate_divisor} to 1 (always win)`);
          const { error: updateError } = await supabase
            .from('lottery')
            .update({ 
              win_rate_divisor: 1
            })
            .eq('id', existingLottery.id);
          
          if (updateError) {
            console.error(`❌ Error updating lottery record:`, updateError);
          } else {
            console.log(`   ✅ Updated successfully`);
          }
        }
        continue;
      }
      
      // Create new lottery record with 1/1 probability (always win)
      const lotteryRecord = {
        review_form_id: form.id,
        win_rate_divisor: 1,        // 1/1 = 100% win rate
        max_wins_per_month: 1000,   // High limit so it doesn't block wins
        current_wins: 0,            // Reset current wins
        current_trials: 0           // Reset current trials
        // Note: created_at and updated_at should be handled by database defaults
      };
      
      lotteryRecords.push(lotteryRecord);
      console.log(`📝 Will create lottery record for "${form.title}" (Form ID: ${form.id})`);
      console.log(`   Settings: win_rate_divisor=1 (always win), max_wins_per_month=1000`);
    }
    
    if (lotteryRecords.length === 0) {
      console.log('\n✅ All forms already have lottery records configured');
      return;
    }
    
    // Insert all new lottery records
    console.log(`\n🚀 Inserting ${lotteryRecords.length} new lottery record(s)...`);
    const { data: insertedData, error: insertError } = await supabase
      .from('lottery')
      .insert(lotteryRecords)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting lottery records:', insertError);
      return;
    }
    
    console.log(`✅ Successfully created ${insertedData.length} lottery record(s)!`);
    
    // Verify the records
    console.log('\n🔍 Verifying created records:');
    for (const record of insertedData) {
      const form = formsData.find(f => f.id === record.review_form_id);
      console.log(`   ✅ ${form.title}: win_rate_divisor=${record.win_rate_divisor}, max_wins=${record.max_wins_per_month}`);
    }
    
    console.log('\n🎉 Lottery setup completed! All forms now have 1/1 probability (always win)');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function createRequiredTables() {
  console.log('🏗️  Checking if required lottery tables exist...\n');
  
  // Check if lottery table exists by trying to query it
  const { data: lotteryCheck, error: lotteryError } = await supabase
    .from('lottery')
    .select('id')
    .limit(1);
  
  if (lotteryError && lotteryError.code === '42P01') {
    console.log('⚠️  lottery table does not exist. You need to create it manually.');
    console.log('\nSQL to create lottery table:');
    console.log(`
CREATE TABLE lottery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  review_form_id uuid REFERENCES review_forms(id) ON DELETE CASCADE NOT NULL,
  win_rate_divisor integer NOT NULL DEFAULT 10,
  max_wins_per_month integer NOT NULL DEFAULT 100,
  current_wins integer NOT NULL DEFAULT 0,
  current_trials integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(review_form_id)
);

CREATE TABLE lottery_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  review_form_id uuid REFERENCES review_forms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE lottery_winners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id uuid REFERENCES lottery_log(id) ON DELETE CASCADE NOT NULL,
  is_received boolean DEFAULT false,
  received_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_lottery_log_review_form_user ON lottery_log(review_form_id, user_id);
CREATE INDEX idx_lottery_log_created_at ON lottery_log(created_at);
CREATE INDEX idx_lottery_winners_log_id ON lottery_winners(log_id);
CREATE INDEX idx_lottery_winners_created_at ON lottery_winners(created_at);
    `);
    return false;
  }
  
  if (lotteryError) {
    console.error('❌ Error checking lottery table:', lotteryError);
    return false;
  }
  
  console.log('✅ lottery table exists');
  
  // Check lottery_log table
  const { data: logCheck, error: logError } = await supabase
    .from('lottery_log')
    .select('id')
    .limit(1);
  
  if (logError && logError.code === '42P01') {
    console.log('⚠️  lottery_log table does not exist');
    return false;
  }
  
  if (logError) {
    console.error('❌ Error checking lottery_log table:', logError);
    return false;
  }
  
  console.log('✅ lottery_log table exists');
  
  // Check lottery_winners table
  const { data: winnersCheck, error: winnersError } = await supabase
    .from('lottery_winners')
    .select('id')
    .limit(1);
  
  if (winnersError && winnersError.code === '42P01') {
    console.log('⚠️  lottery_winners table does not exist');
    return false;
  }
  
  if (winnersError) {
    console.error('❌ Error checking lottery_winners table:', winnersError);
    return false;
  }
  
  console.log('✅ lottery_winners table exists');
  console.log('✅ All required tables exist\n');
  
  return true;
}

// Run the setup
createRequiredTables().then(tablesExist => {
  if (tablesExist) {
    return setupLotteryData();
  } else {
    console.log('\n❌ Required tables are missing. Please create them first.');
    process.exit(1);
  }
}).then(() => {
  console.log('\n✅ Setup completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});