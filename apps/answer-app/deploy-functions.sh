#!/bin/bash

# SUPABASE_ACCESS_TOKEN must be set in the environment before running this script.
# (Old hardcoded token removed after it was found committed in plaintext — that token has been revoked.)
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN is not set. Run: export SUPABASE_ACCESS_TOKEN=your_token" >&2
  exit 1
fi

# Deploy Edge Functions
echo "Deploying store-redirect..."
npx supabase functions deploy store-redirect --project-ref otfreskkeaenahqziriz

echo "Deploying line-register..."
npx supabase functions deploy line-register --project-ref otfreskkeaenahqziriz

echo "Deployment complete!"