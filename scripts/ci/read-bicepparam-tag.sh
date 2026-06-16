#!/usr/bin/env bash
# Prints the current `param imageTag` value from a Bicep .bicepparam file.
# Used to resolve the proven dev tag when promoting to prod.
#
# Usage: read-bicepparam-tag.sh <path-to-bicepparam>
set -euo pipefail

file="${1:?path to .bicepparam required}"

if [ ! -f "$file" ]; then
  echo "param file not found: $file" >&2
  exit 1
fi

tag="$(sed -nE "s/^param imageTag = '(.*)'/\1/p" "$file")"

if [ -z "$tag" ]; then
  echo "no 'param imageTag' found in $file" >&2
  exit 1
fi

printf '%s\n' "$tag"
