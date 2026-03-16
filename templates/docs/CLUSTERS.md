# Cluster Workspaces

Clusters are multi-role agent teams. Define a set of roles, each with its own prompt and trigger configuration, and the system launches ephemeral Docker containers to execute them. Roles within a cluster share a workspace directory for collaboration.

---

## Creating a Cluster

Create clusters from the web UI at `/clusters`. Each cluster has:

- **Name** — Display label
- **System Prompt** — Shared context for all roles. Defaults to `config/CLUSTER_SYSTEM_PROMPT.md`
- **Shared Folders** — Named subdirectories under `shared/` that all roles can access (e.g., `docs`, `output`)
- **Enabled/Disabled** — Toggle the cluster. Disabling stops all running containers

---

## Defining Roles

Each role represents one agent type within a cluster:

| Field | Description |
|-------|-------------|
| **Role Name** | Display name (e.g., "Researcher", "Writer") |
| **Role Instructions** | Markdown prompt for the role. Defaults to `config/CLUSTER_ROLE_PROMPT.md` |
| **Prompt** | Task prompt passed to the agent (default: "Execute your role.") |
| **Max Concurrency** | Max simultaneous containers for this role (default: 1) |
| **Trigger Config** | How this role gets activated (see below) |
| **Folders** | Role-specific subdirectories |
| **Cleanup Worker Dir** | Delete the ephemeral worker directory after container exits |

### Template Variables

System and role prompts support `{{PLACEHOLDER}}` variables resolved at launch:

| Variable | Value |
|----------|-------|
| `{{CLUSTER_HOME}}` | Container workspace root |
| `{{CLUSTER_SHARED_DIR}}` | Path to cluster shared directory |
| `{{CLUSTER_SHARED_FOLDERS}}` | JSON array of shared folder paths |
| `{{SELF_ROLE_NAME}}` | This role's name |
| `{{SELF_WORKER_ID}}` | Unique ID for this worker instance |
| `{{SELF_WORK_DIR}}` | This worker's ephemeral working directory |
| `{{SELF_TMP_DIR}}` | This worker's temp directory |
| `{{WORKSPACE}}` | JSON manifest of the full workspace layout |
| `{{DATETIME}}` | ISO timestamp at launch time |
| `{{WEBHOOK_PAYLOAD}}` | JSON payload from a webhook trigger |

---

## Trigger Types

Each role can have multiple triggers. All triggers respect the role's concurrency limit.

### Manual

Always available. Click the run button in the UI.

### Webhook

Send a POST request to trigger execution:

```
POST /api/cluster/{clusterId}/role/{roleId}/webhook
Header: x-api-key: YOUR_API_KEY
Body: { "key": "value" }
```

The request body is available as `{{WEBHOOK_PAYLOAD}}`. Include a `prompt` field in the body to override the role's default prompt.

### Cron

Schedule recurring runs with a cron expression:

```json
{
  "cron": {
    "enabled": true,
    "schedule": "0 */6 * * *"
  }
}
```

### File Watch

Trigger when files change in the cluster's data directory:

```json
{
  "file_watch": {
    "enabled": true,
    "paths": "shared/input,shared/data"
  }
}
```

Paths are comma-separated, relative to the cluster data directory. Changes are debounced (5-second window). The `logs/` directory is always excluded.

---

## Directory Structure

Each cluster gets a data directory on disk:

```
data/clusters/
  cluster-{shortId}/
    shared/                       # Cluster-wide shared directory
      docs/                       # Shared folder
      output/                     # Shared folder
    role-{roleShortId}/
      shared/                     # Role-specific shared directory
      worker-{uuid}/              # Ephemeral per-container directory
        tmp/                      # Worker temp directory
    logs/
      role-{roleShortId}/
        2025-01-15_14-30-00_{uuid}/
          system-prompt.md        # Resolved system prompt
          user-prompt.md          # Resolved user prompt
          meta.json               # Run metadata
          trigger.json            # Trigger info and payload
          stdout.jsonl            # Container stdout
          stderr.txt              # Container stderr
```

---

## Concurrency

Each role has a `maxConcurrency` setting (default: 1). Before any trigger launches a container, the system checks the running container count. If at or above the limit, the trigger is rejected.

Set higher concurrency for roles that handle parallel workloads (e.g., webhook-triggered processing). Keep at 1 for sequential roles.

---

## Console and Logs

The cluster console page at `/clusters` provides:

- **Container status** per role — running, idle, or stopped
- **Resource usage** — CPU, memory, and network stats
- **Live logs** — streaming stdout and stderr
- **Prompts** — view resolved system and user prompts for any worker

Historical logs are available grouped by role, including stdout, stderr, prompts, and trigger info.

---

## Customizing Prompts

Edit `config/CLUSTER_SYSTEM_PROMPT.md` and `config/CLUSTER_ROLE_PROMPT.md` to set defaults for new clusters and roles. Existing clusters keep their current prompts — these templates only affect newly created clusters and roles.
