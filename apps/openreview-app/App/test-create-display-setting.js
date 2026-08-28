// Test creating display settings with temporary RLS bypass
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://otfreskkeaenahqziriz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZnJlc2trZWFlbmFocXppcml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDc5NTQsImV4cCI6MjA2NjMyMzk1NH0.hfctiBBsg56bfHKE2nKaWLcMz-Gn1P6qlCgZk0-xkO8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestDisplaySettings() {
  console.log('=== Creating Test Display Settings ===');
  
  try {
    // Step 1: Get some questions to work with
    console.log('\n1. Getting available questions...');
    const { data: questions, error: questionsError } = await supabase
      .from('review_questions')
      .select('id, question_text, question_types_id')
      .limit(5);

    if (questionsError) {
      console.error('❌ Error getting questions:', questionsError);
      return;
    }

    console.log(`✅ Found ${questions?.length || 0} questions to test with`);

    // Step 2: Try to disable RLS temporarily and create settings
    for (let i = 0; i < Math.min(3, questions.length); i++) {
      const question = questions[i];
      console.log(`\n2.${i+1} Trying to create display setting for: "${question.question_text}"...`);
      
      // Check if setting already exists
      const { data: existing } = await supabase
        .from('question_display_settings')
        .select('id')
        .eq('review_question_id', question.id)
        .single();

      if (existing) {
        console.log('⚠️  Display setting already exists, skipping...');
        continue;
      }

      // Try to create the display setting
      const { data: newSetting, error: createError } = await supabase
        .from('question_display_settings')
        .insert({
          review_question_id: question.id,
          display_name: `アプリ表示: ${question.question_text.substring(0, 30)}${question.question_text.length > 30 ? '...' : ''}`
        })
        .select()
        .single();

      if (createError) {
        console.error(`❌ Error creating display setting:`, createError.message);
        
        // If RLS is the issue, let's try a raw SQL approach
        if (createError.code === '42501') {
          console.log('💡 RLS is blocking. Need to fix policies in Supabase Dashboard.');
          console.log('Run this SQL in Supabase SQL Editor:');
          console.log(`
-- Temporarily disable RLS for testing
ALTER TABLE public.question_display_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_display_rule_settings DISABLE ROW LEVEL SECURITY;

-- Insert test data
INSERT INTO public.question_display_settings (review_question_id, display_name) 
VALUES ('${question.id}', 'アプリ表示: ${question.question_text.substring(0, 30)}${question.question_text.length > 30 ? '...' : ''}');

-- Re-enable RLS with proper policies
ALTER TABLE public.question_display_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_display_rule_settings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for development
CREATE POLICY "dev_question_display_settings_policy" ON public.question_display_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_question_display_rule_settings_policy" ON public.question_display_rule_settings FOR ALL USING (true) WITH CHECK (true);
          `);
          break;
        }
      } else {
        console.log(`✅ Successfully created display setting: "${newSetting.display_name}"`);
      }
    }

    // Step 3: Test reading display settings
    console.log('\n3. Testing display settings retrieval...');
    const { data: displaySettings, error: readError } = await supabase
      .from('question_display_settings')
      .select(`
        id,
        display_name,
        created_at,
        review_questions (
          id,
          question_text,
          question_types_id,
          question_types!review_questions_question_types_id_fkey (
            id,
            name,
            japanese
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (readError) {
      console.error('❌ Error reading display settings:', readError);
    } else {
      console.log(`✅ Successfully read ${displaySettings?.length || 0} display settings:`);
      displaySettings?.forEach(setting => {
        console.log(`  - "${setting.display_name}" for question: "${setting.review_questions?.question_text || 'N/A'}"`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
createTestDisplaySettings();