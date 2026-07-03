# Project Structure

Full reference for the Vesper P4 monorepo layout.

---

## Top-level

```
mono/
├── apps/
│   ├── mainsite/            Public site (vesperp4.com)
│   └── portal/              Member portal (portal.vesperp4.com) — web + api
├── packages/               Shared internal packages
├── docs/                   Architecture and reference docs
├── .github/workflows/       GitHub Actions CI/CD
├── .pre-commit-config.yaml  Pre-commit hooks (lint, conventional commits)
├── package.json             Root workspace — shared devDeps, scripts
├── pnpm-workspace.yaml      pnpm workspace config
├── turbo.json               Turborepo task graph
└── tsconfig.json            Root TypeScript project references
```

**Ownership boundary:** the main site is content-only and makes **no API calls** — its
dynamic content comes from Sanity (Phase 2). Everything membership-related (signup,
sign-in, email confirmation) lives on the portal; member data lives in PostgreSQL, owned
by `portal-api`. Sanity never stores member data; Postgres never stores editorial content.

---

## apps/mainsite/web

The public Next.js website — deployed to Azure Static Web Apps at
[vesperp4.com](https://vesperp4.com) (dev: `dev.vesperp4.com`).

```
apps/mainsite/web/
├── app/                    Next.js App Router (no src/ wrapper)
│   ├── layout.tsx          Root layout (html, body, global styles)
│   ├── globals.css         Tailwind CSS entry point
│   ├── providers.tsx       Client-side providers
│   ├── page.tsx            Home page (/)
│   ├── blog/               Blog index + posts (Sanity-backed, /blog/[slug])
│   └── events/             Events listing — upcoming + past (Sanity-backed)
├── components/             UI components (hero, sections, cards, navbar, …)
│   └── ui/                 shadcn/ui-style primitives
├── lib/                    Utilities + Sanity GROQ client (cms.ts, dates.ts)
├── public/                 Static assets
├── test/                   Vitest tests
├── eslint.config.mjs       ESLint config (extends @repo/eslint-config/next)
├── next.config.ts          Next.js config
├── postcss.config.mjs      PostCSS config (Tailwind v4)
├── tsconfig.json           Extends @repo/tsconfig/nextjs.json
├── vitest.config.ts        Vitest config
└── package.json
```

The "Join" calls-to-action link to the portal — this app never talks to `portal-api`.

Editorial content (blog posts + events) comes from the mainsite Sanity project via
read-only GROQ queries in `lib/cms.ts` — plain `fetch`, no Sanity SDK. The site
stays fully static: content is fetched at build time and a Sanity publish webhook
triggers a redeploy (`repository_dispatch: sanity-publish`).

---

## apps/mainsite/studio

Sanity Studio for the mainsite CMS (events + blog) — a **separate Sanity project**
from the TV one. Deployed to `<name>.sanity.studio` via `sanity deploy`; no Azure
resources. Schemas: `post`, `event`. See its README for one-time project setup.

---

## apps/portal/web

The member portal Next.js app — deployed to Azure Static Web Apps at
[portal.vesperp4.com](https://portal.vesperp4.com) (dev: `portal.dev.vesperp4.com`).
Mirrors the mainsite-web tooling/config.

```
apps/portal/web/
├── app/
│   ├── page.tsx            Portal home (/) — entry points to sign in / sign up
│   ├── signup/             Membership application → POST /api/v1/members
│   ├── signin/             Sign-in (placeholder — Microsoft OIDC SSO + magic-link)
│   ├── confirm/            Email-verification landing → POST /api/v1/members/confirm
│   ├── layout.tsx / globals.css / providers.tsx
├── components/             UI components (JoinForm, …)
├── test/                   Vitest tests
└── …same config files as mainsite/web
```

Configuration: `NEXT_PUBLIC_API_URL` points at the `portal-api` base URL
(defaults to `http://localhost:8080` locally — see its `.env.example`).

---

## apps/portal/api

The members API — Rust (Axum + sqlx), containerized, deployed to **Azure Container Apps**
(image `portal-api` in ACR). Listens on port **8080**.

```
apps/portal/api/
├── src/
│   ├── main.rs / lib.rs    Entry point and app wiring
│   ├── router.rs           Axum router + middleware (CORS, timeout, body limit)
│   ├── members/            Members domain — signup, confirm, resend
│   ├── email.rs            EmailSender trait — ACS in Azure, log-only locally
│   ├── db.rs               Pool setup — DATABASE_URL locally, passwordless Entra in Azure
│   ├── state.rs            Shared app state
│   └── error.rs            Error types → HTTP responses
├── migrations/             sqlx migrations (run automatically at startup)
├── tests/                  Integration tests — need Postgres (`mise run db-up`)
├── Dockerfile              Multi-stage build → distroless runtime
├── deny.toml               cargo-deny policy (bans, licenses, sources, advisories)
└── rust-toolchain.toml     Pinned Rust toolchain
```

---

## packages/tsconfig

Shared TypeScript configurations. No build step — JSON files only.

```
packages/tsconfig/
├── base.json       Strict mode, moduleResolution: bundler
├── nextjs.json     Extends base — adds JSX, dom libs, Next.js plugin
└── node.json       Extends base — NodeNext module resolution (for future backend)
```

Usage in other packages:
```json
{ "extends": "@repo/tsconfig/nextjs.json" }
```

---

## packages/eslint-config

Shared ESLint flat config for the monorepo.

```
packages/eslint-config/
└── next.js     ESLint v9 flat config — eslint-config-next + typescript-eslint rules
```

Usage in apps:
```js
import config from "@repo/eslint-config/next";
export default config;
```

---

## Infrastructure

Cloud infrastructure (Azure Container Apps, Static Web Apps, PostgreSQL, etc.) is
Infrastructure-as-Code in a **separate infra repo** — not in this monorepo. Entra tenant
identity & access is documented here in [`docs/entra-identity.md`](./entra-identity.md)
(it lives in Microsoft Graph, not ARM/Bicep).

---

## docs/

| File | Contents |
|------|----------|
| `onboarding.md` | Beginner-first "start here" walkthrough — setup through first PR |
| `glossary.md` | Plain-English definitions of every term and tool |
| `entra-identity.md` | Entra tenant identity & access runbook (groups, break-glass, security defaults) |
| `project-structure.md` | This file |
| `cicd-pipeline.md` | CI/CD pipeline reference |
| `infra-repo-spec.md` | Historical scaffold spec for the infra repo |
