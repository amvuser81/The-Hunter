# Security

## Security Measures

thepopebot includes these security measures by default:

- **API key authentication** — All external `/api` routes require a valid `x-api-key` header. Keys are SHA-256 hashed and verified with timing-safe comparison.
- **Webhook secret validation** — Telegram and GitHub webhook endpoints validate shared secrets. Unconfigured endpoints reject all requests (fail-closed).
- **Cluster webhook authentication** — Cluster role webhook endpoints require a valid API key.
- **Session encryption** — Web sessions use JWT encrypted with `AUTH_SECRET` in httpOnly cookies.
- **WebSocket authentication** — Code workspace WebSocket connections validate the session cookie.
- **Secret filtering in Docker agent** — The `env-sanitizer` filters `AGENT_*` secrets from the LLM's bash subprocess.
- **Auto-merge path restrictions** — `auto-merge.yml` only merges PRs where all changed files fall within `ALLOWED_PATHS` (default: `/logs`).
- **Server Actions with session checks** — All browser-to-server mutations use `requireAuth()` session validation.

---

## Secret Protection

### How It Works

1. `run-job.yml` collects `AGENT_*` GitHub secrets into a `SECRETS` JSON env var
2. The container entrypoint decodes the JSON and exports each key
3. The `env-sanitizer` extension filters ALL secret keys from the LLM's bash subprocess env
4. SDKs (Anthropic, GitHub CLI) read their keys from `process.env` normally
5. The LLM cannot `echo $ANYTHING` — subprocess env is filtered

### Protected vs. LLM-Accessible

| Credential Type | Set with | Visible to LLM? |
|-----------------|----------|------------------|
| Infrastructure keys (`GH_TOKEN`, `ANTHROPIC_API_KEY`) | `set-agent-secret` | No — filtered from bash |
| Skill API keys, browser logins | `set-agent-llm-secret` | Yes — skills need these |

```bash
# Protected (filtered from LLM)
npx thepopebot set-agent-secret GH_TOKEN ghp_xxx
npx thepopebot set-agent-secret ANTHROPIC_API_KEY sk-ant-xxx

# Accessible to LLM (not filtered)
npx thepopebot set-agent-llm-secret BROWSER_PASSWORD mypass123
npx thepopebot set-agent-llm-secret BRAVE_API_KEY xxx
```

---

## Auto-Merge Restrictions

The `auto-merge.yml` workflow checks every changed file in a job PR against `ALLOWED_PATHS` (GitHub repo variable, default: `/logs`). PRs with changes outside allowed paths require manual review.

Keep `ALLOWED_PATHS` restrictive. Only widen it after reviewing what your agent might change.

---

## API Keys

Database-backed API keys are generated through the web UI (**Settings > Secrets**). Format: `tpb_` prefix + 64 hex characters. Keys are SHA-256 hashed in the database.

---

## Recommendations

- **Set webhook secrets** — Configure `TELEGRAM_WEBHOOK_SECRET` and `GH_WEBHOOK_SECRET`, even for local development
- **Generate API keys** before exposing your server
- **Restrict Telegram** — Set `TELEGRAM_CHAT_ID` to your personal chat ID
- **Stop tunnels when not in use** — Don't leave endpoints exposed overnight
- **Use Docker Compose with TLS for production** — Enable Let's Encrypt via `LETSENCRYPT_EMAIL`
- **Review auto-merge settings** — Keep `ALLOWED_PATHS` restrictive

---

## Disclaimer

All software carries risk. thepopebot is provided as-is. You are responsible for securing your infrastructure, managing API keys, reviewing agent-generated PRs, and monitoring agent activity.
