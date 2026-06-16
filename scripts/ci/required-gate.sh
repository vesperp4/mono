#!/usr/bin/env bash
# Aggregates a path-filtered job result into a single always-reporting status check,
# so the check can be marked "required" in branch protection even when the underlying
# job is skipped because no relevant files changed.
#
# Env:
#   LABEL   - human-readable name for the gate (e.g. "API")
#   CHANGED - "true" if the path filter matched, anything else otherwise
#   RESULT  - the result of the test job ("success", "failure", "skipped", ...)
set -euo pipefail

label="${LABEL:-Gate}"
changed="${CHANGED:-false}"
result="${RESULT:-}"

if [ "$changed" != "true" ]; then
  echo "✅ ${label}: no relevant changes; gate passes."
  exit 0
fi

if [ "$result" = "success" ]; then
  echo "✅ ${label}: checks passed."
  exit 0
fi

echo "❌ ${label}: checks did not pass (result: ${result:-missing})."
exit 1
