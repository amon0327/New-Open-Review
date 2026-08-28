#\!/bin/bash

# Supabaseプロジェクトにリンク（プロジェクトIDを指定）
echo "Linking to Supabase project..."
supabase link --project-ref otfreskkeaenahqziriz

# Edge Functionsをデプロイ
echo "Deploying line-register..."
supabase functions deploy line-register

echo "Deploying store-redirect..."
supabase functions deploy store-redirect

echo "Deploying test-line..."
supabase functions deploy test-line

echo "Deploying debug-liff..."
supabase functions deploy debug-liff

echo "All Edge Functions deployed\!"
