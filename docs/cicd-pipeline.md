# CI/CD Pipeline

Reference for the Vesper P4 CI/CD pipeline. **Trunk-based on `main`.** The Next.js
**web** app deploys to Azure Static Web Apps; the Rust **api** is containerized, pushed to
Azure Container Registry (ACR), and deployed to **Azure Container Apps**. Both the Static
Web App and the Container App are provisioned in a separate **infra repo** (see
[`infra-repo-spec.md`](./infra-repo-spec.md)); the monorepo builds artifacts and ships them
(web content via the SWA deploy token, the api image via ACR).

> Status: the pipeline is scaffolded and ready. A few one-time **bootstrap steps** (below)
> must be done by the dev team before all checks go green.

---

## Branching model

```
feat/* | fix/* | ci/* | chore/*
    │
    ▼  PR
  main ──► CI gates (web test, api test, security, dependency review)
    │
    ├──► mainsite-web-deploy.yaml: web → Azure Static Web Apps (production)
    │
    └──► release-please PR ──(merge)──► tag portal-api-vX.Y.Z
                                            │
                                            ▼
                         portal-api-build.yaml: build + push (ACR) + cosign sign
                                            │
                                            ▼
                         _update-infra.yaml: PR in infra repo bumps dev tag (auto-merge)
                                            │
                                            ▼
                         infra repo deploy → Azure Container Apps (dev)
                                            │
                         portal-api-promote-prod.yaml (manual, approval-gated)
                                            ▼
                         infra repo PR bumps prod tag (manual merge) → Container Apps (prod)
```

---

## Workflows

| File | Trigger | Purpose |
|------|---------|---------|
| `ci.yml` | PR, push `main` | Repo-wide: commit-msg, `pnpm audit`, format-check, lint/typecheck/build |
| `mainsite-web-test.yaml` | PR, push `main` | Path-filtered web tests (Vitest) + `web-required` gate |
| `portal-api-test.yaml` | PR, push `main` | Path-filtered API gate → calls `_rust-service-test.yaml`; `api-required` gate |
| `_rust-service-test.yaml` | `workflow_call` | fmt, clippy, cargo-deny (bans/licenses/sources), tests + coverage against Postgres, Trivy image scan |
| `portal-api-security.yaml` | daily, push `main` (dep paths), dispatch | RustSec advisories (cargo-deny) + Trivy scan → Security tab; opens a tracking issue on new advisories |
| `portal-api-build.yaml` | tag `portal-api-v*` | Build + push image to ACR (provenance + SBOM), cosign sign, trigger infra dev bump |
| `_update-infra.yaml` | `workflow_call` | Open/auto-merge a PR in the infra repo pinning the image tag for an environment |
| `portal-api-promote-prod.yaml` | manual dispatch | Approval-gated promotion of the dev tag to prod (via `_update-infra.yaml`) |
| `release-please.yaml` | push `main` | Conventional-commit versioning, CHANGELOGs, per-component tags |
| `secret-scan.yaml` | PR | Secret scanning (TruffleHog — free for orgs) |
| `dependency-review.yaml` | PR | Block PRs introducing high-severity dependency CVEs |
| `scorecard.yml` | weekly, push `main` | OpenSSF Scorecard |
| `mainsite-web-deploy.yaml` | push `main` (web paths), dispatch | Build + upload web content to Azure SWA (production) |
| `pr-title.yml` | PR | Semantic PR title check |
| `dependabot-automerge.yaml` | Dependabot PRs, push `main` | Queue auto-merge for patch/minor Dependabot PRs; keep queued PRs up to date with main |

Reusable workflows are prefixed `_`. Project-specific workflows are named
`mainsite-<service>-<purpose>.yaml`.

### Required status checks (set in branch protection)

The `*-required` jobs always report (even when their path filter doesn't match), so they are
safe to mark **required**: `Mainsite API Test / api-required`, `Mainsite Web Test / web-required`,
`Dependency Review / review`, `Secret Scan / scan`, plus `CI / Typecheck & Build`.

> Branch protection's "require status checks" is currently **disabled** while the pipeline
> stabilizes. Re-enable it with the checks above once the bootstrap steps are done.

---

## Secrets & variables

| Name | Type | Used by | Purpose |
|------|------|---------|---------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | secret | `mainsite-web-deploy.yaml` | Web content upload to Azure SWA (token from the infra-provisioned SWA) |
| `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID` | secret | `portal-api-build.yaml` | Azure OIDC login to push to ACR |
| `ACR_NAME` / `ACR_LOGIN_SERVER` | variable | `portal-api-build.yaml` | Target registry (e.g. `vesperp4acr` / `vesperp4acr.azurecr.io`) |
| `INFRA_APP_ID` / `INFRA_APP_KEY` | secret | `_update-infra.yaml`, promote | GitHub App that can open PRs in the infra repo |
| `INFRA_REPO_NAME` | variable | `_update-infra.yaml`, promote | Infra repo name (e.g. `infra`) |
| `RELEASE_PLEASE_TOKEN` | secret | `release-please.yaml` | PAT/App token so release tags trigger the build workflow (GITHUB_TOKEN would not) |
| `AUTOMERGE_TOKEN` | secret (Actions **and** Dependabot stores) | `dependabot-automerge.yaml` | PAT with contents+PR write so branch updates re-run CI and auto-merges trigger main workflows |

The Azure OIDC login uses a **federated credential** (no stored client secret). Container Apps
pulls from ACR via **managed identity** (configured in the infra repo).

---

## Local parity (mise tasks)

`mise` is the front door — run `mise tasks` for the full list. The gates below mirror CI:

```
# everyday
mise run setup         # install dependencies + git hooks (first time)
mise run dev           # dev server(s), hot reload
mise run build         # production build
mise run format        # auto-format (Prettier)

# quality gates (each mirrors a GitHub Actions check)
mise run format-check  # pnpm turbo format-check
mise run audit         # pnpm audit --prod
mise run check-mainsite-web # lint, typecheck, test, build (mainsite-web)
mise run check-portal-web   # lint, typecheck, test, build (portal-web)
mise run check-portal-api   # fmt, clippy, cargo-deny bans/licenses/sources, coverage (needs db-up)
mise run audit-portal-api   # RustSec advisory scan (mirrors portal-api-security.yaml)
mise run lint-workflows # actionlint
mise run lint-scripts   # shellcheck
mise run check         # ALL of the above — run before pushing

# local database (for API + integration tests)
mise run db-up / db-down
```

---

## One-time bootstrap (dev team)

These are intentionally left for the dev team; the scaffolding is in place but not built:

1. **API lockfile** — `cd apps/portal/api && cargo build` to generate and commit `Cargo.lock`
   (the Dockerfile and CI use `--locked`).
2. **Web test deps** — add `vitest` and `@vitest/coverage-v8` as devDependencies in
   `apps/mainsite/web`, then run `pnpm install` to update `pnpm-lock.yaml`.
3. **Coverage gates** — enable thresholds once real tests exist (`--fail-under-lines` for the
   API in `_rust-service-test.yaml`; `thresholds` in `apps/mainsite/web/vitest.config.ts`).
4. **Infra repo** — create it from [`infra-repo-spec.md`](./infra-repo-spec.md), set up the
   GitHub App + Azure OIDC, and configure the secrets/variables above.
5. **Enable Dependency Graph** (Settings → Code security and analysis) so
   `dependency-review.yaml` can run.
6. **Re-enable branch protection** with the required checks listed above.

---

## Turborepo caching

Turbo caches task outputs by input hash: `build` caches `.next/`/`dist/`, `test` caches
`coverage/`, `lint`/`typecheck` are output-less, `dev` is never cached. Remote caching can be
enabled later to share cache across CI runs.
