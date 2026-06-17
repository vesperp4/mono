# Glossary

Plain-English definitions for the words and tools you'll meet in this project. No prior
knowledge assumed. If you're brand new, read [onboarding.md](./onboarding.md) first and keep
this open in another tab.

Terms are grouped by topic, then alphabetical within each group.

---

## The big picture

**Frontend** — Everything that runs in the visitor's web browser: the pages, buttons, layout,
and text people see and click. In this repo it's the `web/` app.

**Backend** — A program running on a server (not in the browser) that the frontend talks to
when it needs data or needs to do something private. Visitors never see it directly. In this
repo it's the `api/` app.

**Database** — The system's long-term memory. It stores information permanently, so closing the
browser or restarting the server doesn't lose anything. We use PostgreSQL.

**Server** — A computer (usually in a data center) that runs your code and is reachable over
the internet. "Deploying" means putting our code onto a server so the public can use it.

**Localhost** — Your own computer, referred to from inside itself. `http://localhost:3000`
means "a website running right here on my machine," visible only to you.

**Port** — A numbered "door" on a computer that a program listens on. Our dev website uses port
`3000`, so its address is `localhost:3000`.

**Environment** — A copy of the running system for a particular purpose. *Production* is the
real, public one (vesperp4.com). *Local/dev* is the one on your laptop. Same code, different
place it runs.

**Deploy** — To publish code so it actually runs somewhere people can reach it. For us, merging
to `main` automatically deploys the website.

---

## Version control (Git & GitHub)

**Git** — A tool that records every change made to the code over time. It lets many people work
on the same project at once without overwriting each other, and lets you rewind to any past
state.

**GitHub** — A website that hosts Git repositories online. It's where our code lives, where
Pull Requests happen, and where the automated checks (CI) run.

**Repository (repo)** — A project's folder, tracked by Git, including its full history. Our repo
is called `mono`.

**Monorepo** — One repository that holds multiple related projects (here: the frontend, the
backend, and shared settings) instead of splitting them across many repos.

**Clone** — To download a copy of a repository onto your computer (`git clone <url>`).

**Branch** — Your own parallel copy of the code where you can work freely without affecting
anyone else. You make a branch, do your work, then merge it back. `main` is the primary branch.

**main** — The single source-of-truth branch. It's what gets deployed to the live site. Nobody
edits it directly; changes arrive only through reviewed Pull Requests.

**Commit** — A saved checkpoint of your changes, with a short message describing what changed.
Think of it as a labeled save point you can return to.

**Stage (`git add`)** — Marking which changed files you want to include in your next commit.

**Push** — Uploading your local commits to GitHub so others (and the automation) can see them.

**Pull** — Downloading the latest commits from GitHub onto your computer (`git pull`).

**Pull Request (PR)** — A request to merge your branch into `main`. It's where teammates review
your code and where CI runs its checks before anything is accepted.

**Merge** — Combining one branch's changes into another. When your PR is approved, it gets
merged into `main`.

**Squash merge** — A merge style that collapses all the commits on your branch into a single
clean commit on `main`. It's what we use, to keep history tidy.

**Conventional Commits** — A required format for commit messages: `type: description`
(e.g. `fix: correct nav link`). A hook rejects commits that don't follow it. Types include
`feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `ci`, `build`.

**Hook (Git hook)** — A small script that runs automatically at certain moments — for example,
checking your commit message's format the instant you commit.

---

## The web stack (frontend)

**HTML / CSS / JavaScript** — The three core web languages: HTML is structure (the content),
CSS is styling (how it looks), JavaScript is behavior (what it does).

**TypeScript** — JavaScript plus *types*. You declare what kind of data each thing holds, and a
checker catches mismatches before the code ever runs — eliminating a whole category of bugs.

**Node.js** — A program that runs JavaScript/TypeScript outside the browser. We need it to
build and serve the site during development.

**React** — A library for building user interfaces out of reusable pieces called *components*.

**Component** — A self-contained, reusable piece of UI (a button, a card, a header). You build
pages by combining components.

**Next.js** — The framework built on top of React that we use to make the website. It handles
routing (which URL shows which page), building, and more.

**App Router** — Next.js's system where the folder structure under `app/` defines the site's
URLs. A folder named `about/` with a `page.tsx` becomes the `/about` page.

**Tailwind CSS** — A styling approach where you apply many small utility classes
(`text-center`, `p-4`, `font-bold`) directly in the markup instead of writing separate CSS
files.

**shadcn/ui** — A set of pre-built, customizable UI components (buttons, dialogs, etc.) we use
as building blocks.

**Hot reload** — During `pnpm dev`, saving a file instantly updates the page in your browser —
no manual refresh.

**Sanity** — The CMS (content management system) we'll use so non-developers can edit content
(team roster, projects) without touching code. Mostly Phase 2+.

---

## The backend stack

**Rust** — The programming language the backend `api` is written in. Known for speed and
catching bugs at compile time.

**Axum** — The Rust web framework the `api` uses to handle incoming requests.

**PostgreSQL (Postgres)** — The relational database that stores the site's data permanently.

**sqlx** — The Rust library the backend uses to talk to PostgreSQL.

**API** — "Application Programming Interface." Broadly, the set of requests one program can make
to another. Here, `api` is the backend program the frontend calls to get or change data.

**Cargo** — Rust's build tool and package manager (the Rust equivalent of pnpm + the build
step).

---

## Tooling & build

**pnpm** — Our *package manager*: it downloads and organizes the third-party code (packages)
the project depends on. `pnpm install` sets them up; `pnpm dev` starts the site.

**Package** — A reusable bundle of code published by someone else (or by us internally) that
the project depends on, e.g. `next` or `react`.

**Dependency** — A package your code needs in order to work. They're listed in `package.json`.

**`package.json`** — The file that lists a project's dependencies and its runnable scripts
(like `dev`, `build`, `lint`).

**Lockfile (`pnpm-lock.yaml`)** — An auto-generated file pinning the exact version of every
dependency, so everyone installs identical code. Don't edit it by hand.

**Turbo (Turborepo)** — Runs commands (build, lint, test) across all apps in the monorepo and
caches the results, so repeated runs are fast.

**mise** — A tool-version manager. It reads `mise.toml` and installs the exact versions of
Node, pnpm, Rust, etc., so every contributor's setup matches.

**`mise.toml`** — The file listing every tool and its pinned version for this project.

**Docker** — Software that runs *containers*: isolated, prepackaged mini-environments. Powers
our devcontainer.

**Devcontainer** — A ready-made development environment (built with Docker) that comes with all
the right tools pre-installed. Open the repo "in the container" and you're set up instantly.

**Workspace** — In a monorepo, the set of apps and packages pnpm manages together. Defined in
`pnpm-workspace.yaml`.

---

## Automation & deployment (CI/CD)

**CI (Continuous Integration)** — Automated checks that run on every Pull Request — linting,
type-checking, building, testing — to catch problems before code is merged.

**CD (Continuous Deployment/Delivery)** — Automatically publishing merged code to where it
runs. For us, merging to `main` deploys the website.

**GitHub Actions** — GitHub's built-in automation system. Our CI/CD is defined as "workflows"
in `.github/workflows/`.

**Workflow** — A defined automation job (a YAML file) that runs on triggers like "a PR was
opened" or "code was pushed to `main`."

**Lint / Linter** — A tool that flags style problems and likely mistakes in code without
running it. We use ESLint. Run `pnpm lint`.

**Type-check** — Verifying that all the TypeScript types are consistent. Run `pnpm typecheck`.

**Build** — Turning the source code into the optimized files that actually get served to
visitors. Run `pnpm build`.

**Status check** — A single pass/fail result on a PR (e.g. "Lint passed"). All required checks
must be green before merging.

**Azure** — Microsoft's cloud platform. It hosts our website and backend.

**Azure Static Web Apps (SWA)** — The Azure service that hosts the frontend (`web`). Merged code
is deployed here.

**Azure Container Apps** — The Azure service that will host the backend (`api`) as a running
container.

**Container** — A packaged, self-contained unit holding a program plus everything it needs to
run, so it behaves the same everywhere.

**Infra (Infrastructure as Code)** — Defining cloud resources (servers, databases) in code/
config files instead of clicking buttons in a web console, so the setup is repeatable and
reviewable. Our cloud infrastructure lives in a separate repo.

---

## See also

- [onboarding.md](./onboarding.md) — the hand-holding walkthrough for newcomers.
- [project-structure.md](./project-structure.md) — the full folder map.
- [cicd-pipeline.md](./cicd-pipeline.md) — how the automation pipeline works in detail.
