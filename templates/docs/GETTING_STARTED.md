# Getting Started

## Access the Web UI

Open your `APP_URL` in a browser. On first visit you'll create an admin account (email + password). After that, log in at `/login`.

## Your First Chat

Click the chat input at `/` and start a conversation. The AI streams responses in real-time. You can:

- **Upload files** — images, PDFs, and text files
- **Use voice** — click the microphone for real-time transcription (requires `ASSEMBLYAI_API_KEY`)
- **Browse history** — past conversations are in the sidebar, grouped by date

## Your First Job

Jobs are autonomous coding tasks. The AI creates a branch, works in a Docker container, and opens a PR.

From chat, ask the AI to do something that requires code changes — like "update the README" or "add a new cron job." The AI will create a job, and you can monitor it on the **Runners** page (`/runners`).

You can also create jobs via the API:

```bash
curl -X POST https://your-app-url/api/create-job \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"job": "Update the README with installation instructions"}'
```

Generate API keys from **Settings > Secrets** in the web UI.

## Connect Telegram (Optional)

Chat with your agent on the go via a Telegram bot:

```bash
npm run setup-telegram
```

The setup wizard configures your bot token, webhook, and chat ID. Once connected, you can text or send voice messages to create jobs and get responses.

## Monitor Activity

- **Runners** (`/runners`) — watch running jobs, see logs
- **Notifications** (`/notifications`) — job completion alerts
- **Admin** (`/admin`) — manage users, crons, triggers, API keys, and GitHub settings

## Code Workspaces

Launch interactive coding sessions directly from chat. The AI spins up a Docker container with Claude Code and your repo, giving you a browser-based terminal at `/code/{id}`.

## Cluster Workspaces

Create multi-role agent teams from `/clusters`. Define roles (Researcher, Writer, etc.), set triggers, and let them collaborate in shared directories. See [CLUSTERS.md](CLUSTERS.md) for details.

## What's Next

- [CONFIGURATION.md](CONFIGURATION.md) — environment variables, LLM providers, GitHub setup
- [CRONS_AND_TRIGGERS.md](CRONS_AND_TRIGGERS.md) — schedule recurring jobs and webhook automations
- [SKILLS.md](SKILLS.md) — extend your agent with custom skills
- [CLUSTERS.md](CLUSTERS.md) — multi-role agent teams
- [CLI.md](CLI.md) — all CLI commands
- [UPGRADING.md](UPGRADING.md) — keeping your agent up to date
- [SECURITY.md](SECURITY.md) — API keys, secret handling, security model
