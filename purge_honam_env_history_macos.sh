#!/usr/bin/env bash
# =============================================================================
# purge_honam_env_history_macos.sh
#
# PURPOSE: Remove client/.env from the ENTIRE git history of parag0hz/honam
#          using git-filter-repo, then force-push the rewritten history.
#
# PLATFORM: macOS (Apple Silicon or Intel)
#
# WARNING ─────────────────────────────────────────────────────────────────────
#  • This script REWRITES git history (force-push). All existing clones /
#    forks will diverge. Collaborators MUST re-clone after this runs.
#  • Rotate / revoke any exposed secrets (Google Maps, Kakao keys) BEFORE
#    running this script. Even after history rewrite, already-leaked keys
#    should be considered compromised.
#  • The script does NOT contain or commit any secrets.
# =============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
# Choose ONE of the two remote formats below and leave the other blank.
#
# SSH  (recommended when your SSH key is already added to GitHub):
REPO_SSH="git@github.com:parag0hz/honam.git"
#
# HTTPS (use if SSH is not configured; requires a GitHub PAT – see below):
REPO_HTTPS="https://github.com/parag0hz/honam.git"
#
# HTTPS / PAT authentication:
#   GitHub no longer accepts plain passwords over HTTPS.
#   Create a Personal Access Token (PAT) at:
#     https://github.com/settings/tokens  → "Generate new token (classic)"
#   Required scope: repo (full control of private repositories)
#   When git prompts for credentials:
#     Username: <your GitHub username>
#     Password: <your PAT>  (NOT your GitHub password)
#   Tip: store it once with:
#     git config --global credential.helper osxkeychain
# ──────────────────────────────────────────────────────────────────────────────

# Auto-detect which remote to use (prefer SSH if set, fall back to HTTPS)
if [[ -n "${REPO_SSH:-}" ]]; then
  REPO_URL="${REPO_SSH}"
  USE_SSH=true
else
  REPO_URL="${REPO_HTTPS}"
  USE_SSH=false
fi

WORKDIR="${PWD}/honam-history-purge-$(date +%Y%m%d-%H%M%S)"
MIRROR_DIR="${WORKDIR}/honam.git"
VERIFY_DIR="${WORKDIR}/honam-verify"
TARGET_PATH="client/.env"   # path inside the repo to purge

# ── Pre-flight checks ─────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  honam git-history purge script (macOS)                         ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠  WARNING: This will REWRITE git history and force-push to GitHub."
echo "   • All collaborators must re-clone after this completes."
echo "   • Rotate any exposed API keys BEFORE proceeding."
echo ""
read -r -p "Type YES to continue: " CONFIRM
if [[ "${CONFIRM}" != "YES" ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "==> Working directory: ${WORKDIR}"
mkdir -p "${WORKDIR}"

# ── Prerequisite: git ─────────────────────────────────────────────────────────
echo "==> Checking prerequisites..."
command -v git >/dev/null 2>&1 || { echo "ERROR: git not found. Install Xcode Command Line Tools: xcode-select --install"; exit 1; }

# ── Prerequisite: git-filter-repo ────────────────────────────────────────────
if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "==> git-filter-repo not found. Installing via Homebrew..."
  if ! command -v brew >/dev/null 2>&1; then
    echo "ERROR: Homebrew not found. Install it first: https://brew.sh"
    exit 1
  fi
  brew install git-filter-repo
fi
echo "==> git-filter-repo: $(git-filter-repo --version 2>/dev/null || echo 'installed')"

# ── SSH: fix known_hosts (prevents 'Host key verification failed') ────────────
if [[ "${USE_SSH}" == true ]]; then
  echo "==> Adding GitHub SSH host key to ~/.ssh/known_hosts (if missing)..."
  mkdir -p ~/.ssh
  chmod 700 ~/.ssh
  touch ~/.ssh/known_hosts
  # Add GitHub's current ed25519 and RSA host keys
  ssh-keyscan -t ed25519 github.com >> ~/.ssh/known_hosts 2>/dev/null
  ssh-keyscan -t rsa     github.com >> ~/.ssh/known_hosts 2>/dev/null
  # Deduplicate
  sort -u ~/.ssh/known_hosts -o ~/.ssh/known_hosts

  echo "==> Verifying SSH connection to GitHub..."
  if ! ssh -T git@github.com -o BatchMode=yes -o StrictHostKeyChecking=accept-new 2>&1 | grep -q "successfully authenticated\|Hi "; then
    echo ""
    echo "⚠  SSH connection to GitHub failed. Possible causes:"
    echo "   1. No SSH key added to your GitHub account."
    echo "      Fix: https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
    echo "   2. Wrong key / key not loaded in ssh-agent."
    echo "      Fix: ssh-add ~/.ssh/id_ed25519   (or id_rsa)"
    echo "   3. Firewall blocks port 22."
    echo "      Fix: use HTTPS instead (set REPO_SSH=\"\" in this script)."
    echo ""
    read -r -p "Continue anyway? (y/N): " SSH_CONTINUE
    if [[ "${SSH_CONTINUE}" != "y" && "${SSH_CONTINUE}" != "Y" ]]; then
      echo "Aborted. Fix SSH and re-run, or switch to HTTPS remote."
      exit 1
    fi
  fi
fi

# ── Step 1: Mirror clone ──────────────────────────────────────────────────────
echo ""
echo "==> [1/4] Mirror cloning ${REPO_URL}"
git clone --mirror "${REPO_URL}" "${MIRROR_DIR}"

# ── Step 2: Purge client/.env from entire history ────────────────────────────
echo ""
echo "==> [2/4] Removing '${TARGET_PATH}' from entire git history..."
cd "${MIRROR_DIR}"
git filter-repo --path "${TARGET_PATH}" --invert-paths --force

# git-filter-repo removes the remote configuration.
# We must re-add origin before pushing.
echo "==> Re-adding 'origin' remote (removed by git-filter-repo)..."
git remote add origin "${REPO_URL}"

# ── Step 3: Force-push rewritten history ─────────────────────────────────────
echo ""
echo "==> [3/4] Force-pushing rewritten history to origin..."
echo "   (You may be prompted for SSH passphrase or GitHub credentials.)"
git push origin --force --all
git push origin --force --tags

# ── Step 4: Verify ───────────────────────────────────────────────────────────
echo ""
echo "==> [4/4] Verifying: fresh clone to check purge..."
cd "${WORKDIR}"
git clone "${REPO_URL}" "${VERIFY_DIR}"

cd "${VERIFY_DIR}"

echo ""
echo "── git log for ${TARGET_PATH} (should be EMPTY) ──────────────────────"
git log --all -- "${TARGET_PATH}" || true

echo ""
echo "── File presence check (should say 'NOT present') ────────────────────"
if [[ -f "${TARGET_PATH}" ]]; then
  echo "⚠  WARNING: ${TARGET_PATH} still exists in the working tree!"
else
  echo "OK: ${TARGET_PATH} is NOT present in the working tree."
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  DONE                                                           ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Rotate any exposed keys (Google Maps / Kakao) if not done yet."
echo "  2. Ensure client/.env is listed in .gitignore."
echo "  3. Commit client/.env.example (placeholder values only)."
echo "  4. Notify collaborators to re-clone the repository."
echo ""
echo "Work files are in: ${WORKDIR}"
