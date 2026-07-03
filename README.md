# Vesper P4 — Website

[![CI](https://github.com/vesperp4/mono/actions/workflows/ci.yml/badge.svg)](https://github.com/vesperp4/mono/actions/workflows/ci.yml)
[![Mainsite Deploy](https://github.com/vesperp4/mono/actions/workflows/mainsite-web-deploy.yaml/badge.svg)](https://github.com/vesperp4/mono/actions/workflows/mainsite-web-deploy.yaml)
[![Portal Deploy](https://github.com/vesperp4/mono/actions/workflows/portal-web-deploy.yaml/badge.svg)](https://github.com/vesperp4/mono/actions/workflows/portal-web-deploy.yaml)
[![Portal API Build](https://github.com/vesperp4/mono/actions/workflows/portal-api-build.yaml/badge.svg)](https://github.com/vesperp4/mono/actions/workflows/portal-api-build.yaml)
[![TV Engine Build](https://github.com/vesperp4/mono/actions/workflows/tv-engine-build.yaml/badge.svg)](https://github.com/vesperp4/mono/actions/workflows/tv-engine-build.yaml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/vesperp4/mono/badge)](https://scorecard.dev/viewer/?uri=github.com/vesperp4/mono)

Official website, member portal, and 24/7 streaming channel for the Vesper P4 graduate
CS/engineering chapter at Polytechnic University of Puerto Rico.

| App               | Production                                         | Dev                                                        |
| ----------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| **Main site**     | [vesperp4.com](https://vesperp4.com)               | [dev.vesperp4.com](https://dev.vesperp4.com)               |
| **Member portal** | [portal.vesperp4.com](https://portal.vesperp4.com) | [portal.dev.vesperp4.com](https://portal.dev.vesperp4.com) |
| **TV**            | vesperp4.tv — launch pending ([#166](https://github.com/vesperp4/mono/issues/166)) | [dev.vesperp4.tv](https://dev.vesperp4.tv)                 |

---

## Stack

| Layer            | Technology                                     |
| ---------------- | ---------------------------------------------- |
| Frontend         | Next.js 16+ (App Router), TypeScript (strict)  |
| Styling          | Tailwind CSS v4 + shadcn/ui                    |
| CMS              | Sanity v3 (Phase 2 content; TV schedule)       |
| Backend (portal) | Rust — Axum + sqlx                             |
| Database         | Azure Database for PostgreSQL Flexible Server  |
| Email            | Azure Communication Services                   |
| Streaming (TV)   | Eyevinn Channel Engine (VOD2Live) + ffmpeg HLS packaging + hls.js |
| Web hosting      | Azure Static Web Apps                          |
| API hosting      | Azure Container Apps (images in ACR)           |
| Auth             | Microsoft OIDC SSO (PUPR tenant) + magic-link fallback |
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
    app/            Routes: /, /signup, /signin, /confirm, /auth, /dashboard, /profile
    components/     UI components (join form, profile form, header, …)
  portal/api/       Members API (Rust: Axum + sqlx) → Azure Container Apps
    src/            Service code (router, members + auth domains, email, rate limiting, db)
    migrations/     sqlx migrations
  tv/web/           TV site (Next.js + hls.js player) → vesperp4.tv
  tv/engine/        24/7 playout service (Eyevinn Channel Engine) → Azure Container Apps
  tv/packager/      ffmpeg HLS packaging job (per upload) → Container Apps Job
  tv/studio/        Sanity Studio — the TV schedule admin (separate Sanity project)
packages/
  tsconfig/         Shared TypeScript configs (base, nextjs, node)
  eslint-config/    Shared ESLint config
.github/
  workflows/        CI/CD — per-app test/deploy/build, release, prod promote
```

The main site is content-only and makes no API calls. Everything membership-related
(signup, sign-in, email confirmation) lives on the portal, backed by `portal-api`.
The TV apps form their own pipeline — recordings are packaged to HLS once, and the
engine stitches them into a continuous channel driven by the Sanity schedule
(design: [docs/tv-architecture.md](./docs/tv-architecture.md)).

Full reference → [docs/project-structure.md](./docs/project-structure.md)

---

## Development Workflow

```
feat/* or fix/*  →  PR to main  →  production
```

- Trunk-based: branch off `main`, open a PR back to `main`
- CI must pass (lint, typecheck, build) before merge
- 1 approval required on all PRs
- Web apps deploy straight from `main`; `portal-api`, `tv-engine`, and `tv-packager`
  release via release-please — merging a release PR builds and signs the container
  image, deploys to dev automatically, and prod promotion is approval-gated

Full pipeline reference → [docs/cicd-pipeline.md](./docs/cicd-pipeline.md)

---

## Content Management

Editorial content (blog, events, team roster) moves to **Sanity Studio** in Phase 2 —
content editors won't need to touch the codebase. Member data is not content: it lives
in PostgreSQL, owned by `portal-api`. The TV channel's schedule and catalog live in a
**separate Sanity project** ("VesperP4 TV"), edited in `apps/tv/studio` — the TV site
itself has no login.

---

## Roadmap

| Phase  | Scope                                                          | Status         |
| ------ | -------------------------------------------------------------- | -------------- |
| **1**  | Public showcase — landing, about, team, projects, contact      | 🚧 In progress |
| **2**  | Events listing + blog (Sanity CMS)                             | 📋 Planned     |
| **3**  | Member portal — signup, Microsoft SSO + magic-link sign-in, dashboard & profile | ✅ Live |
| **TV** | 24/7 streaming channel → vesperp4.tv ([tracking #166](https://github.com/vesperp4/mono/issues/166)) | 🚧 Dev on air  |

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
