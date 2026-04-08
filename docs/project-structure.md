# Project Structure

Full reference for the Vesper P4 monorepo layout.

---

## Top-level

```
mono/
├── apps/                   Deployable applications
├── packages/               Shared internal packages
├── infra/                  Infrastructure, scripts, IaC (future)
├── docs/                   Architecture and reference docs
├── .github/workflows/      GitHub Actions CI/CD
├── .husky/                 Git hooks
├── package.json            Root workspace — shared devDeps, scripts
├── pnpm-workspace.yaml     pnpm workspace config
├── turbo.json              Turborepo task graph
├── commitlint.config.mjs   Conventional commits config
└── tsconfig.json           Root TypeScript project references
```

---

## apps/web

The main Next.js website.

```
apps/web/
├── src/
│   ├── app/                Next.js App Router
│   │   ├── layout.tsx      Root layout (html, body, global styles)
│   │   ├── globals.css     Tailwind CSS entry point
│   │   ├── page.tsx        Home page (/)
│   │   ├── about/          About page (/about)
│   │   ├── team/           Team page (/team)
│   │   ├── projects/       Projects page (/projects)
│   │   └── contact/        Contact page (/contact)
│   ├── components/
│   │   ├── ui/             shadcn/ui primitives
│   │   ├── layout/         Header, footer, nav
│   │   ├── sections/       Page-level sections (hero, etc.)
│   │   └── common/         Shared components used across pages
│   ├── lib/                Sanity client, GROQ queries, utilities (Phase 2+)
│   └── types/              Shared TypeScript types, generated Sanity types
├── eslint.config.mjs       ESLint config (extends @repo/eslint-config/next)
├── next.config.ts          Next.js config
├── postcss.config.mjs      PostCSS config (Tailwind v4)
├── tsconfig.json           Extends @repo/tsconfig/nextjs.json
└── package.json
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

## infra/

Placeholder for future infrastructure work — Dockerfiles, deployment scripts, Terraform/Pulumi.

---

## docs/

| File | Contents |
|------|----------|
| `project-structure.md` | This file |
| `cicd-pipeline.md` | CI/CD pipeline reference |
