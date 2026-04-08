# Vesper P4 — Website

Official website for the [University Name] graduate CS/engineering chapter.

**Production** → [chapter.university.edu](https://chapter.university.edu)
**Staging** → [dev--chapter.azurestaticapps.net](https://dev--chapter.azurestaticapps.net)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| CMS | Sanity v3 |
| Hosting | Azure Static Web Apps |
| Auth (Phase 3) | Microsoft Entra ID (via Azure SWA) |
| CI/CD | GitHub Actions |

---

## Getting Started

Full setup instructions are in [CONTRIBUTING.md](./CONTRIBUTING.md).

Quick version:

```bash
git clone https://github.com/vesperp4/mono.git
cd mono
pnpm install
pnpm dev
```

→ App: [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
apps/
  web/              Main website (Next.js)
    src/
      app/          App Router pages and layouts
      components/   UI components (ui/, layout/, sections/, common/)
      lib/          Sanity client, GROQ queries, utilities
      types/        Shared TypeScript types + generated Sanity types
packages/
  tsconfig/         Shared TypeScript configs (base, nextjs, node)
infra/              Docker, scripts, and IaC (future)
.github/
  workflows/        CI — typecheck + build on push/PR
```

Full reference → [docs/project-structure.md](./docs/project-structure.md)

---

## Development Workflow

```
feat/* or fix/*  →  PR to dev  →  staging  →  PR to main  →  production
```

- Branch off `dev`, never `main`
- Every PR gets an automatic Azure preview URL
- CI must pass (typecheck, build) before merge
- 1 approval required on all PRs

Full pipeline reference → [docs/cicd-pipeline.md](./docs/cicd-pipeline.md)

---

## Content Management

Team roster, projects, and other dynamic content are managed through Sanity Studio (Phase 2+).

- **Deployed Studio** → [chapter-studio.sanity.io](https://chapter-studio.sanity.io)
- Content editors do not need to touch the codebase
- Schema changes require a PR and a `pnpm sanity typegen generate` run

---

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **1** | Public showcase — landing, about, team, projects, contact | 🚧 In progress |
| **2** | Events listing + blog | 📋 Planned |
| **3** | Member portal with Entra ID auth | 📋 Planned |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) — includes setup, branch workflow,
code standards, and the semester handoff protocol.

---

## Maintainers

| Role | Name | GitHub |
|------|------|--------|
| Tech Lead | — | — |
| Design Lead | — | — |
| Faculty Advisor | — | — |

*Update this table each quarter.*

---

## License

[MIT](./LICENSE) — open source, with attribution.
