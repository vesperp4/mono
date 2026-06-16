#!/usr/bin/env bash
# Sets `param imageTag = '<tag>'` in a Bicep .bicepparam file (used by the infra
# repo to pin which image tag is deployed per environment).
#
# Usage: patch-bicepparam.sh <path-to-bicepparam> <tag>
set -euo pipefail

file="${1:?path to .bicepparam required}"
tag="${2:?image tag required}"

if [ ! -f "$file" ]; then
  echo "param file not found: $file" >&2
  exit 1
fi

sed -i -E "s/^(param imageTag = ').*(')/\1${tag}\2/" "$file"

if ! grep -q "param imageTag = '${tag}'" "$file"; then
  echo "failed to set imageTag in $file (is there a 'param imageTag' line?)" >&2
  exit 1
fi

echo "set imageTag = '${tag}' in $file"
