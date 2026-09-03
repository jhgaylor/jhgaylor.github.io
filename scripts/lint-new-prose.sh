#!/usr/bin/env bash
set -euo pipefail

base_sha="${1:-}"
head_sha="${2:-HEAD}"

if [[ -z "$base_sha" || "$base_sha" =~ ^0+$ ]]; then
  base_sha="$(git rev-parse "${head_sha}^")"
fi

files=()
while IFS= read -r -d '' file; do
  case "$file" in
    *.md)
      if [[ "$file" == blog/posts/* ]] && grep -Eq '^permalink:[[:space:]]*false[[:space:]]*$' "$file"; then
        continue
      fi
      files+=("$file")
      ;;
  esac
done < <(git diff --diff-filter=ACMR --name-only -z "$base_sha" "$head_sha" -- blog/posts writing)

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No new or modified prose to lint."
  exit 0
fi

printf 'Linting %s\n' "${files[@]}"
vale --slop --min-severity suggestion "${files[@]}"
