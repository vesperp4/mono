# Infra Repo Spec

Scaffold spec for the **separate infrastructure repo** that deploys the Vesper P4 backend to
**Azure Container Apps**. It is the source of truth for *which image tag runs in each
environment* (dev/prod). It plays the role of the reference project's GitOps repo
(`RamonCollazo/cicd-workflow-gitops`) but uses **Bicep + `az deployment`** instead of
Kubernetes/Flux/kustomize.

> This repo does not exist yet. The monorepo already references it via the `INFRA_REPO_NAME`
> variable and pushes image-tag bumps into it (`_update-infra.yaml`).

---

## Why a separate repo

- Keeps deploy state (pinned image tags per env) out of the application repo.
- Environments are **directories**, not git branches — the monorepo is trunk-based.
- A merge to the infra repo is the audit-logged, reviewable record of every deploy.

---

## Proposed layout

```
infra/
  bicep/
    main.bicep                    # resource-group-scoped entry point
    modules/
      acr.bicep                   # Azure Container Registry (shared bootstrap)
      containerapps-env.bicep     # Container Apps managed environment (per env)
      containerapp-api.bicep      # the vesperp4-api Container App
      postgres.bicep              # Azure Database for PostgreSQL Flexible Server
  env/
    dev/
      api.bicepparam              # param imageTag = '0.1.0'  ← bumped by the monorepo
    prod/
      api.bicepparam              # param imageTag = '0.1.0'  ← bumped on promotion
  scripts/ci/                     # (optional) helpers
  .github/workflows/
    deploy.yaml                   # reconcile an env to Azure on merge / dispatch
    promote-prod.yaml             # (optional) mirror of the monorepo promotion entry
  README.md
```

`env/<env>/api.bicepparam` must contain a line exactly matching:

```bicep
param imageTag = '0.1.0'
```

The monorepo's `scripts/ci/patch-bicepparam.sh` / `read-bicepparam-tag.sh` operate on that
line, so keep the format stable.

---

## Reconcile workflow (`deploy.yaml`)

Triggers: `push` to `main` on paths `env/<env>/**`, and `workflow_dispatch`.

```yaml
permissions:
  id-token: write   # Azure OIDC
  contents: read
steps:
  - uses: actions/checkout@<sha>
  - uses: azure/login@<sha>           # federated OIDC credential
    with: { client-id, tenant-id, subscription-id }
  - run: |
      az deployment group create \
        --resource-group vesperp4-rg \
        --template-file bicep/main.bicep \
        --parameters env/${ENV}/api.bicepparam
```

- **dev** auto-applies when the monorepo's auto-merged bump PR lands.
- **prod** uses a GitHub **Environment** named `production` with required reviewers, so the
  deploy job waits for approval.

---

## Promotion flow

1. `website-api-build.yaml` (monorepo) pushes `vesperp4-api:X.Y.Z` to ACR and calls
   `_update-infra.yaml` → opens an **auto-merged** PR bumping `env/dev/api.bicepparam`.
2. Infra `deploy.yaml` reconciles **dev** on merge.
3. `website-api-promote-prod.yaml` (monorepo, manual, approval-gated) reads the deployed dev
   tag and opens a **non-auto-merged** PR bumping `env/prod/api.bicepparam`.
4. A human merges it; infra `deploy.yaml` reconciles **prod**.

---

## Auth chain (set up once)

- **CI → ACR push:** Azure OIDC federated credential for the monorepo's
  `website-api-build.yaml` (`AZURE_CLIENT_ID/TENANT_ID/SUBSCRIPTION_ID`), with `AcrPush` on the
  registry.
- **CI → infra repo:** a **GitHub App** installed on the infra repo (Contents + Pull requests
  read/write); its `INFRA_APP_ID` / `INFRA_APP_KEY` live in the monorepo.
- **Infra CI → Azure:** Azure OIDC federated credential for the infra repo with `Contributor`
  (or scoped) on `vesperp4-rg`.
- **Container App → ACR pull:** the Container App's **managed identity** with `AcrPull` (no
  registry password).

---

## Azure resources

| Resource | Notes |
|----------|-------|
| Azure Container Registry | Shared; `AcrPush` for CI, `AcrPull` for the app identity |
| Container Apps environment | One per env (dev/prod); scale-to-zero keeps cost low |
| Container App `vesperp4-api` | Image `…azurecr.io/vesperp4-api:<imageTag>`, port 3001, `DATABASE_URL` from secret |
| Azure DB for PostgreSQL Flexible Server | Managed Postgres; dev may use Burstable B1ms |

---

## Notes

- Keep ACR definition here (or in a one-time bootstrap), but it is a shared resource — both
  envs pull from the same registry, only the tag differs.
- The web app stays on Azure Static Web Apps (deployed from the monorepo). If it is later
  containerized, add a `containerapp-web.bicep` + `env/<env>/web.bicepparam` and a matching
  `website-web-build.yaml` in the monorepo.
