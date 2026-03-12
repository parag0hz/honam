#!/usr/bin/env bash
# =============================================================================
# purge-client-env-history-macos.sh
#
# PURPOSE : Remove client/.env from the *entire* Git history of
#           parag0hz/honam and force-push the rewritten history to GitHub.
#
# PLATFORM: macOS (zsh or bash), requires git-filter-repo
#           Install: brew install git-filter-repo
#
# USAGE   : bash scripts/purge-client-env-history-macos.sh [REPO_URL]
#           Default REPO_URL = https://github.com/parag0hz/honam.git
#
# DOCS    : See docs/SECRET_PURGE.md for detailed explanation and verification
#           steps, including how to handle "still present" cases.
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
REPO_URL="${1:-https://github.com/parag0hz/honam.git}"
TARGET_PATH="client/.env"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/honam-history-purge-XXXXXX")"
chmod 700 "$WORK_DIR"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
info()  { echo "==> $*"; }
warn()  { echo "  [WARN] $*" >&2; }
error() { echo "  [ERROR] $*" >&2; exit 1; }

# Check whether TARGET_PATH exists in any object reachable from all refs.
# Prints matching lines; empty output means the file is gone.
check_objects() {
  git rev-list --objects --all 2>/dev/null | grep -F "$TARGET_PATH" || true
}

# Print which refs still contain TARGET_PATH in their tree.
find_refs_with_file() {
  local found=0
  while IFS= read -r ref; do
    if git ls-tree -r --name-only "$ref" 2>/dev/null | grep -qF "$TARGET_PATH"; then
      echo "  $ref"
      found=1
    fi
  done < <(git for-each-ref --format='%(refname)')
  return $found
}

# ---------------------------------------------------------------------------
# Prerequisites
# ---------------------------------------------------------------------------
info "Checking prerequisites..."
command -v git >/dev/null 2>&1          || error "git not found. Install Xcode Command Line Tools."
command -v git-filter-repo >/dev/null 2>&1 || error "git-filter-repo not found. Run: brew install git-filter-repo"

# ---------------------------------------------------------------------------
# HTTPS / PAT guidance
# ---------------------------------------------------------------------------
if [[ "$REPO_URL" == https://* ]]; then
  cat <<'EOF'

  *** HTTPS 인증 안내 ***
  GitHub은 비밀번호 인증을 지원하지 않습니다.
  force push 단계에서 아이디/비밀번호 프롬프트가 뜨면:
    - 아이디  : GitHub 사용자명 (예: parag0hz)
    - 비밀번호 : Personal Access Token (PAT) — repo 권한 필요
                 생성: https://github.com/settings/tokens
  macOS Keychain에 캐시된 자격증명이 방해될 경우 미리 삭제:
    git credential-osxkeychain erase
    (대화식: host=github.com, protocol=https 입력 후 엔터 두 번)

EOF
fi

# ---------------------------------------------------------------------------
# Work directory
# ---------------------------------------------------------------------------
mkdir -p "$WORK_DIR"
info "Work directory: $WORK_DIR"

# ---------------------------------------------------------------------------
# Mirror clone
# ---------------------------------------------------------------------------
info "Mirror-cloning $REPO_URL ..."
git clone --mirror "$REPO_URL" "$WORK_DIR/honam.git"
cd "$WORK_DIR/honam.git"

# ---------------------------------------------------------------------------
# PRE-FILTER CHECK
# ---------------------------------------------------------------------------
info "Pre-filter check: looking for '$TARGET_PATH' objects..."
PRE_OBJECTS="$(check_objects)"
if [[ -z "$PRE_OBJECTS" ]]; then
  warn "'$TARGET_PATH' is not found in the local object store."
  warn "It may already have been removed, or this is a fresh clone without it."
  warn "Proceeding anyway to ensure remote is also clean."
else
  echo "  Objects found (will be removed):"
  echo "$PRE_OBJECTS" | sed 's/^/    /'
  echo ""
  info "Refs that currently contain '$TARGET_PATH':"
  find_refs_with_file || true
  echo ""
fi

# ---------------------------------------------------------------------------
# REMOVE target path from entire history
# ---------------------------------------------------------------------------
info "Running git filter-repo --path '$TARGET_PATH' --invert-paths ..."
git filter-repo --path "$TARGET_PATH" --invert-paths

# ---------------------------------------------------------------------------
# Restore remote (filter-repo removes it)
# ---------------------------------------------------------------------------
if ! git remote | grep -q "^origin$"; then
  info "Re-adding 'origin' remote (removed by filter-repo)..."
  git remote add origin "$REPO_URL"
else
  info "'origin' remote already exists; updating URL..."
  git remote set-url origin "$REPO_URL"
fi

# ---------------------------------------------------------------------------
# POST-FILTER CHECK
# ---------------------------------------------------------------------------
info "Post-filter check: looking for '$TARGET_PATH' objects..."
POST_OBJECTS="$(check_objects)"
if [[ -n "$POST_OBJECTS" ]]; then
  warn "Objects still found after filter-repo:"
  echo "$POST_OBJECTS" | sed 's/^/    /'
  warn "Refs that still contain '$TARGET_PATH':"
  find_refs_with_file || true
  warn "This can happen if filter-repo could not rewrite some refs."
  warn "Try deleting those refs manually before force-pushing:"
  warn "  git push origin --delete BRANCH_OR_TAG_NAME"
  warn "Or use --mirror push (see docs/SECRET_PURGE.md §3)."
else
  info "Clean: '$TARGET_PATH' is no longer present in local objects."
fi

# ---------------------------------------------------------------------------
# FORCE PUSH
# ---------------------------------------------------------------------------
info "Force-pushing all branches to origin..."
git push origin --force --all

info "Force-pushing all tags to origin..."
git push origin --force --tags

# Prune stale remote-tracking refs
info "Pruning stale remote refs..."
git remote prune origin || true

# ---------------------------------------------------------------------------
# POST-PUSH VERIFICATION
# ---------------------------------------------------------------------------
info "Post-push verification (fresh clone from remote)..."
VERIFY_DIR="$WORK_DIR/verify"
if ! git clone --mirror "$REPO_URL" "$VERIFY_DIR" 2>/dev/null; then
  warn "Could not clone for verification. Check network/auth and verify manually:"
  warn "  git clone $REPO_URL /tmp/honam-verify && git -C /tmp/honam-verify rev-list --objects --all | grep -F '$TARGET_PATH'"
  echo ""
  info "Local result summary:"
  if [[ -z "$PRE_OBJECTS" ]]; then
    echo "  Pre-filter objects  : 0"
  else
    echo "  Pre-filter objects  : $(echo "$PRE_OBJECTS" | wc -l | tr -d ' ')"
  fi
  if [[ -z "$POST_OBJECTS" ]]; then
    echo "  Post-filter objects : 0"
  else
    echo "  Post-filter objects : $(echo "$POST_OBJECTS" | wc -l | tr -d ' ')"
  fi
  echo ""
  echo "Work directory kept at: $WORK_DIR"
  echo "Remove when done: rm -rf '$WORK_DIR'"
  exit 0
fi

cd "$VERIFY_DIR"
REMOTE_OBJECTS="$(check_objects)"

echo ""
echo "============================================================"
if [[ -z "$REMOTE_OBJECTS" ]]; then
  echo "  ✅ SUCCESS: '$TARGET_PATH' is fully purged from the remote."
else
  echo "  ❌ STILL PRESENT on remote after push:"
  echo "$REMOTE_OBJECTS" | sed 's/^/    /'
  echo ""
  echo "  Refs on remote that still contain '$TARGET_PATH':"
  find_refs_with_file || true
  echo ""
  echo "  Possible causes:"
  echo "  1. GitHub caches — wait a few minutes and re-verify."
  echo "  2. PR refs (refs/pull/*) — force-push cannot remove these."
  echo "     Contact GitHub Support or follow the BFG/filter-repo guide:"
  echo "     https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository"
  echo "  3. Stale branches not covered by filter-repo — delete them:"
  echo "     git push origin --delete BRANCH_NAME"
  echo ""
  echo "  See docs/SECRET_PURGE.md §3 for detailed remediation steps."
fi
echo "============================================================"
echo ""
echo "Work directory kept at: $WORK_DIR"
echo "Remove when done: rm -rf '$WORK_DIR'"
echo ""

# ---------------------------------------------------------------------------
# Reminder: rotate exposed secrets
# ---------------------------------------------------------------------------
cat <<'EOF'

  ⚠️  중요: 노출된 시크릿을 반드시 즉시 무효화하고 재발급하세요!
  Git 히스토리 삭제만으로는 이미 유출된 키를 안전하게 만들 수 없습니다.
  - Firebase / Google Cloud → 콘솔에서 해당 API 키 삭제 후 재생성
  - 기타 서비스 → 각 서비스 대시보드에서 키 무효화 및 재발급

EOF
