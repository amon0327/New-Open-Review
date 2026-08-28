// Database structure investigation script
// Run this in the browser console to understand the review_questions table structure

const investigateReviewQuestionsStructure = {
  
  // 1. Test basic table access and get actual column names
  async getTableStructure() {
    console.log('🔍 === Investigating review_questions table structure ===');
    
    try {
      // Get sample data to see actual column names
      const { data: sampleData, error: sampleError } = await supabase
        .from('review_questions')
        .select('*')
        .limit(3);
      
      if (sampleError) {
        console.error('❌ review_questions access error:', sampleError.message);
        return null;
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log('✅ review_questions table accessed successfully');
        console.log('📋 Available columns:', Object.keys(sampleData[0]));
        console.log('📋 Sample data:');
        sampleData.forEach((item, index) => {
          console.log(`  Record ${index + 1}:`, item);
        });
        
        // Look for question type related fields
        const firstRecord = sampleData[0];
        const possibleTypeFields = [
          'question_type', 'question_types_id', 'type_id', 'question_type_id', 
          'type', 'category_id', 'category', 'kind', 'kind_id'
        ];
        
        const foundTypeFields = possibleTypeFields.filter(field => 
          firstRecord.hasOwnProperty(field)
        );
        
        console.log('🎯 Possible question type fields found:', foundTypeFields);
        
        // Check for question text field
        const possibleTextFields = [
          'question_text', 'text', 'title', 'content', 'question_content',
          'question_title', 'question', 'description'
        ];
        
        const foundTextFields = possibleTextFields.filter(field => 
          firstRecord.hasOwnProperty(field)
        );
        
        console.log('📝 Possible question text fields found:', foundTextFields);
        
        return {
          allColumns: Object.keys(firstRecord),
          typeFields: foundTypeFields,
          textFields: foundTextFields,
          sampleData
        };
      }
      
    } catch (error) {
      console.error('❌ Error investigating table structure:', error);
      return null;
    }
  },

  // 2. Test question_display_settings structure
  async getDisplaySettingsStructure() {
    console.log('🔍 === Investigating question_display_settings table ===');
    
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('question_display_settings')
        .select('*')
        .limit(5);
      
      if (settingsError) {
        console.error('❌ question_display_settings access error:', settingsError.message);
        return null;
      }
      
      if (settingsData && settingsData.length > 0) {
        console.log('✅ question_display_settings accessed successfully');
        console.log('📋 Available columns:', Object.keys(settingsData[0]));
        console.log('📋 Sample data:');
        settingsData.forEach((item, index) => {
          console.log(`  Setting ${index + 1}:`, item);
        });
        
        return {
          columns: Object.keys(settingsData[0]),
          sampleData: settingsData
        };
      }
      
    } catch (error) {
      console.error('❌ Error investigating question_display_settings:', error);
      return null;
    }
  },

  // 3. Test JOIN between tables to find correct relationships
  async testTableJoins() {
    console.log('🔍 === Testing table relationships ===');
    
    try {
      // Try to join question_display_settings with review_questions
      const { data: joinData, error: joinError } = await supabase
        .from('question_display_settings')
        .select(`
          review_question_id,
          display_name,
          review_questions (*)
        `)
        .limit(3);
      
      if (joinError) {
        console.log('⚠️ JOIN failed, trying alternative approach:', joinError.message);
        return await this.testManualJoin();
      }
      
      if (joinData && joinData.length > 0) {
        console.log('✅ JOIN successful');
        console.log('📋 Joined data structure:');
        joinData.forEach((item, index) => {
          console.log(`  Join ${index + 1}:`, item);
          if (item.review_questions) {
            console.log('    review_questions data:', item.review_questions);
          }
        });
        
        return joinData;
      }
      
    } catch (error) {
      console.error('❌ Error testing table joins:', error);
      return await this.testManualJoin();
    }
  },

  // 4. Manual join approach
  async testManualJoin() {
    console.log('🔍 === Testing manual JOIN approach ===');
    
    try {
      // Get question IDs from display settings
      const { data: settings, error: settingsError } = await supabase
        .from('question_display_settings')
        .select('review_question_id')
        .limit(5);
      
      if (settingsError || !settings || settings.length === 0) {
        console.log('❌ Could not get question IDs from display settings');
        return null;
      }
      
      const questionIds = settings.map(s => s.review_question_id).filter(Boolean);
      console.log('📋 Question IDs from display settings:', questionIds);
      
      // Get corresponding questions
      const { data: questions, error: questionsError } = await supabase
        .from('review_questions')
        .select('*')
        .in('id', questionIds);
      
      if (questionsError) {
        console.error('❌ Error getting questions:', questionsError.message);
        return null;
      }
      
      console.log('✅ Manual join successful');
      console.log('📋 Related questions:', questions);
      
      return { settings, questions };
      
    } catch (error) {
      console.error('❌ Error in manual join:', error);
      return null;
    }
  },

  // 5. Look for question types with different possible field names
  async findQuestionTypes() {
    console.log('🔍 === Looking for question types and categories ===');
    
    // First get table structure
    const structure = await this.getTableStructure();
    if (!structure) return null;
    
    const { typeFields } = structure;
    
    for (const field of typeFields) {
      try {
        console.log(`📋 Checking ${field} field for different values...`);
        
        const { data: typeData, error: typeError } = await supabase
          .from('review_questions')
          .select(`id, ${field}`)
          .not(field, 'is', null)
          .limit(20);
        
        if (!typeError && typeData && typeData.length > 0) {
          const uniqueValues = [...new Set(typeData.map(item => item[field]))];
          console.log(`  ✅ ${field} unique values:`, uniqueValues);
          
          // Check if values 1 and 2 exist (for comment questions)
          const hasCommentTypes = uniqueValues.some(val => [1, 2].includes(val));
          if (hasCommentTypes) {
            console.log(`  🎯 ${field} contains comment types (1,2)!`);
          }
          
          // Check if value 9 exists (for NPS questions)
          const hasNPSType = uniqueValues.includes(9);
          if (hasNPSType) {
            console.log(`  🎯 ${field} contains NPS type (9)!`);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error checking ${field}:`, error.message);
      }
    }
  },

  // 6. Check review_question_answers structure
  async getAnswersStructure() {
    console.log('🔍 === Investigating review_question_answers table ===');
    
    try {
      const { data: answersData, error: answersError } = await supabase
        .from('review_question_answers')
        .select('*')
        .limit(3);
      
      if (answersError) {
        console.error('❌ review_question_answers access error:', answersError.message);
        return null;
      }
      
      if (answersData && answersData.length > 0) {
        console.log('✅ review_question_answers accessed successfully');
        console.log('📋 Available columns:', Object.keys(answersData[0]));
        console.log('📋 Sample data:');
        answersData.forEach((item, index) => {
          console.log(`  Answer ${index + 1}:`, item);
        });
        
        return {
          columns: Object.keys(answersData[0]),
          sampleData: answersData
        };
      }
      
    } catch (error) {
      console.error('❌ Error investigating review_question_answers:', error);
      return null;
    }
  },

  // 7. Run comprehensive investigation
  async runFullInvestigation() {
    console.log('🚀 === FULL DATABASE STRUCTURE INVESTIGATION ===\n');
    
    const results = {};
    
    // Test all tables
    results.questionsStructure = await this.getTableStructure();
    results.displaySettingsStructure = await this.getDisplaySettingsStructure();
    results.answersStructure = await this.getAnswersStructure();
    results.joinResults = await this.testTableJoins();
    
    console.log('\n🔍 === ANALYZING QUESTION TYPES ===');
    await this.findQuestionTypes();
    
    console.log('\n📋 === INVESTIGATION SUMMARY ===');
    
    if (results.questionsStructure) {
      console.log('✅ review_questions table accessed');
      console.log('   Columns:', results.questionsStructure.allColumns.join(', '));
      console.log('   Possible type fields:', results.questionsStructure.typeFields.join(', '));
      console.log('   Possible text fields:', results.questionsStructure.textFields.join(', '));
    }
    
    if (results.displaySettingsStructure) {
      console.log('✅ question_display_settings table accessed');
      console.log('   Columns:', results.displaySettingsStructure.columns.join(', '));
    }
    
    if (results.answersStructure) {
      console.log('✅ review_question_answers table accessed');
      console.log('   Columns:', results.answersStructure.columns.join(', '));
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (results.questionsStructure?.typeFields.length > 0) {
      console.log(`   Use one of these fields for question type: ${results.questionsStructure.typeFields.join(', ')}`);
    }
    if (results.questionsStructure?.textFields.length > 0) {
      console.log(`   Use one of these fields for question text: ${results.questionsStructure.textFields.join(', ')}`);
    }
    
    return results;
  }
};

// Auto-run the investigation
console.log('🚀 Database structure investigation tool loaded');
console.log('💡 Usage:');
console.log('  investigateReviewQuestionsStructure.runFullInvestigation() - Run complete investigation');
console.log('  investigateReviewQuestionsStructure.getTableStructure() - Check review_questions structure');
console.log('  investigateReviewQuestionsStructure.findQuestionTypes() - Find question type fields');

// Run quick check
console.log('\n⚡ Running quick structure check...');
investigateReviewQuestionsStructure.runFullInvestigation();