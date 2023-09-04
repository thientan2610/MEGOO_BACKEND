#! /bin/bash

# check if env vars is provided
if [ -z "$OAUTH2_GOOGLE_CLIENT_SECRET" ]; then
  echo "OAUTH2_GOOGLE_CLIENT_SECRET is not set"
  exit 1
fi

if [ -z "$OAUTH2_GOOGLE_CLIENT_ID" ]; then
  echo "OAUTH2_GOOGLE_CLIENT_ID is not set"
  exit 1
fi

if [ -z "$CLOUDINARY_CLOUD_NAME" ]; then
  echo "CLOUDINARY_CLOUD_NAME is not set"
  exit 1
fi

if [ -z "$CLOUDINARY_API_KEY" ]; then
  echo "CLOUDINARY_API_KEY is not set"
  exit 1
fi


cd monorepo \
&& npx nx build api-gateway \
&& cp .env* "./dist/apps/api-gateway" \
&& node ./dist/apps/api-gateway/main.js