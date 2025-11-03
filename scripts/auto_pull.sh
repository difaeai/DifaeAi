#!/usr/bin/env bash
set -euo pipefail
cd /mnt/d/New/DIFAE

# Auto-pull script:
# - fetch every 30 seconds
# - fast-forward only (won't overwrite local edits)
# - skip if there are any uncommitted changes

while true; do
  # Make sure we're inside a git repo
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    
    # Check if local repo is clean (no uncommitted changes)
    if git diff --quiet && git diff --cached --quiet; then
      
      # Fetch new commits silently
      git fetch -q
      
      UPSTREAM='@{u}'  # tracking branch (origin/main)
      
      # If upstream exists (tracking configured)
      if git rev-parse "$UPSTREAM" >/dev/null 2>&1; then
        LOCAL=$(git rev-parse @)
        REMOTE=$(git rev-parse "$UPSTREAM")
        BASE=$(git merge-base @ "$UPSTREAM")
        
        # LOCAL is behind upstream → fast-forward merge
        if [[ "$LOCAL" = "$BASE" && "$REMOTE" != "$LOCAL" ]]; then
          git merge --ff-only "$UPSTREAM"
          echo "[auto-pull] Fast-forwarded to latest at $(date)"
        fi
      fi
    
    else
      echo "[auto-pull] Skipping pull due to local changes at $(date)"
    fi
  fi
  
  sleep 30
done

