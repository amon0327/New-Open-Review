// Debug script to check if question_display_settings tables exist
// Run this in browser console after loading the app

const checkQuestionDisplayTables = async () => {
  console.log('=== Checking Question Display Tables ===');
  
  try {
    // Check if question_display_settings table exists
    console.log('1. Testing question_display_settings table...');
    const { data: displaySettings, error: displayError } = await supabase
      .from('question_display_settings')
      .select('*')
      .limit(1);
    
    if (displayError) {
      console.error('❌ question_display_settings table error:', displayError);
      console.log('Error code:', displayError.code);
      console.log('Error message:', displayError.message);
      
      if (displayError.code === '42P01') {
        console.log('💡 Table does not exist - needs to be created');
      }
    } else {
      console.log('✅ question_display_settings table exists');
      console.log('Records found:', displaySettings?.length || 0);
    }
    
    // Check if question_display_rule_settings table exists
    console.log('\n2. Testing question_display_rule_settings table...');
    const { data: ruleSettings, error: ruleError } = await supabase
      .from('question_display_rule_settings')
      .select('*')
      .limit(1);
    
    if (ruleError) {
      console.error('❌ question_display_rule_settings table error:', ruleError);
      console.log('Error code:', ruleError.code);
      console.log('Error message:', ruleError.message);
      
      if (ruleError.code === '42P01') {
        console.log('💡 Table does not exist - needs to be created');
      }
    } else {
      console.log('✅ question_display_rule_settings table exists');
      console.log('Records found:', ruleSettings?.length || 0);
    }
    
    // Check existing tables to see what's available
    console.log('\n3. Checking what tables actually exist...');
    
    // Test some known tables
    const knownTables = [
      'review_questions',
      'question_types',
      'question_option_choices',
      'review_forms',
      'question_screen_settings',
      'login_screen_settings',
      'completion_screen_settings'
    ];
    
    for (const tableName of knownTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: ${data?.length || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
};

// Execute the check
checkQuestionDisplayTables();