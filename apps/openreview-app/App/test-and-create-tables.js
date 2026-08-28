// Test database connection and create missing tables if needed
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://otfreskkeaenahqziriz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZnJlc2trZWFlbmFocXppcml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDc5NTQsImV4cCI6MjA2NjMyMzk1NH0.hfctiBBsg56bfHKE2nKaWLcMz-Gn1P6qlCgZk0-xkO8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAndCreateTables() {
  console.log('=== Testing Database Connection and Tables ===');
  
  try {
    // Test 1: Check if question_display_settings table exists
    console.log('\n1. Testing question_display_settings table...');
    const { data: displaySettings, error: displayError } = await supabase
      .from('question_display_settings')
      .select('*')
      .limit(1);
    
    if (displayError) {
      console.error('❌ question_display_settings table error:', displayError.message);
      
      if (displayError.code === '42P01') {
        console.log('💡 Table does not exist - needs to be created manually in Supabase Dashboard');
        console.log('Create table SQL:');
        console.log(`
CREATE TABLE public.question_display_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    review_question_id UUID REFERENCES public.review_questions(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);
        `);
      }
    } else {
      console.log('✅ question_display_settings table exists');
      console.log('Records found:', displaySettings?.length || 0);
    }
    
    // Test 2: Check if question_display_rule_settings table exists
    console.log('\n2. Testing question_display_rule_settings table...');
    const { data: ruleSettings, error: ruleError } = await supabase
      .from('question_display_rule_settings')
      .select('*')
      .limit(1);
    
    if (ruleError) {
      console.error('❌ question_display_rule_settings table error:', ruleError.message);
      
      if (ruleError.code === '42P01') {
        console.log('💡 Table does not exist - needs to be created manually in Supabase Dashboard');
        console.log('Create table SQL:');
        console.log(`
CREATE TABLE public.question_display_rule_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    question_display_settings_id UUID REFERENCES public.question_display_settings(id) ON DELETE CASCADE,
    nps_segments TEXT,
    question_option_choices_id UUID REFERENCES public.question_option_choices(id) ON DELETE SET NULL
);
        `);
      }
    } else {
      console.log('✅ question_display_rule_settings table exists');
      console.log('Records found:', ruleSettings?.length || 0);
    }
    
    // Test 3: Check existing related tables
    console.log('\n3. Testing related tables...');
    
    const relatedTables = [
      'review_questions',
      'question_types', 
      'question_option_choices',
      'review_forms'
    ];
    
    for (const tableName of relatedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: Available (${data?.length || 0} sample records)`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
    // Test 4: Try to fetch review forms to see if data exists
    console.log('\n4. Testing review forms data...');
    const { data: forms, error: formsError } = await supabase
      .from('review_forms')
      .select('id, title, created_at')
      .limit(5);
    
    if (formsError) {
      console.error('❌ Could not fetch review forms:', formsError.message);
    } else {
      console.log(`✅ Found ${forms?.length || 0} review forms:`);
      forms?.forEach(form => {
        console.log(`  - ${form.title} (ID: ${form.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  
  console.log('\n=== Test Complete ===');
  console.log('If any tables are missing, please create them in your Supabase Dashboard using the SQL provided above.');
}

// Run the test
testAndCreateTables();