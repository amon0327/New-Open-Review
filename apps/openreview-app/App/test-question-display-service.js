// Test QuestionDisplayService functionality
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://otfreskkeaenahqziriz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZnJlc2trZWFlbmFocXppcml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDc5NTQsImV4cCI6MjA2NjMyMzk1NH0.hfctiBBsg56bfHKE2nKaWLcMz-Gn1P6qlCgZk0-xkO8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuestionDisplayService() {
  console.log('=== Testing QuestionDisplayService Functionality ===');
  
  try {
    // Test 1: Get review forms (this should work)
    console.log('\n1. Testing getReviewForms...');
    const { data: forms, error: formsError } = await supabase
      .from('review_forms')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        is_published,
        is_deleted
      `)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (formsError) {
      console.error('❌ Forms error:', formsError);
    } else {
      console.log(`✅ Found ${forms?.length || 0} forms:`);
      forms?.slice(0, 3).forEach(form => {
        console.log(`  - ${form.title} (ID: ${form.id})`);
      });
    }

    // Test 2: Get questions for a form
    if (forms && forms.length > 0) {
      const firstFormId = forms[0].id;
      console.log(`\n2. Testing getQuestionsByFormId for form: ${firstFormId}...`);
      
      const { data: questions, error: questionsError } = await supabase
        .from('review_questions')
        .select(`
          id,
          question_text,
          question_number,
          is_required,
          question_detail_text,
          is_detail_enabled,
          created_at,
          question_types_id,
          question_categories_id,
          question_subcategories_id,
          review_fome_id
        `)
        .eq('review_fome_id', firstFormId)
        .order('question_number', { ascending: true });

      if (questionsError) {
        console.error('❌ Questions error:', questionsError);
      } else {
        console.log(`✅ Found ${questions?.length || 0} questions for this form:`);
        questions?.slice(0, 3).forEach(q => {
          console.log(`  - ${q.question_text} (Type: ${q.question_types_id})`);
        });
      }

      // Test 3: Test the complex query for display settings
      console.log('\n3. Testing getQuestionsWithDisplaySettingsOnly...');
      const { data: displaySettings, error: displayError } = await supabase
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
          ),
          question_display_rule_settings (
            id,
            nps_segments,
            question_option_choices_id,
            question_option_choices (
              id,
              choice_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (displayError) {
        console.error('❌ Display settings error:', displayError);
        console.log('Error details:', displayError);
      } else {
        console.log(`✅ Found ${displaySettings?.length || 0} display settings:`);
        displaySettings?.forEach(setting => {
          console.log(`  - ${setting.display_name} (Question: ${setting.review_questions?.question_text || 'N/A'})`);
        });
      }

      // Test 4: Test adding a display setting
      if (questions && questions.length > 0) {
        const firstQuestion = questions[0];
        console.log(`\n4. Testing createDisplaySetting for question: ${firstQuestion.id}...`);
        
        // First check if it already has a display setting
        const { data: existingSetting, error: existingError } = await supabase
          .from('question_display_settings')
          .select('*')
          .eq('review_question_id', firstQuestion.id)
          .single();

        if (existingError && existingError.code !== 'PGRST116') {
          console.error('❌ Error checking existing setting:', existingError);
        } else if (existingSetting) {
          console.log('⚠️  Display setting already exists for this question');
        } else {
          // Create a new display setting
          const { data: newSetting, error: createError } = await supabase
            .from('question_display_settings')
            .insert([
              {
                review_question_id: firstQuestion.id,
                display_name: `Test Display Setting - ${firstQuestion.question_text.substring(0, 20)}...`
              }
            ])
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating display setting:', createError);
          } else {
            console.log('✅ Successfully created display setting:', newSetting.display_name);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testQuestionDisplayService();