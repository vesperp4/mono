# Contributing to Vesper P4 Website

This guide covers everything you need to contribute to the Vesper P4 website — from first-time setup to quarterly handoff.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+ — `npm install -g pnpm`
- [Git](https://git-scm.com/)

---

## Setup

```bash
git clone https://github.com/vesperp4/mono.git
cd mono
pnpm install
pnpm dev
```

→ App: [http://localhost:3000](http://localhost:3000)

The `pnpm install` step also sets up Git hooks via Husky automatically.

---

## Branch Workflow

```
feat/* or fix/*  →  PR to dev  →  staging  →  PR to main  →  production
```

- Always branch off `dev`, never `main`
- Use conventional commit prefixes for branch names: `feat/`, `fix/`, `chore/`, `docs/`
- PRs to `main` must come from `dev` only — CI will reject anything else
- 1 approval required before merging any PR

### Creating a branch

```bash
git checkout dev
git pull origin dev
git checkout -b feat/your-feature-name
```

---

## Commit Messages

This repo enforces [Conventional Commits](https://www.conventionalcommits.org/). The commit-msg hook will reject messages that don't follow the format.

```
type(scope): short description
```

| Type       | When to use                          |
| ---------- | ------------------------------------ |
| `feat`     | New feature or page                  |
| `fix`      | Bug fix                              |
| `chore`    | Dependency updates, config changes   |
| `docs`     | Documentation only                   |
| `style`    | Formatting, no logic change          |
| `refactor` | Code restructure, no behavior change |
| `ci`       | CI/CD workflow changes               |
| `build`    | Build system changes                 |

Examples:

```
feat: add team page
fix(web): correct broken nav link on mobile
chore: update next.js to 16.3.0
docs: add setup instructions to CONTRIBUTING
```

---

## Code Standards

- **TypeScript strict mode** — no `any`, no unused variables
- **ESLint** — run `pnpm turbo lint` before pushing; CI will catch violations
- **No direct pushes** to `dev` or `main` — always use a PR

---

## CI Checks

Every PR must pass before merging:

| Check         | What it runs                                |
| ------------- | ------------------------------------------- |
| Lint          | `pnpm turbo lint`                           |
| Typecheck     | `pnpm turbo typecheck`                      |
| Format Check  | `pnpm turbo format-check`                   |
| Build         | `pnpm turbo build`                          |
| Commitlint    | Validates all commit messages in the PR     |
| Source branch | Rejects PRs to `main` not coming from `dev` |

---

## Quarterly Handoff Protocol

At the end of each quarter, the outgoing Tech Lead must:

1. **Update maintainers table** in `README.md` with incoming leads
2. **Document any in-progress work** — open GitHub issues for anything unfinished
3. **Rotate secrets** — update `AZURE_STATIC_WEB_APPS_API_TOKEN` in GitHub secrets if needed
4. **Tag the release** — create a `v<year>.<quarter>` tag on `main` (e.g. `v2025.Q1`)
5. **Handoff meeting** — walk the incoming Tech Lead through the codebase and open issues

```bash
# Tagging a release
git checkout main
git pull origin main
git tag v2025.Q1
git push origin v2025.Q1
```
