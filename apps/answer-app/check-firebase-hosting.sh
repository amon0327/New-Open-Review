#!/bin/bash

echo "=== Firebase Hosting Information ==="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null
then
    echo "Firebase CLI is not installed. Please install it with: npm install -g firebase-tools"
    exit 1
fi

echo "1. Firebase Project Info:"
firebase projects:list 2>/dev/null | grep -E "(Project|answer-app)" || echo "   Unable to list projects. Please run 'firebase login' first."
echo ""

echo "2. Current Firebase Configuration:"
if [ -f ".firebaserc" ]; then
    echo "   .firebaserc content:"
    cat .firebaserc | sed 's/^/   /'
else
    echo "   .firebaserc not found"
fi
echo ""

echo "3. Hosting Configuration:"
echo "   From firebase.json:"
cat firebase.json | jq '.hosting' 2>/dev/null || cat firebase.json | grep -A 10 "hosting" | sed 's/^/   /'
echo ""

echo "4. Recent Deployment:"
if [ -f ".firebase/hosting.YnVpbGQ.cache" ]; then
    echo "   Last deployment time:"
    stat -f "   %Sm" -t "%Y-%m-%d %H:%M:%S" .firebase/hosting.YnVpbGQ.cache 2>/dev/null || \
    stat -c "   %y" .firebase/hosting.YnVpbGQ.cache 2>/dev/null | cut -d' ' -f1,2 || \
    echo "   Unable to determine last deployment time"
    echo ""
    echo "   Deployed files (first 5):"
    head -5 .firebase/hosting.YnVpbGQ.cache | sed 's/^/   /'
else
    echo "   No deployment cache found"
fi
echo ""

echo "5. To get your Firebase Hosting URL:"
echo "   Run: firebase hosting:sites:list"
echo "   Or check: https://console.firebase.google.com/project/YOUR_PROJECT_ID/hosting"
echo ""

echo "6. Common Firebase Hosting URLs:"
echo "   - https://YOUR_PROJECT_ID.web.app"
echo "   - https://YOUR_PROJECT_ID.firebaseapp.com"
echo "   - Custom domain (if configured)"
echo ""

echo "7. To deploy the app:"
echo "   npm run build"
echo "   firebase deploy --only hosting"
echo ""

echo "=== IMPORTANT for LIFF Configuration ==="
echo ""
echo "The Firebase Hosting URL should be set as the LIFF endpoint URL in LINE Developers Console."
echo "Make sure to use the HTTPS version of the URL."
echo ""