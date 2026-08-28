# LINE Login Investigation Report for AnswerApp

## Date: 2026-01-04

## Executive Summary
The LINE login functionality in the AnswerApp is properly implemented but users are not being written to the database. After investigation, I found that:

1. **Edge Functions are working correctly** - All LINE-related edge functions (`test-line`, `line-register`, `store-redirect`) are deployed and functional
2. **LIFF implementation is correct** - The LIFF SDK is properly integrated and initialized
3. **The main issue appears to be with LIFF configuration in LINE Developers Console**

## Current Implementation Status

### ✅ Working Components

1. **Edge Functions (Supabase)**
   - `test-line` - Working correctly
   - `line-register` - Creates users successfully when called directly
   - `store-redirect` - Returns correct form IDs for store codes

2. **Frontend LIFF Integration**
   - LIFF SDK is loaded and initialized
   - LIFF IDs are correctly configured for all environments
   - Auto-authentication flow is implemented in `WelcomePage.js`

3. **Database Structure**
   - Users table accepts LINE users with `email@line.local` format
   - Auth system properly configured for LINE users

### ❌ Issues Found

1. **Users not being created in database**
   - The `registerLineUser` function is likely not being called
   - This suggests LIFF initialization or profile retrieval is failing

2. **Possible LIFF Configuration Issues**
   - LIFF endpoint URL might not be correctly set in LINE Developers Console
   - Domain allowlist might be missing the Firebase hosting domain
   - Profile scope might not be enabled

## Key Configuration Details

### LIFF IDs
- Development: `2008812853-cYd3wiPJ`
- Review: `2008812854-Q2qSHLPI`
- Production: `2008812855-Ig8w1gkY`

### Supabase Details
- URL: `https://otfreskkeaenahqziriz.supabase.co`
- Edge Functions are deployed and accessible

### Expected Flow
1. User accesses LIFF URL in LINE app
2. LIFF SDK initializes automatically
3. App retrieves LINE profile
4. App calls `line-register` edge function
5. User is created/updated in database
6. User proceeds to answer questions

## Debugging Steps Taken

1. **Created debug scripts**
   - `check-line-integration.js` - Tests all edge functions
   - `debug-liff-url.js` - Provides LIFF URL examples

2. **Verified edge function deployment**
   - All functions are deployed and active
   - Functions work correctly when called directly

3. **Analyzed code flow**
   - LIFF initialization happens in `App.js`
   - Auto-authentication implemented in `WelcomePage.js`
   - Debug logs are in place to track the flow

## Recommendations

### 1. **Check LINE Developers Console Settings**
   - Verify LIFF endpoint URL points to Firebase hosting URL
   - Ensure "profile" scope is enabled
   - Add Firebase domain to allowlist
   - Set LIFF app type to "Full" or "Tall"
   - Ensure Module mode is OFF

### 2. **Test with Debug Mode**
   Access these URLs in LINE app and check for console logs:
   - `https://liff.line.me/2008812853-cYd3wiPJ?storeCode=1fc07097`
   - `https://liff.line.me/2008812853-cYd3wiPJ?reviewFormId=0605e6b1-e0fb-4fae-9db0-f31239e16f31`

### 3. **Monitor Edge Function Logs**
   - Check Supabase dashboard for edge function invocations
   - Look for `line-register` function calls
   - Review any error messages

### 4. **Add More Debug Output**
   The app already has extensive debug logging in `WelcomePage.js`. These logs will show:
   - LIFF initialization status
   - Profile retrieval attempts
   - Edge function calls
   - Any errors in the process

### 5. **Common LIFF Issues to Check**
   - **Domain mismatch**: LIFF endpoint URL must match exactly
   - **HTTPS required**: Make sure Firebase hosting uses HTTPS
   - **Cookie settings**: Some browsers block third-party cookies
   - **LINE app version**: Ensure users have updated LINE app

## Test URLs for Different Scenarios

### Store Code Based Access
```
https://liff.line.me/2008812853-cYd3wiPJ?storeCode=1fc07097
https://liff.line.me/2008812853-cYd3wiPJ/liff/1fc07097
```

### Direct Form Access
```
https://liff.line.me/2008812853-cYd3wiPJ?reviewFormId=0605e6b1-e0fb-4fae-9db0-f31239e16f31
```

## Next Steps

1. **Access the app through LINE** and check the debug output
2. **Verify LIFF settings** in LINE Developers Console
3. **Check Firebase hosting URL** - it should be the LIFF endpoint URL
4. **Monitor Supabase logs** for edge function invocations
5. **Test with different devices/LINE versions** if issues persist

## Conclusion

The implementation appears to be correct, but the LIFF configuration in LINE Developers Console likely needs adjustment. The edge functions are working, and the code is properly structured. The issue is most likely in the LIFF initialization phase, preventing the profile retrieval and subsequent user registration.