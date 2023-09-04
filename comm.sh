#! /bin/bash

cd monorepo \
&& npx nx build comm \
&& cp .env* "./dist/apps/comm" \
&& node ./dist/apps/comm/main.js