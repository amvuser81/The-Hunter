# Upgrading

## Quick Upgrade

Run the upgrade command from your project directory:

```bash
npx thepopebot upgrade
```

This installs the latest version, runs `init` to update managed files, rebuilds, commits, pushes, and restarts Docker.

## Automated Upgrades via GitHub Actions

Two workflows handle automated upgrades:

### 1. upgrade-event-handler.yml (manual trigger)

Trigger from the Actions tab in GitHub: **"Upgrade Event Handler" > Run workflow**. This:

1. Runs `npm update thepopebot` in the event handler container
2. If the version changed, creates an `upgrade/thepopebot-<version>` branch
3. Opens a PR with auto-merge enabled

This only updates `package.json` and `package-lock.json`. Template updates and rebuilds happen when the PR merges.

### 2. rebuild-event-handler.yml (on push to main)

Triggered when the upgrade PR merges. Detects the version change and:

1. Runs `npx thepopebot init` to update managed templates
2. Commits template changes back to `main`
3. Pulls the new Docker image
4. Restarts the container, installs dependencies, builds, and reloads PM2

---

## What Gets Updated

### Managed files (auto-updated)

These are overwritten to match the new package version:

- `.github/workflows/` — GitHub Actions workflows
- `docker-compose.yml` — Docker Compose config
- `.dockerignore` — Docker ignore rules
- `CLAUDE.md` — AI assistant context

### Your files (never overwritten)

Config files, skills, cron scripts, trigger scripts, and other user-editable files are left alone. If the package ships new defaults, `init` will notify you:

```
Updated templates available:
  config/CRONS.json

To view differences:  npx thepopebot diff <file>
To reset to default:  npx thepopebot reset <file>
```

---

## Recovering from a Failed Upgrade

SSH into your server and rebuild manually:

```bash
docker exec thepopebot-event-handler npm install --omit=dev
docker exec thepopebot-event-handler bash -c 'rm -rf .next-new .next-old && NEXT_BUILD_DIR=.next-new npm run build && mv .next .next-old 2>/dev/null; mv .next-new .next && rm -rf .next-old'
docker exec thepopebot-event-handler npx pm2 restart all
```

### Merge Conflicts on Upgrade PR

Resolve in the GitHub UI or locally:

```bash
git fetch origin
git checkout upgrade/thepopebot-<version>-<timestamp>
git merge main
# resolve conflicts
git push
```

### Diagnostic Commands

```bash
docker ps -a | grep thepopebot-event-handler          # container running?
docker logs thepopebot-event-handler --tail 50         # container logs
docker exec thepopebot-event-handler npx pm2 status    # PM2 status
docker exec thepopebot-event-handler npx pm2 logs --lines 30  # app logs
```
