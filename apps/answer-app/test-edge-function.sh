#!/bin/bash

# Load environment variables
source .env

# Test the Edge Function
echo "Testing Edge Function with store code: 1fc07097"
echo "URL: $REACT_APP_SUPABASE_URL/functions/v1/store-redirect?code=1fc07097"
echo ""

curl -X GET \
  "$REACT_APP_SUPABASE_URL/functions/v1/store-redirect?code=1fc07097" \
  -H "Authorization: Bearer $REACT_APP_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  | jq '.'