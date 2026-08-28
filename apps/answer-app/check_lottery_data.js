const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLotteryData() {
  try {
    console.log('🔍 Checking lottery table data...\n');
    
    // Check if lottery table exists and get all records
    const { data: lotteryData, error: lotteryError } = await supabase
      .from('lottery')
      .select('*')
      .order('review_form_id', { ascending: true });
    
    if (lotteryError) {
      console.error('❌ Error querying lottery table:', lotteryError);
      
      // Check what tables exist
      console.log('\n📋 Checking available tables...');
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (tablesError) {
        console.error('Error getting table list:', tablesError);
      } else {
        console.log('Available tables:', tables.map(t => t.table_name).sort());
      }
      return;
    }
    
    if (!lotteryData || lotteryData.length === 0) {
      console.log('⚠️  No lottery records found in the database');
    } else {
      console.log(`📊 Found ${lotteryData.length} lottery record(s):\n`);
      
      lotteryData.forEach((record, index) => {
        console.log(`🎯 Record ${index + 1}:`);
        console.log(`   ID: ${record.id}`);
        console.log(`   Review Form ID: ${record.review_form_id}`);
        console.log(`   Win Rate Divisor: ${record.win_rate_divisor}`);
        console.log(`   Max Wins Per Month: ${record.max_wins_per_month}`);
        console.log(`   Current Wins: ${record.current_wins}`);
        console.log(`   Current Trials: ${record.current_trials}`);
        console.log(`   Created At: ${record.created_at}`);
        console.log(`   Updated At: ${record.updated_at}`);
        
        // Calculate win probability
        const winProbability = record.win_rate_divisor ? (1 / record.win_rate_divisor) : 0;
        console.log(`   📈 Win Probability: ${(winProbability * 100).toFixed(2)}% (1/${record.win_rate_divisor})`);
        
        // Check if lottery should work based on current settings
        const shouldWin = record.win_rate_divisor === 1;
        const hasWinsRemaining = record.current_wins < record.max_wins_per_month;
        console.log(`   🎲 Should always win: ${shouldWin ? 'YES' : 'NO'}`);
        console.log(`   🏆 Has wins remaining: ${hasWinsRemaining ? 'YES' : 'NO'} (${record.current_wins}/${record.max_wins_per_month})`);
        console.log('');
      });
    }
    
    // Also check for related tables
    console.log('\n🔍 Checking related lottery tables...');
    
    // Check winners table
    const { data: winnersData, error: winnersError } = await supabase
      .from('winners')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (winnersError) {
      console.log('⚠️  Winners table not accessible or doesn\'t exist');
    } else {
      console.log(`🏆 Found ${winnersData?.length || 0} recent winner(s):`);
      winnersData?.forEach((winner, index) => {
        console.log(`   Winner ${index + 1}: Form ${winner.review_form_id}, User ${winner.user_id}, Created: ${winner.created_at}`);
      });
    }
    
    // Check lottery_eligibility table
    const { data: eligibilityData, error: eligibilityError } = await supabase
      .from('lottery_eligibility')
      .select('*')
      .order('last_submission', { ascending: false })
      .limit(10);
    
    if (eligibilityError) {
      console.log('⚠️  Lottery eligibility table not accessible or doesn\'t exist');
    } else {
      console.log(`\n⏰ Found ${eligibilityData?.length || 0} recent eligibility record(s):`);
      eligibilityData?.forEach((record, index) => {
        const daysSince = record.last_submission ? Math.floor((new Date() - new Date(record.last_submission)) / (1000 * 60 * 60 * 24)) : 'N/A';
        console.log(`   Record ${index + 1}: User ${record.user_id}, Form ${record.review_form_id}, Last: ${record.last_submission} (${daysSince} days ago)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function checkReviewForms() {
  try {
    console.log('\n📋 Checking review forms with lottery settings...');
    
    const { data: formsData, error: formsError } = await supabase
      .from('review_forms')
      .select('id, title, is_published, created_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (formsError) {
      console.error('Error querying review forms:', formsError);
      return;
    }
    
    console.log(`Found ${formsData?.length || 0} review form(s):`);
    formsData?.forEach((form, index) => {
      console.log(`   Form ${index + 1}: ID ${form.id}, Title: "${form.title}", Published: ${form.is_published}`);
    });
  } catch (error) {
    console.error('Error checking review forms:', error);
  }
}

// Run the checks
checkLotteryData().then(() => {
  return checkReviewForms();
}).then(() => {
  console.log('\n✅ Database check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});