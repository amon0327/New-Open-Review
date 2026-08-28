const https = require('https');

const supabaseUrl = 'otfreskkeaenahqziriz.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZnJlc2trZWFlbmFocXppcml6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc0Nzk1NCwiZXhwIjoyMDY2MzIzOTU0fQ.IMskAi-s81h8l3CDo72guYqEyY2lDUvl4RTAohaItjo';

const sqlQuery = `
-- 必須質問を管理するテーブルを作成
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

const postData = JSON.stringify({
  query: sqlQuery
});

const options = {
  hostname: supabaseUrl,
  port: 443,
  path: '/rest/v1/rpc/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Prefer': 'return=representation'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(postData);
req.end();