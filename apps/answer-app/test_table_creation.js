const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://otfreskkeaenahqziriz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZnJlc2trZWFlbmFocXppcml6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc0Nzk1NCwiZXhwIjoyMDY2MzIzOTU0fQ.IMskAi-s81h8l3CDo72guYqEyY2lDUvl4RTAohaItjo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTableCreation() {
  try {
    // テスト用のテーブル作成SQLを実行
    const { data, error } = await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS required_questions_test (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          page_number INT NOT NULL,
          question_number INT NOT NULL,
          question_text TEXT NOT NULL,
          question_type INT NOT NULL,
          is_required BOOLEAN DEFAULT true,
          options JSONB,
          validation_rules JSONB
        );
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      
      // RPCが存在しない場合は、別の方法を試す
      console.log('Trying alternative method...');
      
      // Supabaseの管理APIを使用してテーブル情報を取得
      const { data: tables, error: listError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5);
        
      if (listError) {
        console.error('Error listing tables:', listError);
      } else {
        console.log('Existing tables (sample):', tables);
      }
    } else {
      console.log('Table created successfully:', data);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testTableCreation();