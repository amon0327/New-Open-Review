const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLINEIntegration() {
    console.log('=== LINE Integration Debug Report ===');
    console.log('Date:', new Date().toISOString());
    console.log('');

    // 1. Check environment configuration
    console.log('1. Environment Configuration:');
    console.log('   - Supabase URL:', supabaseUrl);
    console.log('   - Environment:', process.env.REACT_APP_ENV || 'development');
    console.log('   - LIFF ID (Dev):', process.env.REACT_APP_LIFF_ID_DEV);
    console.log('   - LIFF ID (Review):', process.env.REACT_APP_LIFF_ID_REVIEW);
    console.log('   - LIFF ID (Prod):', process.env.REACT_APP_LIFF_ID_PROD);
    console.log('');

    // 2. Test Edge Functions
    console.log('2. Testing Edge Functions:');

    // Test test-line function
    console.log('   a. Testing test-line function...');
    try {
        const testResponse = await fetch(`${supabaseUrl}/functions/v1/test-line`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({ test: 'data', lineUserId: 'test123' })
        });
        
        if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log('      ✓ test-line function is working');
            console.log('      Response:', JSON.stringify(testData, null, 2));
        } else {
            console.log('      ✗ test-line function failed with status:', testResponse.status);
            const errorText = await testResponse.text();
            console.log('      Error:', errorText);
        }
    } catch (error) {
        console.log('      ✗ test-line function error:', error.message);
    }
    console.log('');

    // Test line-register function
    console.log('   b. Testing line-register function...');
    const testProfile = {
        userId: 'U' + Math.random().toString(36).substring(2, 15),
        displayName: 'Test User',
        pictureUrl: 'https://example.com/picture.jpg',
        statusMessage: 'Test status'
    };
    
    try {
        const registerResponse = await fetch(`${supabaseUrl}/functions/v1/line-register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({ lineProfile: testProfile })
        });
        
        if (registerResponse.ok) {
            const registerData = await registerResponse.json();
            console.log('      ✓ line-register function is working');
            console.log('      Created/Found user:', registerData.user?.email);
            console.log('      Is new user:', registerData.isNewUser);
            
            // Clean up test user if created
            if (registerData.isNewUser && registerData.user?.id) {
                const { error } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', registerData.user.id);
                    
                if (!error) {
                    console.log('      ✓ Cleaned up test user');
                }
            }
        } else {
            console.log('      ✗ line-register function failed with status:', registerResponse.status);
            const errorText = await registerResponse.text();
            console.log('      Error:', errorText);
        }
    } catch (error) {
        console.log('      ✗ line-register function error:', error.message);
    }
    console.log('');

    // 3. Check database tables
    console.log('3. Database Tables Check:');
    
    // Check users table
    console.log('   a. Checking users table...');
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, name, created_at')
            .like('email', '%@line.local')
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (error) {
            console.log('      ✗ Error querying users table:', error.message);
        } else {
            console.log(`      ✓ Found ${users.length} LINE users (showing last 5):`);
            users.forEach(user => {
                console.log(`        - ${user.email} (${user.name}) created at ${user.created_at}`);
            });
        }
    } catch (error) {
        console.log('      ✗ Failed to query users table:', error.message);
    }
    console.log('');

    // Check auth users
    console.log('   b. Checking auth configuration...');
    try {
        const { data: authConfig, error } = await supabase.auth.getSession();
        console.log('      ✓ Auth is accessible');
        console.log('      Current session:', authConfig.session ? 'Active' : 'None');
    } catch (error) {
        console.log('      ✗ Auth check error:', error.message);
    }
    console.log('');

    // 4. Check store-redirect function with a test store code
    console.log('4. Testing store-redirect function:');
    const testStoreCodes = ['1fc07097', 'test-store', 'invalid-code'];
    
    for (const storeCode of testStoreCodes) {
        console.log(`   Testing store code: ${storeCode}`);
        try {
            const response = await fetch(`${supabaseUrl}/functions/v1/store-redirect?code=${storeCode}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${supabaseAnonKey}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`      ✓ Response:`, JSON.stringify(data, null, 2));
            } else {
                console.log(`      ✗ Failed with status: ${response.status}`);
                const errorText = await response.text();
                console.log(`      Error:`, errorText);
            }
        } catch (error) {
            console.log(`      ✗ Error:`, error.message);
        }
        console.log('');
    }

    // 5. Summary and recommendations
    console.log('5. Summary & Recommendations:');
    console.log('   - Check if LIFF IDs match your LINE Login Channel settings');
    console.log('   - Ensure the LINE Login Channel is properly configured');
    console.log('   - Verify the LIFF endpoint URL points to the correct domain');
    console.log('   - Check if edge functions are deployed and accessible');
    console.log('   - Review browser console logs when accessing through LINE');
    console.log('');
    
    console.log('=== End of Debug Report ===');
}

checkLINEIntegration().catch(console.error);