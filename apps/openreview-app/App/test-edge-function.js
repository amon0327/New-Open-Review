// Edge Function呼び出しテスト用スクリプト
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otfreskkeaenahqziriz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZnJlc2trZWFlbmFocXppcml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI1MDQ3NjYsImV4cCI6MjAzODA4MDc2Nn0.ib1YjXS4aE8vJmozaOWSwBBkzYJ7dXZCe5lMGa8KGMI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// テスト実行関数
async function testEdgeFunction() {
  console.log('🔧 Testing Edge Function directly...');
  
  try {
    // まず認証状態を確認
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session status:', !!session);
    
    if (!session) {
      console.log('❌ No session found. Please log in first.');
      return;
    }
    
    console.log('✅ Session found, calling Edge Function...');
    
    // Edge Functionを呼び出し
    const { data, error } = await supabase.functions.invoke('create-review-form', {
      body: {
        title: 'テスト用レビューフォーム'
      }
    });
    
    console.log('📊 Edge Function Result:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (error) {
      console.error('❌ Edge Function Error:', error);
    } else if (data) {
      console.log('✅ Edge Function Success:', data);
    }
    
  } catch (err) {
    console.error('❌ Test Error:', err);
  }
}

// ブラウザコンソールで実行可能にする
window.testEdgeFunction = testEdgeFunction;

console.log('🎯 Test script loaded. Run window.testEdgeFunction() in browser console to test.');