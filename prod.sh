#! /bin/bash

# Function to terminate the processes
function stop_processes() {
  pkill -f "node main.js"
}

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

# check if env vars is provided
if [ -z "$GO_UPC_API_KEY" ]; then
  echo "GO_UPC_API_KEY is not set"
  exit 1
fi

cd monorepo && npm i --legacy-peer-deps && npx nx run-many --target=build

# for each dir (services) ./dist/apps/*, copy .env* to
# ./dist/apps/<dir>/.env*
for d in ./dist/apps/* ; do cp .env* "$d" ; done

# for each dir (services) in ./dist/apps/* run "node main.js"
for d in ./dist/apps/* ; do (cd "$d" && node main.js &) ; done

# Trap SIGINT (Ctrl+C) to stop the processes
trap stop_processes SIGINT

# Wait for SIGINT
wait
