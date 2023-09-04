#! /bin/bash

cd monorepo \
&& npx nx build auth \
&& cp .env* "./dist/apps/auth" \
&& node ./dist/apps/auth/main.js