console.log('=== LIFF URL Configuration Debug ===');
console.log('');

// LIFF IDs
const liffIds = {
    development: '2008812853-cYd3wiPJ',
    review: '2008812854-Q2qSHLPI',
    production: '2008812855-Ig8w1gkY'
};

console.log('1. LIFF URLs for each environment:');
console.log('');

Object.entries(liffIds).forEach(([env, liffId]) => {
    console.log(`   ${env.toUpperCase()}:`);
    console.log(`   - LIFF ID: ${liffId}`);
    console.log(`   - Base LIFF URL: https://liff.line.me/${liffId}`);
    console.log('');
    console.log('   Example URLs:');
    console.log(`   - With store code: https://liff.line.me/${liffId}?storeCode=1fc07097`);
    console.log(`   - With path: https://liff.line.me/${liffId}/liff/1fc07097`);
    console.log(`   - Direct form: https://liff.line.me/${liffId}?reviewFormId=0605e6b1-e0fb-4fae-9db0-f31239e16f31`);
    console.log('');
});

console.log('2. Current deployment info:');
console.log('   - The app is deployed on Firebase Hosting');
console.log('   - Check if the LIFF endpoint URL is set correctly in LINE Developers Console');
console.log('   - The endpoint URL should be the Firebase hosting URL');
console.log('');

console.log('3. Important LIFF settings to verify in LINE Developers Console:');
console.log('   a. LIFF endpoint URL - should point to your Firebase hosting URL');
console.log('   b. Scope - make sure "profile" is checked');
console.log('   c. LIFF app type - "Full" or "Tall" recommended');
console.log('   d. Module mode - should be OFF for React apps');
console.log('');

console.log('4. Common issues and solutions:');
console.log('   a. Users table not being written:');
console.log('      - Edge function is working correctly');
console.log('      - Issue might be that LIFF is not initializing properly in LINE app');
console.log('      - Check browser console logs when accessing through LINE');
console.log('');
console.log('   b. LIFF not initializing:');
console.log('      - Make sure the domain is added to allowlist in LINE Developers Console');
console.log('      - Check if LIFF SDK is loaded before initialization');
console.log('      - Verify LIFF ID matches the environment');
console.log('');
console.log('   c. Profile not accessible:');
console.log('      - User might not be logged in to LINE');
console.log('      - Scope permissions might not include profile');
console.log('      - LIFF initialization might have failed');
console.log('');

console.log('5. Testing URLs (use these in LINE app):');
console.log('   Development:');
console.log('   - https://liff.line.me/2008812853-cYd3wiPJ/liff/1fc07097');
console.log('   - https://liff.line.me/2008812853-cYd3wiPJ?storeCode=1fc07097');
console.log('');

console.log('6. Next steps:');
console.log('   1. Access the LIFF URL through LINE app');
console.log('   2. Open developer tools (if possible) or use alert() for debugging');
console.log('   3. Check if LIFF initializes successfully');
console.log('   4. Verify if LINE profile is accessible');
console.log('   5. Monitor edge function logs in Supabase dashboard');
console.log('');

console.log('=== End of LIFF URL Debug ===');