#! /bin/bash

cd monorepo \
&& npx nx build pkg-mgmt \
&& cp .env* "./dist/apps/pkg-mgmt" \
&& node ./dist/apps/pkg-mgmt/main.js