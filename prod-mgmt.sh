#! /bin/bash

# check if env vars is provided
if [ -z "$GO_UPC_API_KEY" ]; then
  echo "GO_UPC_API_KEY is not set"
  exit 1
fi

cd monorepo \
&& npx nx build prod-mgmt \
&& cp .env* "./dist/apps/prod-mgmt" \
&& node ./dist/apps/prod-mgmt/main.js