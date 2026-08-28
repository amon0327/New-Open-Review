/**
 * フォーム作成フローのテストスクリプト
 * ブラウザのコンソールで実行して問題を特定
 */

// Supabaseクライアントが正しく初期化されているかテスト
async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    const { data: session, error: sessionError } = await window.supabase.auth.getSession();
    console.log('✅ Session check result:', { session: !!session, error: sessionError });
    
    if (session) {
      console.log('✅ User authenticated:', session.user.id);
      return session.user;
    } else {
      console.log('❌ User not authenticated');
      return null;
    }
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return null;
  }
}

// Edge Function呼び出しテスト
async function testEdgeFunctionCall() {
  console.log('🔍 Testing Edge Function call...');
  
  try {
    const { data, error } = await window.supabase.functions.invoke('create-review-form', {
      body: {
        title: 'テストフォーム'
      }
    });
    
    console.log('📊 Edge Function response:', { data, error });
    
    if (error) {
      console.error('❌ Edge Function error:', error);
      return false;
    }
    
    if (data && data.success) {
      console.log('✅ Edge Function success:', data);
      return true;
    } else {
      console.log('❌ Edge Function returned failure:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Edge Function call error:', error);
    return false;
  }
}

// FormDataServiceのcreateNewFormテスト
async function testFormDataService() {
  console.log('🔍 Testing FormDataService.createNewForm...');
  
  try {
    const user = await testSupabaseConnection();
    if (!user) {
      console.log('❌ Cannot test FormDataService without authenticated user');
      return false;
    }
    
    // FormDataService.createNewFormを呼び出す
    const result = await window.FormDataService.createNewForm(user.id);
    console.log('📊 FormDataService result:', result);
    
    if (result.success) {
      console.log('✅ FormDataService success:', result.data);
      return true;
    } else {
      console.log('❌ FormDataService failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ FormDataService error:', error);
    return false;
  }
}

// すべてのテストを実行
async function runAllTests() {
  console.log('🚀 Starting form creation flow tests...');
  console.log('========================================');
  
  console.log('\n1. Testing Supabase connection...');
  const user = await testSupabaseConnection();
  
  console.log('\n2. Testing Edge Function call...');
  const edgeFunctionWorking = await testEdgeFunctionCall();
  
  console.log('\n3. Testing FormDataService...');
  const formDataServiceWorking = await testFormDataService();
  
  console.log('\n========================================');
  console.log('🎯 Test Results Summary:');
  console.log('- User authenticated:', !!user);
  console.log('- Edge Function working:', edgeFunctionWorking);
  console.log('- FormDataService working:', formDataServiceWorking);
  
  if (user && edgeFunctionWorking && formDataServiceWorking) {
    console.log('✅ All tests passed - form creation should work');
  } else {
    console.log('❌ Some tests failed - check the issues above');
  }
}

// ブラウザのコンソールで実行するための関数をグローバルに公開
window.testFormCreation = {
  runAllTests,
  testSupabaseConnection,
  testEdgeFunctionCall,
  testFormDataService
};

console.log('🔧 Test functions loaded. Run: testFormCreation.runAllTests()');