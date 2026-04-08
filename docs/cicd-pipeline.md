# CI/CD Pipeline

Reference for the Vesper P4 CI/CD pipeline — GitHub Actions + Azure Static Web Apps.

---

## Overview

```
feat/* or fix/*
    │
    ▼
PR to dev ──► CI runs (lint, typecheck, build, commitlint)
    │
    ▼ (merge)
dev branch ──► Deploy to staging (vesperp4-staging.azurestaticapps.net)
    │
    ▼
PR to main ──► CI runs + source branch check (must be dev)
    │
    ▼ (merge, requires approval)
main branch ──► Deploy to production (vesperp4.com)
```

---

## Workflows

### `ci.yml` — runs on every PR and push to `main`/`dev`

| Step | Command |
|------|---------|
| Commitlint | Validates all commit messages in the PR |
| Lint | `pnpm turbo lint` |
| Typecheck | `pnpm turbo typecheck` |
| Build | `pnpm turbo build` |

### `deploy.yml` — runs on push to `main` or `dev`

| Trigger | Environment | URL |
|---------|-------------|-----|
| Push to `dev` | staging | Azure SWA staging slot |
| Push to `main` | production | [vesperp4.com](https://vesperp4.com) |

The `production` environment requires manual approval before deploy.

### `protect-main.yml` — runs on PRs targeting `main`

Fails if the source branch is anything other than `dev`. Prevents accidental direct PRs from feature branches to `main`.

---

## Required Status Checks

These must pass before any PR can be merged:

| Branch | Required checks |
|--------|----------------|
| `dev` | `Typecheck & Build` |
| `main` | `Typecheck & Build`, `Source branch must be dev` |

---

## Secrets

| Secret | Where | Purpose |
|--------|-------|---------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | GitHub → Settings → Secrets | Azure SWA deployment token |

To rotate: generate a new token in the Azure portal under the Static Web App resource, then update the GitHub secret.

---

## Adding a New Environment Variable

**Build-time (exposed to browser):**
1. Prefix with `NEXT_PUBLIC_`
2. Add to the `Build` step in `deploy.yml` under `env:`
3. Add to GitHub environment secrets for both `staging` and `production`

**Server-side only:**
1. Add to GitHub environment secrets
2. Reference in `deploy.yml` under `env:` without the `NEXT_PUBLIC_` prefix

---

## Turborepo Caching

Turbo caches task outputs locally. Cache keys are based on file content hashes.

- `build` — caches `.next/` and `dist/`
- `lint` and `typecheck` — output-less tasks, cached by input hash
- `dev` — never cached (`"cache": false`)

Remote caching (Vercel Remote Cache) can be enabled later to share cache across CI runs.
