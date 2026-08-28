# LIFF Configuration Guide for AnswerApp

## Firebase Hosting URLs
Based on the Firebase project ID `reviewform-openreview`, your hosting URLs are:
- Primary: `https://reviewform-openreview.web.app`
- Alternative: `https://reviewform-openreview.firebaseapp.com`

## LINE Developers Console Configuration

### For Each LIFF App (Development, Review, Production)

1. **LIFF Endpoint URL**
   - Set to: `https://reviewform-openreview.web.app`
   - This MUST match exactly with your Firebase hosting URL

2. **Scopes**
   - ✅ profile (REQUIRED)
   - ✅ openid (recommended)

3. **LIFF App Settings**
   - Size: Full or Tall
   - Module Mode: OFF (important for React apps)

4. **Domain Allowlist** (if using external resources)
   - Add: `reviewform-openreview.web.app`
   - Add: `otfreskkeaenahqziriz.supabase.co` (for API calls)

## Test URLs

### Development Environment (LIFF ID: 2008812853-cYd3wiPJ)
```
# Store-based access
https://liff.line.me/2008812853-cYd3wiPJ?storeCode=1fc07097
https://liff.line.me/2008812853-cYd3wiPJ/liff/1fc07097

# Direct form access
https://liff.line.me/2008812853-cYd3wiPJ?reviewFormId=0605e6b1-e0fb-4fae-9db0-f31239e16f31
```

### Review Environment (LIFF ID: 2008812854-Q2qSHLPI)
```
# Store-based access
https://liff.line.me/2008812854-Q2qSHLPI?storeCode=1fc07097

# Direct form access
https://liff.line.me/2008812854-Q2qSHLPI?reviewFormId=0605e6b1-e0fb-4fae-9db0-f31239e16f31
```

### Production Environment (LIFF ID: 2008812855-Ig8w1gkY)
```
# Store-based access
https://liff.line.me/2008812855-Ig8w1gkY?storeCode=1fc07097

# Direct form access
https://liff.line.me/2008812855-Ig8w1gkY?reviewFormId=0605e6b1-e0fb-4fae-9db0-f31239e16f31
```

## Verification Steps

1. **Check LIFF Settings**
   - Go to: https://developers.line.biz/console/
   - Select your channel
   - Go to LIFF tab
   - Verify each LIFF app has correct endpoint URL

2. **Test in LINE App**
   - Open LINE app
   - Access one of the test URLs above
   - Check for any error messages

3. **Debug Information**
   The app will log debug information including:
   - LIFF initialization status
   - Profile retrieval status
   - Edge function calls
   - Any errors

4. **Monitor Supabase Logs**
   - Go to: https://app.supabase.com/project/otfreskkeaenahqziriz/functions
   - Check logs for `line-register` function
   - Look for any error messages

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| LIFF not initializing | Check endpoint URL matches exactly |
| Profile not accessible | Ensure "profile" scope is enabled |
| 403 Forbidden error | Add domains to allowlist |
| Users not created | Check edge function logs |
| Blank screen | Check browser console for errors |

## Deployment Commands

```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Check deployment status
firebase hosting:sites:list
```

## Support Information

- Firebase Project: `reviewform-openreview`
- Supabase Project: `otfreskkeaenahqziriz`
- Edge Functions: `test-line`, `line-register`, `store-redirect`
- Database: Users are stored with `@line.local` email format

## Next Steps

1. Verify LIFF endpoint URL in LINE Developers Console
2. Test with the URLs provided above
3. Check debug logs in the app
4. Monitor Supabase edge function logs
5. If issues persist, check Firebase hosting accessibility