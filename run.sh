#! /bin/bash

cd monorepo/docker/ && ./run.sh

cd ../../ && cd monorepo && npm i --legacy-peer-deps -y && npm install --global nx@15.9.4 && nx run-many --target=serve --all --maxParallel=100