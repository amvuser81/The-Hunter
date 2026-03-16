# My Agent

An autonomous AI agent powered by [thepopebot](https://github.com/stephengpope/thepopebot).

## Quick Start

1. **Open the web UI** — Visit your `APP_URL` in a browser
2. **Create an account** — First visit creates the admin account
3. **Start chatting** — The AI streams responses, supports file uploads and voice input
4. **Create a job** — Ask the AI to make code changes, or use the API

## What You Can Do

- **Chat** — Web chat with streaming responses, file uploads, voice input, and chat history
- **Telegram** — Chat on the go via a Telegram bot (`npm run setup-telegram`)
- **Jobs** — Autonomous coding tasks: the agent creates a branch, works in Docker, and opens a PR
- **Code Workspaces** — Browser-based interactive coding with Claude Code (`/code/{id}`)
- **Cluster Workspaces** — Multi-role agent teams with shared directories (`/clusters`)
- **Crons** — Scheduled recurring jobs (`config/CRONS.json`)
- **Triggers** — Webhook-activated automations (`config/TRIGGERS.json`)
- **Skills** — Extensible agent capabilities via `skills/active/`

## Config Files

| File | Purpose |
|------|---------|
| `config/SOUL.md` | Agent personality and identity |
| `config/JOB_PLANNING.md` | Event handler LLM system prompt |
| `config/JOB_AGENT.md` | Agent runtime environment docs |
| `config/CRONS.json` | Scheduled job definitions |
| `config/TRIGGERS.json` | Webhook trigger definitions |
| `.env` | API keys, tokens, and settings |

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for the complete list.

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/GETTING_STARTED.md) | First steps: web UI, first chat, first job, Telegram |
| [Configuration](docs/CONFIGURATION.md) | All config files, env vars, LLM providers, GitHub setup |
| [Crons and Triggers](docs/CRONS_AND_TRIGGERS.md) | Action types, scheduling, webhooks, template tokens |
| [Skills](docs/SKILLS.md) | Bundled skills, activate/deactivate, build custom skills |
| [Clusters](docs/CLUSTERS.md) | Multi-role agent teams, triggers, shared directories |
| [CLI](docs/CLI.md) | All CLI commands reference |
| [Upgrading](docs/UPGRADING.md) | How to upgrade, managed files, recovery |
| [Security](docs/SECURITY.md) | API keys, secret filtering, auto-merge restrictions |

## Managed vs. User Files

**Managed files** are auto-updated by `thepopebot init` and `thepopebot upgrade` to stay in sync with the package version. Do not edit them — changes will be overwritten:

- `.github/workflows/`
- `docker-compose.yml`
- `.dockerignore`
- `.gitignore`
- `CLAUDE.md`

**Your files** (`config/`, `skills/`, `cron/`, `triggers/`, `docs/`, `README.md`) are yours to customize. They are scaffolded once and never overwritten.

To customize Docker Compose, set `COMPOSE_FILE=docker-compose.custom.yml` in `.env`.

## Updating

```bash
npx thepopebot upgrade
```

Or trigger the **"Upgrade Event Handler"** workflow from the GitHub Actions tab.

## Help

- [thepopebot documentation](https://github.com/stephengpope/thepopebot)
- [Report an issue](https://github.com/stephengpope/thepopebot/issues)
