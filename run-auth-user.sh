#! /bin/bash
cd monorepo
npx nx run-many --target=serve --projects=api-gateway,auth,users