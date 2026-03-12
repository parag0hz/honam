#!/usr/bin/env bash
# =============================================================================
# purge-env-history.sh
# macOS one-shot script: permanently remove client/.env from git history
# using git filter-repo, then force-push to origin.
#
# Usage:
#   chmod +x scripts/purge-env-history.sh
#   ./scripts/purge-env-history.sh
#
# Prerequisites: macOS with Homebrew (auto-installed if absent), git, Python 3
# =============================================================================
set -euo pipefail

TARGET_FILE="client/.env"
REPO_REMOTE="origin"

# ── colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── safety checks ────────────────────────────────────────────────────────────
info "=== git history purge script for '${TARGET_FILE}' ==="
echo ""
warn "⚠️  This script REWRITES git history and performs a force-push."
warn "    Any collaborators must re-clone or hard-reset their local copies."
echo ""
read -rp "Type 'yes' to continue, anything else to abort: " CONFIRM
[[ "$CONFIRM" == "yes" ]] || { info "Aborted."; exit 0; }

# Must be run from the repository root
if [[ ! -d ".git" ]]; then
  error "Run this script from the repository root (where .git/ lives)."
fi

# ── install Homebrew if needed ────────────────────────────────────────────────
if ! command -v brew &>/dev/null; then
  info "Homebrew not found – installing now (requires internet access)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add Homebrew to PATH for Apple Silicon Macs
  if [[ -f "/opt/homebrew/bin/brew" ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
fi

# ── install git-filter-repo if needed ────────────────────────────────────────
if ! command -v git-filter-repo &>/dev/null; then
  info "Installing git-filter-repo via Homebrew..."
  brew install git-filter-repo
fi

# ── verify the target file exists in history ─────────────────────────────────
COMMITS_WITH_FILE=$(git log --all --oneline -- "${TARGET_FILE}" | wc -l | tr -d ' ')
if [[ "$COMMITS_WITH_FILE" -eq 0 ]]; then
  info "No commits found containing '${TARGET_FILE}'. Nothing to purge."
  exit 0
fi
info "Found ${COMMITS_WITH_FILE} commit(s) containing '${TARGET_FILE}'."

# ── create a local backup tag before rewriting ───────────────────────────────
BACKUP_TAG="backup/before-purge-$(date +%Y%m%d%H%M%S)"
git tag "$BACKUP_TAG"
info "Created local backup tag: ${BACKUP_TAG}"
info "(This tag is NOT pushed to origin – it stays local only.)"

# ── capture remote URL before filter-repo removes it ─────────────────────────
REMOTE_URL=$(git remote get-url "${REPO_REMOTE}" 2>/dev/null || true)
if [[ -z "$REMOTE_URL" ]]; then
  warn "Remote '${REPO_REMOTE}' not found before rewrite."
  read -rp "Enter the remote URL to re-add after rewriting (e.g. git@github.com:user/repo.git): " REMOTE_URL
fi

# ── rewrite history: remove the target file from every commit ─────────────────
info "Rewriting history – removing '${TARGET_FILE}' from all commits..."
git filter-repo --path "${TARGET_FILE}" --invert-paths --force

# ── re-add the remote (filter-repo removes it for safety) ────────────────────
if [[ -n "$REMOTE_URL" ]]; then
  git remote add "${REPO_REMOTE}" "$REMOTE_URL"
  info "Re-added remote '${REPO_REMOTE}' → ${REMOTE_URL}"
fi

# ── verify the file is gone ───────────────────────────────────────────────────
REMAINING=$(git log --all --oneline -- "${TARGET_FILE}" | wc -l | tr -d ' ')
if [[ "$REMAINING" -gt 0 ]]; then
  error "Unexpected: '${TARGET_FILE}' still found in ${REMAINING} commit(s). Aborting force-push."
fi
info "'${TARGET_FILE}' successfully removed from all commits."

# ── force-push ────────────────────────────────────────────────────────────────
echo ""
warn "About to force-push ALL branches and tags to '${REPO_REMOTE}'."
read -rp "Type 'push' to proceed, anything else to skip: " PUSH_CONFIRM

if [[ "$PUSH_CONFIRM" == "push" ]]; then
  info "Force-pushing branches..."
  git push "${REPO_REMOTE}" --force --all
  info "Force-pushing tags..."
  git push "${REPO_REMOTE}" --force --tags
  info "✅  Force-push complete."
else
  warn "Skipped force-push. Run the following manually when ready:"
  echo "    git push ${REPO_REMOTE} --force --all"
  echo "    git push ${REPO_REMOTE} --force --tags"
fi

# ── post-purge checklist ──────────────────────────────────────────────────────
echo ""
info "=== Post-purge checklist ==="
echo "  1. ROTATE ALL EXPOSED KEYS immediately (if not done already):"
echo "     • Google Maps API key  → https://console.cloud.google.com/"
echo "     • Kakao JS / REST keys → https://developers.kakao.com/"
echo "  2. Ensure 'client/.env' is listed in .gitignore (already done)."
echo "  3. Ensure 'client/.env.example' exists with placeholder values (already done)."
echo "  4. Ask collaborators to re-clone or run:"
echo "       git fetch --all && git reset --hard ${REPO_REMOTE}/main"
echo "  5. GitHub may cache old content – contact GitHub Support if sensitive"
echo "     data remains visible via the web UI after the force-push."
echo ""
info "Done. Backup tag '${BACKUP_TAG}' kept locally for reference."
