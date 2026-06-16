# CI/CD Pipeline

Reference for the Vesper P4 CI/CD pipeline. **Trunk-based on `main`.** The Next.js
**web** app deploys to Azure Static Web Apps; the Rust **api** is containerized, pushed to
Azure Container Registry (ACR), and deployed to **Azure Container Apps** via a separate
**infra repo** (see [`infra-repo-spec.md`](./infra-repo-spec.md)).

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
    ├──► deploy.yml: web → Azure Static Web Apps (production)
    │
    └──► release-please PR ──(merge)──► tag vesperp4-api-vX.Y.Z
                                            │
                                            ▼
                         website-api-build.yaml: build + push (ACR) + cosign sign
                                            │
                                            ▼
                         _update-infra.yaml: PR in infra repo bumps dev tag (auto-merge)
                                            │
                                            ▼
                         infra repo deploy → Azure Container Apps (dev)
                                            │
                         website-api-promote-prod.yaml (manual, approval-gated)
                                            ▼
                         infra repo PR bumps prod tag (manual merge) → Container Apps (prod)
```

---

## Workflows

| File | Trigger | Purpose |
|------|---------|---------|
| `ci.yml` | PR, push `main` | Repo-wide: commit-msg, `pnpm audit`, format-check, lint/typecheck/build |
| `website-web-test.yaml` | PR, push `main` | Path-filtered web tests (Vitest) + `web-required` gate |
| `website-api-test.yaml` | PR, push `main` | Path-filtered API gate → calls `_rust-service-test.yaml`; `api-required` gate |
| `_rust-service-test.yaml` | `workflow_call` | fmt, clippy, cargo-deny, cargo-audit, tests + coverage against Postgres, Trivy image scan |
| `website-api-build.yaml` | tag `vesperp4-api-v*` | Build + push image to ACR (provenance + SBOM), cosign sign, trigger infra dev bump |
| `_update-infra.yaml` | `workflow_call` | Open/auto-merge a PR in the infra repo pinning the image tag for an environment |
| `website-api-promote-prod.yaml` | manual dispatch | Approval-gated promotion of the dev tag to prod (via `_update-infra.yaml`) |
| `release-please.yaml` | push `main` | Conventional-commit versioning, CHANGELOGs, per-component tags |
| `secret-scan.yaml` | PR | Secret scanning (TruffleHog — free for orgs) |
| `dependency-review.yaml` | PR | Block PRs introducing high-severity dependency CVEs |
| `scorecard.yml` | weekly, push `main` | OpenSSF Scorecard |
| `deploy.yml` | push `main` | Deploy web to Azure SWA (production) |
| `pr-title.yml` | PR | Semantic PR title check |

Reusable workflows are prefixed `_`. Project-specific workflows are named
`website-<service>-<purpose>.yaml`.

### Required status checks (set in branch protection)

The `*-required` jobs always report (even when their path filter doesn't match), so they are
safe to mark **required**: `Website API Test / api-required`, `Website Web Test / web-required`,
`Dependency Review / review`, `Secret Scan / scan`, plus `CI / Typecheck & Build`.

> Branch protection's "require status checks" is currently **disabled** while the pipeline
> stabilizes. Re-enable it with the checks above once the bootstrap steps are done.

---

## Secrets & variables

| Name | Type | Used by | Purpose |
|------|------|---------|---------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | secret | `deploy.yml` | Web deploy to Azure SWA |
| `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID` | secret | `website-api-build.yaml` | Azure OIDC login to push to ACR |
| `ACR_NAME` / `ACR_LOGIN_SERVER` | variable | `website-api-build.yaml` | Target registry (e.g. `vesperp4acr` / `vesperp4acr.azurecr.io`) |
| `INFRA_APP_ID` / `INFRA_APP_KEY` | secret | `_update-infra.yaml`, promote | GitHub App that can open PRs in the infra repo |
| `INFRA_REPO_NAME` | variable | `_update-infra.yaml`, promote | Infra repo name (e.g. `infra`) |
| `RELEASE_PLEASE_TOKEN` | secret | `release-please.yaml` | PAT/App token so release tags trigger the build workflow (GITHUB_TOKEN would not) |

The Azure OIDC login uses a **federated credential** (no stored client secret). Container Apps
pulls from ACR via **managed identity** (configured in the infra repo).

---

## Local parity (mise tasks)

```
mise run db-up         # start a local Postgres (docker)
mise run check-api     # fmt, clippy, cargo-deny, cargo-audit, tests + coverage
mise run check-web     # lint, typecheck, vitest
mise run lint-workflows # actionlint
mise run lint-scripts   # shellcheck
mise run check         # all of the above
```

---

## One-time bootstrap (dev team)

These are intentionally left for the dev team; the scaffolding is in place but not built:

1. **API lockfile** — `cd apps/website/api && cargo build` to generate and commit `Cargo.lock`
   (the Dockerfile and CI use `--locked`).
2. **Web test deps** — add `vitest` and `@vitest/coverage-v8` as devDependencies in
   `apps/website/web`, then run `pnpm install` to update `pnpm-lock.yaml`.
3. **Coverage gates** — enable thresholds once real tests exist (`--fail-under-lines` for the
   API in `_rust-service-test.yaml`; `thresholds` in `apps/website/web/vitest.config.ts`).
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
