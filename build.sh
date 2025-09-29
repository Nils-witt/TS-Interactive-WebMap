#!/bin/bash
# Build helper for CI/local environments.
# - Cleans node_modules and dist to ensure a fresh build
# - Uses official Node docker image to avoid requiring node/npm on host
# - Installs dependencies and runs the build

set -euo pipefail

rm -rf ./node_modules
rm -rf ./dist

docker run --rm -i \
  -v "$(pwd)":/app \
  -w /app \
  node:22-bookworm bash -lc "npm ci && npm run build"

rm -rf ./node_modules