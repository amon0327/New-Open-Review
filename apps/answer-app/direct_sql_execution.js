const { Client } = require('pg');

const client = new Client({
  host: 'db.otfreskkeaenahqziriz.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'e.8x*+nfQP$b8)fuXXR2Cjh/Kt7agLpKs8(5',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTables() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create required_questions table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS required_questions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        
        -- ページ情報
        page_number INT NOT NULL,
        page_title TEXT NOT NULL,
        
        -- 質問情報
        question_number INT NOT NULL,
        question_text TEXT NOT NULL,
        question_type INT NOT NULL,
        is_required BOOLEAN DEFAULT true,
        
        -- オプション情報
        options JSONB,
        
        -- バリデーションルール
        validation_rules JSONB,
        
        -- 表示制御
        is_active BOOLEAN DEFAULT true,
        display_order INT,
        
        -- メタデータ
        metadata JSONB,
        
        UNIQUE(page_number, question_number)
      );
    `;

    await client.query(createTableQuery);
    console.log('Table required_questions created successfully');

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_required_questions_page_number ON required_questions(page_number);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_required_questions_is_active ON required_questions(is_active);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_required_questions_display_order ON required_questions(display_order);');
    console.log('Indexes created successfully');

    // Create required_question_answers table
    const createAnswersTableQuery = `
      CREATE TABLE IF NOT EXISTS required_question_answers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        
        -- リレーション
        review_form_submission_id UUID REFERENCES review_form_submissions(id) ON DELETE CASCADE,
        required_question_id UUID REFERENCES required_questions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        
        -- 回答データ
        text_answer TEXT,
        selected_option INT,
        selected_options INT[],
        
        -- メタデータ
        answered_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(review_form_submission_id, required_question_id)
      );
    `;

    await client.query(createAnswersTableQuery);
    console.log('Table required_question_answers created successfully');

    // Create indexes for answers table
    await client.query('CREATE INDEX IF NOT EXISTS idx_required_question_answers_submission ON required_question_answers(review_form_submission_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_required_question_answers_user ON required_question_answers(user_id);');
    console.log('Answer table indexes created successfully');

    // Enable RLS
    await client.query('ALTER TABLE required_questions ENABLE ROW LEVEL SECURITY;');
    await client.query('ALTER TABLE required_question_answers ENABLE ROW LEVEL SECURITY;');
    console.log('RLS enabled successfully');

    // Create policies
    await client.query(`
      CREATE POLICY "Required questions are viewable by everyone" ON required_questions
      FOR SELECT USING (true);
    `);
    
    await client.query(`
      CREATE POLICY "Users can create their own required question answers" ON required_question_answers
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    `);
    
    await client.query(`
      CREATE POLICY "Users can view their own required question answers" ON required_question_answers
      FOR SELECT USING (auth.uid() = user_id);
    `);
    console.log('Policies created successfully');

    console.log('All tables and configurations created successfully!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

createTables();