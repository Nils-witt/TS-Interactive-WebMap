#!/bin/bash


# This script builds the project using the specified build tool.
rm -r ./node_modules
rm -r ./dist
docker run --rm -i -v "$(pwd)":/app -w /app node:22-bookworm npm install && npm run build
rm -r ./node_modules