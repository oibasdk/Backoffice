#!/usr/bin/env bash
# helper script to run build + analyzer locally
set -e
npm run build
npx source-map-explorer dist/assets/*.js
