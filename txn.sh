#! /bin/bash

cd monorepo \
&& npx nx build txn \
&& cp .env* "./dist/apps/txn" \
&& node ./dist/apps/txn/main.js