#!/usr/bin/env bash
# The bundle is pasted into the Cloudflare dashboard editor by hand, so no string
# in it may span lines. A double-quoted string cannot span lines in valid JS, so
# the only way it happens is a template literal holding a real newline, which
# leaves that line with an odd number of backticks.
#
# This is not cosmetic. esbuild rewrites a backslash-n escape inside a template
# literal into a real newline, and `--minify` rewrites a plain "\n" string back
# into a template literal for the same reason (one byte shorter). Either way the
# result is a string broken across lines, which any editor that reindents on
# paste will silently corrupt.
set -euo pipefail

bundle="${1:-dist/index.js}"

if [ ! -f "$bundle" ]; then
  echo "check-bundle: $bundle does not exist" >&2
  exit 1
fi

awk -v file="$bundle" '
  { n = gsub(/`/, "`"); if (n % 2 == 1) { printf "%s:%d holds an unterminated template literal\n", file, NR > "/dev/stderr"; bad = 1 } }
  END {
    if (bad) {
      print "check-bundle: a string spans lines and will not survive a hand-paste." > "/dev/stderr"
      print "Rewrite it as a double-quoted string with an escape, and do not minify." > "/dev/stderr"
      exit 1
    }
  }
' "$bundle"

echo "check-bundle: ok, $(wc -l < "$bundle") lines, no string spans a line break"
