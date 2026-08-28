// Database structure investigation script
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Starting comprehensive database investigation...');

async function investigateDatabase() {
  try {
    // Get current user to ensure we're authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Current user:', user?.id || 'Not logged in');
    
    if (!user) {
      console.log('❌ Not authenticated - investigation requires authentication');
      return;
    }
    
    console.log('\n📊 === TABLE ACCESS TEST ===');
    
    // Test basic table access
    const tables = [
      'question_answer_option_linear_scale',
      'review_question_answers', 
      'review_questions',
      'question_display_settings',
      'review_form_submissions',
      'review_forms',
      'stores',
      'business_users',
      'store_memberships'
    ];
    
    const tableInfo = {};
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(3);
          
        if (error) {
          console.log(`❌ ${table}: ERROR - ${error.message}`);
          tableInfo[table] = { error: error.message };
        } else {
          console.log(`✅ ${table}: Count=${count}`);
          if (data && data.length > 0) {
            const sampleData = data[0];
            const columns = Object.keys(sampleData);
            console.log(`   Columns: ${columns.join(', ')}`);
            tableInfo[table] = { count, columns, sampleData: data };
          } else {
            console.log(`   No data available`);
            tableInfo[table] = { count: 0, columns: [], sampleData: [] };
          }
        }
      } catch (e) {
        console.log(`❌ ${table}: EXCEPTION - ${e.message}`);
        tableInfo[table] = { exception: e.message };
      }
    }
    
    console.log('\n🔗 === RELATIONSHIP ANALYSIS ===');
    
    // Investigate question_answer_option_linear_scale structure
    if (tableInfo['question_answer_option_linear_scale']?.sampleData?.length > 0) {
      console.log('\n📋 question_answer_option_linear_scale Details:');
      const linearScaleData = tableInfo['question_answer_option_linear_scale'].sampleData;
      linearScaleData.forEach((item, index) => {
        console.log(`  Sample ${index + 1}:`, {
          id: item.id,
          answer_number: item.answer_number,
          review_question_answers_id: item.review_question_answers_id,
          store_id: item.store_id,
          created_at: item.created_at
        });
      });
    }
    
    // Investigate review_question_answers structure
    if (tableInfo['review_question_answers']?.sampleData?.length > 0) {
      console.log('\n📋 review_question_answers Details:');
      const answersData = tableInfo['review_question_answers'].sampleData;
      answersData.forEach((item, index) => {
        console.log(`  Sample ${index + 1}:`, {
          id: item.id,
          review_questions_id: item.review_questions_id,
          store_id: item.store_id,
          created_at: item.created_at,
          otherFields: Object.keys(item).filter(k => !['id', 'review_questions_id', 'store_id', 'created_at'].includes(k))
        });
      });
    }
    
    // Investigate review_questions structure
    if (tableInfo['review_questions']?.sampleData?.length > 0) {
      console.log('\n📋 review_questions Details:');
      const questionsData = tableInfo['review_questions'].sampleData;
      questionsData.forEach((item, index) => {
        console.log(`  Sample ${index + 1}:`, {
          id: item.id,
          question_text: item.question_text || item.text || 'N/A',
          question_type: item.question_type || item.question_types_id || item.type_id || 'N/A',
          allFields: Object.keys(item)
        });
      });
    }
    
    console.log('\n🎯 === NPS DATA FLOW ANALYSIS ===');
    
    // Try to find NPS questions (typically question type 9 or similar)
    if (tableInfo['review_questions']?.sampleData?.length > 0) {
      const questionsData = tableInfo['review_questions'].sampleData;
      const sampleQuestion = questionsData[0];
      const possibleTypeFields = ['question_type', 'question_types_id', 'type_id', 'question_type_id'];
      const typeField = possibleTypeFields.find(field => sampleQuestion.hasOwnProperty(field));
      
      if (typeField) {
        console.log(`📊 Found question type field: ${typeField}`);
        
        try {
          // Look for NPS questions (usually type 9)
          const { data: npsQuestions, error: npsError } = await supabase
            .from('review_questions')
            .select(`id, ${typeField}`)
            .eq(typeField, 9)
            .limit(5);
            
          if (!npsError && npsQuestions) {
            console.log(`🎯 Found ${npsQuestions.length} NPS questions (type 9)`);
            npsQuestions.forEach(q => console.log(`   - Question ID: ${q.id}`));
          } else {
            console.log('🔍 No type 9 questions found, checking other types...');
            
            // Check what question types exist
            const { data: allTypes, error: typesError } = await supabase
              .from('review_questions')
              .select(typeField)
              .limit(20);
              
            if (!typesError && allTypes) {
              const uniqueTypes = [...new Set(allTypes.map(t => t[typeField]))].sort();
              console.log(`📊 Available question types: ${uniqueTypes.join(', ')}`);
            }
          }
        } catch (e) {
          console.log('❌ Error checking NPS questions:', e.message);
        }
      } else {
        console.log('❌ No question type field found in review_questions');
      }
    }
    
    console.log('\n🔍 === QUESTION DISPLAY SETTINGS ANALYSIS ===');
    
    if (tableInfo['question_display_settings']?.sampleData?.length > 0) {
      const displayData = tableInfo['question_display_settings'].sampleData;
      console.log('📋 Question Display Settings:');
      displayData.forEach((item, index) => {
        console.log(`  Setting ${index + 1}:`, {
          review_question_id: item.review_question_id,
          display_name: item.display_name,
          allFields: Object.keys(item)
        });
      });
    }
    
    console.log('\n📈 === LINEAR SCALE DATA ANALYSIS ===');
    
    // Check if we can join linear scale data with question answers
    if (tableInfo['question_answer_option_linear_scale']?.count > 0) {
      try {
        console.log('🔗 Testing JOIN between linear_scale and question_answers...');
        
        const { data: joinedData, error: joinError } = await supabase
          .from('question_answer_option_linear_scale')
          .select(`
            answer_number,
            created_at,
            review_question_answers!inner(
              id,
              review_questions_id,
              created_at
            )
          `)
          .limit(5);
          
        if (!joinError && joinedData) {
          console.log(`✅ Successfully joined ${joinedData.length} records`);
          joinedData.forEach((item, index) => {
            console.log(`  Joined ${index + 1}:`, {
              answer_number: item.answer_number,
              question_id: item.review_question_answers?.review_questions_id,
              date: item.created_at?.split('T')[0]
            });
          });
        } else {
          console.log('❌ JOIN failed:', joinError?.message);
        }
      } catch (e) {
        console.log('❌ JOIN exception:', e.message);
      }
    }
    
    console.log('\n📋 === SUMMARY ===');
    console.log('Available tables:', Object.keys(tableInfo).filter(t => !tableInfo[t].error));
    console.log('Tables with errors:', Object.keys(tableInfo).filter(t => tableInfo[t].error));
    
    // Provide analysis
    const hasLinearScale = tableInfo['question_answer_option_linear_scale']?.count > 0;
    const hasQuestionAnswers = tableInfo['review_question_answers']?.count > 0;
    const hasQuestions = tableInfo['review_questions']?.count > 0;
    
    console.log('\n🎯 NPS Data Flow Assessment:');
    console.log(`  - Linear scale table: ${hasLinearScale ? '✅ Available' : '❌ Missing/Empty'}`);
    console.log(`  - Question answers: ${hasQuestionAnswers ? '✅ Available' : '❌ Missing/Empty'}`);
    console.log(`  - Questions metadata: ${hasQuestions ? '✅ Available' : '❌ Missing/Empty'}`);
    
    if (hasLinearScale && hasQuestionAnswers && hasQuestions) {
      console.log('\n✅ Complete NPS data flow detected!');
      console.log('📊 Recommended query structure:');
      console.log(`
      SELECT 
        qls.answer_number,
        qls.created_at,
        qa.review_questions_id,
        qa.store_id
      FROM question_answer_option_linear_scale qls
      INNER JOIN review_question_answers qa 
        ON qls.review_question_answers_id = qa.id
      INNER JOIN review_questions q 
        ON qa.review_questions_id = q.id
      WHERE q.[question_type_field] = 9  -- NPS questions
        AND qa.store_id = [store_id]
        AND qls.created_at >= [start_date]
        AND qls.created_at < [end_date]
      `);
    } else {
      console.log('\n⚠️ Incomplete NPS data flow - some tables missing or empty');
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  }
}

investigateDatabase().then(() => {
  console.log('\n🏁 Investigation complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Investigation crashed:', error);
  process.exit(1);
});