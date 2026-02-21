#!/bin/bash
rm -r dist
npm run build

docker buildx build --platform linux/amd64 -t ghcr.io/nils-witt/ts-interactive-webmap:dev .
docker push ghcr.io/nils-witt/ts-interactive-webmap:dev