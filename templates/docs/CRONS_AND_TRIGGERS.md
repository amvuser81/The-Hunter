# Crons and Triggers

## Action Types

Both cron jobs and webhook triggers use the same dispatch system. Every action has a `type`:

| | `agent` (default) | `command` | `webhook` |
|---|---|---|---|
| **Uses LLM** | Yes — spins up Docker agent | No | No |
| **Runtime** | Minutes to hours | Milliseconds to seconds | Milliseconds to seconds |
| **Cost** | LLM API calls + GitHub Actions | Free (runs on event handler) | Free (runs on event handler) |
| **Use case** | Tasks that need to think | Shell scripts, file operations | Call external APIs |

If it needs to *think*, use `agent`. If it just needs to *do*, use `command`. If it needs to *call an external service*, use `webhook`.

---

## Cron Jobs

Defined in `config/CRONS.json`, loaded at server startup.

```json
[
  {
    "name": "Daily Check",
    "schedule": "0 9 * * *",
    "type": "agent",
    "job": "Review recent activity and summarize findings",
    "enabled": true
  },
  {
    "name": "Cleanup Logs",
    "schedule": "0 0 * * 0",
    "type": "command",
    "command": "node cleanup.js --older-than 7d",
    "enabled": false
  }
]
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name |
| `schedule` | Yes | Cron expression (e.g., `0 9 * * *` = daily at 9am) |
| `type` | No | `agent` (default), `command`, or `webhook` |
| `job` | For agent | Task prompt passed to the LLM |
| `command` | For command | Shell command (runs in `cron/` directory) |
| `url` | For webhook | Target URL |
| `method` | For webhook | `GET` or `POST` (default: `POST`) |
| `headers` | For webhook | Custom request headers |
| `vars` | For webhook | Key-value pairs merged into request body |
| `enabled` | No | Set `false` to disable (default: `true`) |
| `llm_provider` | No | Override LLM provider for this cron (agent type only) |
| `llm_model` | No | Override LLM model for this cron (agent type only) |

### Agent Action

```json
{ "type": "agent", "job": "Analyze the logs and write a summary report" }
```

Creates a Docker Agent job. The `job` string is the LLM's task prompt.

### Command Action

```json
{ "type": "command", "command": "node cleanup.js --older-than 7d" }
```

Runs a shell command on the event handler. Working directory: `cron/` for crons, `triggers/` for triggers. Put your scripts in those directories.

### Webhook Action

```json
{
  "type": "webhook",
  "url": "https://api.example.com/notify",
  "method": "POST",
  "headers": { "Authorization": "Bearer token" },
  "vars": { "source": "my-agent" }
}
```

Makes an HTTP request. `GET` skips the body. `POST` sends `{ ...vars }` or `{ ...vars, data: <incoming payload> }` when triggered by a webhook.

---

## Webhook Triggers

Defined in `config/TRIGGERS.json`. Triggers fire on POST requests to watched paths.

```json
[
  {
    "name": "GitHub Push",
    "watch_path": "/webhook/github-push",
    "enabled": true,
    "actions": [
      {
        "type": "agent",
        "job": "Review the push to {{body.ref}}: {{body.head_commit.message}}"
      }
    ]
  }
]
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name |
| `watch_path` | Yes | URL path to watch (e.g., `/webhook/github-push`) |
| `actions` | Yes | Array of actions to fire (same fields as cron actions) |
| `enabled` | No | Set `false` to disable (default: `true`) |

### Template Tokens

Use these in `job` and `command` strings to reference the incoming request:

| Token | Resolves to |
|-------|-------------|
| `{{body}}` | Entire request body as JSON |
| `{{body.field}}` | Nested field from request body |
| `{{query}}` | All query parameters as JSON |
| `{{query.field}}` | Specific query parameter |
| `{{headers}}` | All request headers as JSON |
| `{{headers.field}}` | Specific request header |

---

## Managing from the Web UI

Crons and triggers can also be managed from the **Admin** page (`/admin`) in the web UI. Changes made there are written back to the JSON config files.
