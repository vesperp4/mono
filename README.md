# Vesper P4 — Website

[![CI](https://github.com/vesperp4/mono/actions/workflows/ci.yml/badge.svg)](https://github.com/vesperp4/mono/actions/workflows/ci.yml)
[![Mainsite Deploy](https://github.com/vesperp4/mono/actions/workflows/mainsite-web-deploy.yaml/badge.svg)](https://github.com/vesperp4/mono/actions/workflows/mainsite-web-deploy.yaml)
[![Portal Deploy](https://github.com/vesperp4/mono/actions/workflows/portal-web-deploy.yaml/badge.svg)](https://github.com/vesperp4/mono/actions/workflows/portal-web-deploy.yaml)
[![Portal API Build](https://github.com/vesperp4/mono/actions/workflows/portal-api-build.yaml/badge.svg)](https://github.com/vesperp4/mono/actions/workflows/portal-api-build.yaml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/vesperp4/mono/badge)](https://scorecard.dev/viewer/?uri=github.com/vesperp4/mono)

Official website and member portal for the Vesper P4 graduate CS/engineering chapter at
Polytechnic University of Puerto Rico.

| App               | Production                                       | Dev                                                        |
| ----------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| **Main site**     | [vesperp4.com](https://vesperp4.com)             | [dev.vesperp4.com](https://dev.vesperp4.com)               |
| **Member portal** | [portal.vesperp4.com](https://portal.vesperp4.com) | [portal.dev.vesperp4.com](https://portal.dev.vesperp4.com) |

---

## Stack

| Layer            | Technology                                     |
| ---------------- | ---------------------------------------------- |
| Frontend         | Next.js 16+ (App Router), TypeScript (strict)  |
| Styling          | Tailwind CSS v4 + shadcn/ui                    |
| CMS (Phase 2)    | Sanity v3                                      |
| Backend (portal) | Rust — Axum + sqlx                             |
| Database         | Azure Database for PostgreSQL Flexible Server  |
| Email            | Azure Communication Services                   |
| Web hosting      | Azure Static Web Apps                          |
| API hosting      | Azure Container Apps (images in ACR)           |
| Auth (planned)   | Microsoft OIDC SSO + magic-link fallback       |
| CI/CD            | GitHub Actions                                 |
| IaC              | Azure Bicep — separate infra repo              |

---

## Getting Started

**New to this kind of project (or to coding)?** Start with the
[**Onboarding guide**](./docs/onboarding.md) — it explains everything from scratch and walks
you through your first contribution. Unfamiliar terms are defined in the
[Glossary](./docs/glossary.md).

Full setup instructions are in [CONTRIBUTING.md](./CONTRIBUTING.md).

Quick version (if you've done this before) — [mise](https://mise.jdx.dev) installs the
toolchain and is the front door for every task:

```bash
git clone https://github.com/vesperp4/mono.git
cd mono
mise install        # install the pinned toolchain (node, pnpm, rust, …)
mise run setup      # install dependencies + git hooks
mise run dev        # start the dev server
```

→ App: [http://localhost:3000](http://localhost:3000)

Working on the portal API? `mise run db-up` starts a local Postgres for it.

Run `mise tasks` to see everything available; `mise run check` runs all the CI gates locally.

---

## Project Structure

```
apps/
  mainsite/web/     Public site (Next.js) → vesperp4.com
    app/            App Router pages and layouts
    components/     UI components
    lib/            Utilities (Sanity client lands here in Phase 2)
  portal/web/       Member portal (Next.js) → portal.vesperp4.com
    app/            Routes: /, /signup, /signin, /confirm
    components/     UI components (join form, …)
  portal/api/       Members API (Rust: Axum + sqlx) → Azure Container Apps
    src/            Service code (router, members domain, email, db)
    migrations/     sqlx migrations
packages/
  tsconfig/         Shared TypeScript configs (base, nextjs, node)
  eslint-config/    Shared ESLint config
.github/
  workflows/        CI/CD — per-app test/deploy/build, release, prod promote
```

The main site is content-only and makes no API calls. Everything membership-related
(signup, sign-in, email confirmation) lives on the portal, backed by `portal-api`.

Full reference → [docs/project-structure.md](./docs/project-structure.md)

---

## Development Workflow

```
feat/* or fix/*  →  PR to main  →  production
```

- Trunk-based: branch off `main`, open a PR back to `main`
- CI must pass (lint, typecheck, build) before merge
- 1 approval required on all PRs
- Web apps deploy straight from `main`; `portal-api` releases via release-please —
  merging its release PR builds and signs the container image, deploys to dev
  automatically, and prod promotion is approval-gated

Full pipeline reference → [docs/cicd-pipeline.md](./docs/cicd-pipeline.md)

---

## Content Management

Editorial content (blog, events, team roster) moves to **Sanity Studio** in Phase 2 —
content editors won't need to touch the codebase. Member data is not content: it lives
in PostgreSQL, owned by `portal-api`.

---

## Roadmap

| Phase | Scope                                                          | Status         |
| ----- | -------------------------------------------------------------- | -------------- |
| **1** | Public showcase — landing, about, team, projects, contact      | 🚧 In progress |
| **2** | Events listing + blog (Sanity CMS)                             | 📋 Planned     |
| **3** | Member portal — email-verified signup live; SSO sign-in next   | 🚧 In progress |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) — includes setup, branch workflow,
code standards, and the quarterly handoff protocol.

---

## Maintainers

| Role            | Name | GitHub |
| --------------- | ---- | ------ |
| Tech Lead       | —    | —      |
| Design Lead     | —    | —      |
| Faculty Advisor | —    | —      |

_Update this table each quarter._

---

## License

[MIT](./LICENSE) — open source, with attribution.
