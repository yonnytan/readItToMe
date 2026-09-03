#!/usr/bin/env bash
# Builds the Chrome Web Store upload package.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

version=$(node -p "require('./extension/manifest.json').version")
out="dist/read-it-to-me-${version}.zip"

node scripts/make-icons.js >/dev/null

rm -rf dist
mkdir -p dist
cd extension
zip -r -q "../$out" . -x '.*' -x '__MACOSX/*' -x '*/.DS_Store'
cd ..

echo "$out"
unzip -l "$out"
