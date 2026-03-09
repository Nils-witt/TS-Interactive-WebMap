#!/bin/bash
rm -r dist
npm run build

docker buildx build --platform linux/amd64 -t registry.home.nils-witt.de/ts-interactive-webmap:dev .
docker push registry.home.nils-witt.de/ts-interactive-webmap:dev