#! /bin/bash

cd monorepo \
&& npx nx build users \
&& cp .env* "./dist/apps/users" \
&& node ./dist/apps/users/main.js