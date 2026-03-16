# Unified Coding Agent Docker Image — Plan

## Goal

Replace 4 separate Claude Code Docker images (`claude-code-job`, `claude-code-headless`, `claude-code-workspace`, `claude-code-cluster-worker`) with a single unified image. Each old image becomes a "runtime" — a folder of numbered shell scripts executed sequentially. Shared logic lives in `common/` and is symlinked into runtime folders at the correct position in the sequence.

## History

We analyzed all 4 existing Dockerfiles and entrypoints side-by-side. Key findings:

- **Dockerfiles**: ~80% identical (Node.js, GitHub CLI, Claude Code, non-root user). Differences: job uses `node:22-bookworm-slim` while others use `ubuntu:24.04`; workspace adds tmux+ttyd; job adds Playwright.
- **Entrypoints**: All share git identity setup and Claude trust config. Beyond that, each has a distinct linear flow — job unpacks GitHub Actions secrets and creates PRs; headless does clone-or-reset with rebase-push; workspace stays alive via tmux+ttyd; cluster-worker is the simplest (bind-mount, run, exit).
- **Lifecycle** is NOT a Dockerfile concern — it's whether the entrypoint exits or blocks (`exec ttyd`), and whether the caller sets `AutoRemove` or calls `removeContainer()`.
- **The old "stages" approach** (15 granular scripts with if-checks) was wrong — it's really about different runtime profiles, not configurable stages.

## Decisions

- **Playwright**: Always included in the image. One image, no variants.
- **Non-root user**: `coding-agent` with home at `/home/coding-agent`
- **Directory**: `docker/coding-agent/`
- **Architecture**: `RUNTIME` env var selects a folder. Numbered scripts in that folder run sequentially. Shared scripts live in `common/` and are symlinked into runtime folders at the right position.

---

## Directory Structure

```
docker/coding-agent/
├── Dockerfile
├── entrypoint.sh                    # Sources /scripts/${RUNTIME}/*.sh in order
├── commands/                        # Claude Code custom commands (from existing headless/workspace)
├── .tmux.conf                       # tmux config (from existing workspace)
└── scripts/
    ├── common/
    │   ├── setup-git.sh             # gh auth setup-git + derive name/email from GH API
    │   ├── claude-auth.sh           # unset ANTHROPIC_API_KEY, export CLAUDE_CODE_OAUTH_TOKEN
    │   ├── claude-trust.sh          # Write ~/.claude/settings.json + ~/.claude.json
    │   ├── clone-or-reset.sh        # Clone if no .git, else fetch+reset+clean
    │   ├── feature-branch.sh        # Create or checkout feature branch
    │   └── run-claude-headless.sh   # Build claude args, invoke with -p, capture EXIT_CODE
    │
    ├── job/
    │   ├── 1_unpack-secrets.sh              # real — SECRETS/LLM_SECRETS JSON → env vars
    │   ├── 2_setup-git.sh                   → ../common/setup-git.sh
    │   ├── 3_clone.sh                       # real — git clone --single-branch --depth 1
    │   ├── 4_claude-auth.sh                 → ../common/claude-auth.sh
    │   ├── 5_claude-trust.sh                → ../common/claude-trust.sh
    │   ├── 6_install-skills.sh              # real — npm install in skills/active/*/
    │   ├── 7_setup-mcp.sh                  # real — claude mcp add playwright
    │   ├── 8_build-prompt.sh               # real — concat SOUL.md + JOB_AGENT.md, resolve {{datetime}}
    │   ├── 9_run-claude.sh                 # real — run claude, capture to log files
    │   └── 10_commit-and-pr.sh             # real — commit, push, remove logs, gh pr create
    │
    ├── headless/
    │   ├── 1_setup-git.sh                   → ../common/setup-git.sh
    │   ├── 2_clone-or-reset.sh              → ../common/clone-or-reset.sh
    │   ├── 3_feature-branch.sh              → ../common/feature-branch.sh
    │   ├── 4_claude-auth.sh                 → ../common/claude-auth.sh
    │   ├── 5_claude-trust.sh                → ../common/claude-trust.sh
    │   ├── 6_run-claude.sh                  → ../common/run-claude-headless.sh
    │   └── 7_rebase-push.sh                # real — git add, commit, rebase, force-push (or AI merge-back)
    │
    ├── workspace/
    │   ├── 1_setup-git.sh                   → ../common/setup-git.sh
    │   ├── 2_clone-or-reset.sh              → ../common/clone-or-reset.sh
    │   ├── 3_feature-branch.sh              → ../common/feature-branch.sh
    │   ├── 4_claude-auth.sh                 → ../common/claude-auth.sh
    │   ├── 5_claude-trust.sh                # real — extends common with SessionStart hook for chat context
    │   ├── 6_chat-context.sh               # real — write .claude/chat-context.txt from CHAT_CONTEXT env
    │   └── 7_start-interactive.sh          # real — tmux new-session + exec ttyd (never returns)
    │
    └── cluster-worker/
        ├── 1_setup-git.sh                   → ../common/setup-git.sh (conditional — skips if no GH_TOKEN)
        ├── 2_claude-auth.sh                 → ../common/claude-auth.sh
        ├── 3_claude-trust.sh                → ../common/claude-trust.sh
        ├── 4_setup-logging.sh              # real — mkdir LOG_DIR, prep meta.json
        ├── 5_run-claude.sh                 # real — run claude with tee to log files
        └── 6_finalize-logging.sh           # real — write endedAt to meta.json
```

**Key**: `→` = symlink to common script. `# real` = runtime-specific file.

---

## Entrypoint

```bash
#!/bin/bash
set -e

if [ -z "$RUNTIME" ]; then
    echo "ERROR: RUNTIME env var is required (job, headless, workspace, cluster-worker)"
    exit 1
fi

if [ ! -d "/scripts/${RUNTIME}" ]; then
    echo "ERROR: Unknown runtime '${RUNTIME}' — no scripts found at /scripts/${RUNTIME}/"
    exit 1
fi

for script in /scripts/${RUNTIME}/*.sh; do
    source "$script"
done
```

No branching logic in the entrypoint itself. Each runtime folder is the complete recipe.

---

## Dockerfile

Single superset image. Base `ubuntu:24.04`.

**System packages**: git, curl, jq, build-essential, locales, ca-certs, gnupg, procps, tmux, fonts-noto-color-emoji, fonts-symbola

**Tools installed**:
- Node.js 22 (nodesource)
- GitHub CLI (official apt repo)
- ttyd 1.7.7 (binary download)
- Claude Code (`npm install -g @anthropic-ai/claude-code`)
- Playwright Chromium (`npx playwright install --with-deps chromium`)

**User**: `coding-agent` (non-root), home `/home/coding-agent`
**WORKDIR**: `/home/coding-agent/workspace`
**COPY**: `scripts/` (with symlinks preserved), `commands/`, `.tmux.conf`, `entrypoint.sh`
**ENV**: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`

Note: `COPY` doesn't follow symlinks by default — need to verify Docker build context preserves them, or create symlinks in a `RUN` step.

Status: [ ] TODO

---

## Env Var Reference

### Primary
| Variable | Values | Purpose |
|----------|--------|---------|
| `RUNTIME` | `job`, `headless`, `workspace`, `cluster-worker` | Selects which script folder to execute |

### Git / Repo
| Variable | Used by | Purpose |
|----------|---------|---------|
| `GH_TOKEN` | all | GitHub CLI auth |
| `REPO_URL` | job | Full git clone URL |
| `REPO` | headless, workspace | GitHub `owner/repo` slug |
| `BRANCH` | job, headless, workspace | Branch to clone/checkout |
| `FEATURE_BRANCH` | headless, workspace | Feature branch to create/checkout |

### Auth / Secrets
| Variable | Used by | Purpose |
|----------|---------|---------|
| `CLAUDE_CODE_OAUTH_TOKEN` | all | Claude Code OAuth token |
| `SECRETS` | job | JSON blob of AGENT_* env vars (from GitHub Actions) |
| `LLM_SECRETS` | job | JSON blob of AGENT_LLM_* env vars (from GitHub Actions) |

### Claude Code
| Variable | Used by | Purpose |
|----------|---------|---------|
| `PROMPT` | headless, cluster-worker | Task prompt (`-p` flag) |
| `SYSTEM_PROMPT` | cluster-worker | Inline system prompt text (`--append-system-prompt`) |
| `LLM_MODEL` | job | Model override (`--model`) |
| `PERMISSION` | headless | `plan`, `investigate`, or `dangerous` (default) |
| `PLAN_MODE` | cluster-worker | `1` = use `--permission-mode plan` |

### Runtime-Specific
| Variable | Used by | Purpose |
|----------|---------|---------|
| `CHAT_CONTEXT` | workspace | JSON planning conversation for SessionStart hook |
| `PORT` | workspace | ttyd port (default 7681) |
| `LOG_DIR` | cluster-worker | Directory for session logs |
| `JOB_TITLE` | job | PR title and commit message |
| `JOB_DESCRIPTION` | job | PR body and prompt content |
| `JOB_ID` | job | Log directory name (fallback: extracted from branch) |

---

## Build Order

1. [ ] **Dockerfile** — single superset image
2. [ ] **common/ scripts** — shared logic (setup-git, claude-auth, claude-trust, clone-or-reset, feature-branch, run-claude-headless)
3. [ ] **job/ runtime** — real scripts + symlinks to common
4. [ ] **headless/ runtime** — real scripts + symlinks to common
5. [ ] **workspace/ runtime** — real scripts + symlinks to common
6. [ ] **cluster-worker/ runtime** — real scripts + symlinks to common
7. [ ] **entrypoint.sh** — the for-loop orchestrator
8. [ ] **Build & test** — `docker build`, test each RUNTIME value
9. [ ] **Update callers** — `lib/tools/docker.js`, `lib/cluster/execute.js`, `lib/code/actions.js`, `run-job.yml`
10. [ ] **Remove old images** — `docker/claude-code-job/`, `docker/claude-code-headless/`, `docker/claude-code-workspace/`, `docker/claude-code-cluster-worker/`

---

## Open Questions

- **Docker COPY + symlinks**: Docker's `COPY` may not preserve symlinks. May need to create symlinks in a `RUN` step instead of relying on the build context. Need to test.
- **Investigate mode**: Currently a sub-mode of headless (same scripts but skips feature branch + skips post-run git). Could be its own runtime folder or stay as a `PERMISSION=investigate` check in the headless scripts. TBD.
