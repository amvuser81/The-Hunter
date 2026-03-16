# CLI Reference

All commands are run via `npx thepopebot <command>`.

## Project Setup

| Command | Description |
|---------|-------------|
| `init` | Scaffold a new project, or update templates in an existing one |
| `setup` | Run the full interactive setup wizard (`npm run setup`) |
| `setup-telegram` | Reconfigure the Telegram webhook (`npm run setup-telegram`) |
| `reset-auth` | Regenerate AUTH_SECRET, invalidating all sessions |

## Templates

| Command | Description |
|---------|-------------|
| `diff [file]` | List files that differ from package templates, or diff a specific file |
| `reset [file]` | List all template files, or restore a specific one to package default |
| `upgrade` / `update` | Upgrade thepopebot (install, init, build, commit, push, restart Docker) |
| `sync <path>` | Sync local package to a test install (dev workflow) |
| `user:password <email>` | Change a user's password |

## Secrets and Variables

These set GitHub repository secrets/variables using the `gh` CLI. They read `GH_OWNER` and `GH_REPO` from your `.env`. If VALUE is omitted, you'll be prompted with masked input.

| Command | Description |
|---------|-------------|
| `set-agent-secret KEY [VALUE]` | Set `AGENT_<KEY>` GitHub secret and update `.env` |
| `set-agent-llm-secret KEY [VALUE]` | Set `AGENT_LLM_<KEY>` GitHub secret |
| `set-var KEY [VALUE]` | Set a GitHub repository variable |

### Secret Prefix Convention

- **`AGENT_`** — Protected secrets passed to Docker container, filtered from LLM bash env. Example: `AGENT_GH_TOKEN`, `AGENT_ANTHROPIC_API_KEY`
- **`AGENT_LLM_`** — LLM-accessible secrets, not filtered. Example: `AGENT_LLM_BRAVE_API_KEY`
- **No prefix** — Workflow-only secrets, never passed to container. Example: `GH_WEBHOOK_SECRET`

## Common Workflows

### Initial setup
```bash
npx thepopebot init
npm run setup
```

### Upgrade to latest version
```bash
npx thepopebot upgrade
```

### Check what changed in templates
```bash
npx thepopebot diff                    # list all differing files
npx thepopebot diff config/CRONS.json  # see specific changes
npx thepopebot reset config/CRONS.json # accept new template
```

### Set up a new LLM provider for jobs
```bash
npx thepopebot set-var LLM_PROVIDER openai
npx thepopebot set-var LLM_MODEL gpt-4o
npx thepopebot set-agent-secret OPENAI_API_KEY sk-...
```
