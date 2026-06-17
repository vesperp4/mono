# Onboarding — Start Here

Welcome to the Vesper P4 website team! 👋

This guide assumes **you have never worked on a project like this before**. Maybe this is
your first time using Git, your first time touching a real codebase, or your first time
hearing half of these words. That's exactly who this page is for. We'll go slowly, explain
every term, and get you from "I just joined" to "I shipped my first change" without skipping
steps.

If a word looks unfamiliar, it's probably in the [Glossary](./glossary.md). Keep that tab
open.

> **The golden rule for newcomers:** you cannot break production by experimenting on your own
> computer or on your own branch. Everything you do locally is a sandbox. The only way changes
> reach the live website is through a reviewed Pull Request that the team approves. So relax
> and click around.

---

## 1. What are we building?

We're building [**vesperp4.com**](https://vesperp4.com) — the official website for the Vesper
P4 graduate CS/engineering chapter.

A modern website is not one single program. It's a few pieces that work together. Here's the
whole system in plain language:

```
   A visitor opens vesperp4.com in their browser
                     │
                     ▼
        ┌──────────────────────────┐
        │   web  (the "frontend")  │   The pages people see and click.
        │   Next.js + React        │   Built with TypeScript.
        └──────────────────────────┘
                     │  asks for data when it needs it
                     ▼
        ┌──────────────────────────┐
        │   api  (the "backend")   │   A program that answers questions
        │   Rust + Axum            │   like "who's on the team?"
        └──────────────────────────┘
                     │  reads / writes
                     ▼
        ┌──────────────────────────┐
        │   db  (the database)     │   Where information is stored
        │   PostgreSQL             │   permanently.
        └──────────────────────────┘
```

- **Frontend** = everything that runs in the visitor's browser. The buttons, the layout, the
  colors, the text. This is the part most new contributors start with.
- **Backend** = a program running on a server that the frontend talks to when it needs data
  or needs to do something private (like checking a password). Visitors never see it directly.
- **Database** = long-term memory. Close the browser, restart the server — the data is still
  there.

For **Phase 1** (where we are now), the website is mostly frontend. The backend and database
exist but are still being wired up. **So if you're new, you'll almost certainly be working in
`web/`.**

---

## 2. What is a "monorepo"?

This project is a **monorepo** — short for "mono repository". It means *all* the pieces (the
frontend, the backend, shared settings) live in **one** Git repository instead of being
scattered across many.

Think of it like a single backpack with labeled pockets, rather than three separate bags you
have to keep track of:

```
mono/                  ← the whole backpack (the repository)
├── apps/
│   └── mainsite/
│       ├── web/       ← the frontend (Next.js) — you'll spend most time here
│       └── api/       ← the backend (Rust)
├── packages/          ← settings shared by multiple apps
├── docs/              ← documentation (you're reading one of these)
└── ...config files...
```

Why one repo? So a single change can update the frontend and backend together, and so everyone
shares the exact same settings. You don't need to understand all of it — just know that when
someone says "the repo," they mean this whole folder.

A more detailed map is in [project-structure.md](./project-structure.md). Come back to it once
you've done your first change.

---

## 3. The tools, in one sentence each

You'll see these names everywhere. You don't need to master them — here's just enough to not
feel lost. (Fuller definitions are in the [Glossary](./glossary.md).)

| Name | What it is, in one sentence |
| --- | --- |
| **Git** | Tracks every change to the code and lets many people work without overwriting each other. |
| **GitHub** | A website that hosts our Git repository online and runs our automated checks. |
| **Node.js** | The engine that runs JavaScript/TypeScript code outside a browser (needed to build the site). |
| **pnpm** | Downloads and manages the third-party code packages our project depends on. |
| **TypeScript** | JavaScript with type-checking — it catches a whole class of bugs before you even run the code. |
| **Next.js / React** | The framework we use to build the web pages. |
| **Tailwind CSS** | A way to style pages by adding small classes like `text-center` directly in the markup. |
| **Turbo (Turborepo)** | Runs build/test commands across the monorepo and caches results so they're fast. |
| **mise** | Installs the *exact* versions of all the tools above so everyone's setup matches. |
| **Rust / Axum** | The language and framework the backend `api` is written in. |
| **PostgreSQL** | The database that stores data permanently. |

The key idea: **mise installs the tools, pnpm installs the code those tools need, and
Turbo runs everything.**

---

## 4. Setting up your computer

There are two paths. **Pick one.** If you're not sure, and you have VS Code, use Path A.

### Path A — Devcontainer (most beginner-proof)

A **devcontainer** is a ready-made, disposable computer-inside-your-computer that already has
every tool installed at the right version. You don't install Node, pnpm, or anything else —
it's all in the box. If it ever gets messed up, you throw it away and rebuild it in minutes.

You need:

1. [**Docker**](https://docs.docker.com/get-docker/) — the program that runs containers.
2. [**VS Code**](https://code.visualstudio.com/) — the code editor.
3. The [**Dev Containers** extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
   for VS Code.

Then:

1. Clone the repo (download a copy onto your computer):
   ```bash
   git clone https://github.com/vesperp4/mono.git
   cd mono
   ```
2. Open the `mono` folder in VS Code.
3. A popup appears in the bottom-right: **"Reopen in Container."** Click it. (If you miss it,
   press `F1`, type "Reopen in Container," and hit Enter.)
4. Wait. The first build takes a few minutes — it's downloading the box. Later opens are fast.
5. When it's done, open a terminal inside VS Code (`` Ctrl+` ``) and run:
   ```bash
   pnpm install
   pnpm dev
   ```

Jump to [section 5](#5-run-the-website-on-your-own-computer).

### Path B — Local setup with mise

If you'd rather not use Docker, [**mise**](https://mise.jdx.dev) installs the correct tool
versions directly on your machine.

```bash
# 1. Install mise
curl https://mise.run | sh

# 2. Turn mise on in your shell. Add this line to ~/.bashrc (or ~/.zshrc),
#    then close and reopen your terminal:
eval "$(mise activate bash)"     # use "zsh" instead of "bash" if you use zsh

# 3. Get the code and the tools
git clone https://github.com/vesperp4/mono.git
cd mono
mise trust && mise install       # reads mise.toml, installs every pinned tool

# 4. Install the project's code dependencies, then start it
pnpm install
pnpm dev
```

> **What is `mise.toml`?** It's a file in the repo that lists every tool and its exact version
> (Node 22, pnpm 10.33.0, and so on). `mise install` reads it and sets all of them up so your
> machine matches everyone else's. No more "but it works on my computer."

The full setup reference (devcontainer personalization, dotfiles, Git hooks) lives in
[CONTRIBUTING.md](../CONTRIBUTING.md).

---

## 5. Run the website on your own computer

After `pnpm dev` finishes starting up, you'll see a line like:

```
  ▲ Next.js 16
  - Local:   http://localhost:3000
```

Open **http://localhost:3000** in your browser. That's the website, running entirely on your
machine. `localhost` means "this computer," and `3000` is the port number Next.js listens on.

This is your sandbox. Now try this:

1. Open `apps/mainsite/web/src/app/page.tsx` in your editor.
2. Find some visible text and change it.
3. Save the file.
4. Look back at your browser — **it updates instantly**, no refresh needed. That's called
   *hot reload*, and it's how you'll see your work as you go.

When you're done, stop the server with `Ctrl+C` in the terminal.

You just edited the website. Nothing you did here affects the real vesperp4.com — it's all
local. 🎉

---

## 6. Where do things live? (a quick tour)

You don't need to memorize this. Use it as a "where do I go to change X?" lookup.

```
apps/mainsite/web/src/
├── app/                  ← the PAGES of the site, one folder per URL
│   ├── page.tsx          → the home page  (vesperp4.com/)
│   ├── about/page.tsx    → the about page (vesperp4.com/about)
│   ├── team/page.tsx     → the team page  (vesperp4.com/team)
│   ├── layout.tsx        → the shell wrapped around every page (header, footer)
│   └── globals.css       → site-wide styling
├── components/           ← reusable building blocks
│   ├── ui/               → small primitives (buttons, cards)
│   ├── layout/           → header, footer, nav
│   ├── sections/         → big page chunks (hero banner, etc.)
│   └── common/           → bits shared across pages
├── lib/                  → helper code and data-fetching (mostly Phase 2+)
└── types/                → shared TypeScript type definitions
```

Rules of thumb:

- **Want to change what a page says?** Edit that page's `page.tsx` under `app/`.
- **Adding a new page?** Make a new folder under `app/` with a `page.tsx` inside. The folder
  name becomes the URL.
- **Reusing a piece (a button, a card) in many places?** Put it in `components/`.

The backend lives in `apps/mainsite/api/` (Rust). Most newcomers won't touch it for a while —
that's fine.

---

## 7. How we work: branches, commits, and Pull Requests

This is the part that feels most foreign at first, so we'll go slow. This is the **workflow**
every contributor follows, every time.

### The mental model

`main` is the **one true copy** of the project — what becomes the live website. **Nobody edits
`main` directly.** Instead, you:

1. Make your own copy to experiment on (a **branch**).
2. Do your work and save checkpoints (**commits**).
3. Ask the team to review and merge your work into `main` (a **Pull Request**).

```
main ──●──────────────────────────────●──►   (the protected, live version)
        \                            /
         ●──●──●  your branch       /         (your safe sandbox)
         "feat/add-team-photo"  ───┘
              (commits)        (Pull Request merges it back)
```

### Step by step — your first contribution

Say you want to fix a typo on the about page.

**1. Start from a fresh, up-to-date `main`:**

```bash
git checkout main           # switch to the main branch
git pull origin main        # download the latest version from GitHub
```

**2. Create a branch to work on.** Name it with a prefix that says what kind of change it is
(`feat/` for a new feature, `fix/` for a bug fix, `docs/` for docs):

```bash
git checkout -b fix/about-page-typo
```

You're now on your own branch. Nothing you do here touches `main`.

**3. Make your change** in the editor and save.

**4. See what you changed:**

```bash
git status        # lists which files you touched
git diff          # shows the exact lines you changed
```

**5. Save a checkpoint (a commit).** First *stage* the file (mark it to be saved), then commit
it with a message:

```bash
git add apps/mainsite/web/src/app/about/page.tsx
git commit -m "fix: correct typo on about page"
```

> **Commit messages have a required format** called
> [Conventional Commits](https://www.conventionalcommits.org/): `type: description`. The repo
> will **reject** a commit that doesn't follow it (a "hook" checks automatically). Use `feat:`,
> `fix:`, `chore:`, `docs:`, `style:`, `refactor:`, `ci:`, or `build:`. See the table in
> [CONTRIBUTING.md](../CONTRIBUTING.md#commit-messages).

**6. Upload your branch to GitHub:**

```bash
git push -u origin fix/about-page-typo
```

**7. Open a Pull Request (PR).** A PR is a request that says "please review my branch and merge
it into `main`." Go to the repo on GitHub — it'll show a green **"Compare & pull request"**
button. Click it, write a short description of what you did and why, and submit.

**8. Wait for the checks and a review.** When you open a PR, GitHub automatically runs our
**CI** ("continuous integration") — a robot that lints, type-checks, and builds your code to
make sure nothing's broken. You'll see green checkmarks ✅ or red X's ❌. A teammate also
reviews your code (we require **1 approval**). If they ask for changes, just make more commits
on the same branch and push again — the PR updates automatically.

**9. Merge.** Once checks pass and you have approval, the PR is **squash-merged** into `main`
(all your commits become one tidy commit). From there, the deploy pipeline automatically
publishes the new version to vesperp4.com. 🚀

That's the entire loop. Every change — yours, a senior dev's, a typo fix, a whole new feature —
goes through these same nine steps.

A deeper reference on branches, merge strategy, and the commit format is in
[CONTRIBUTING.md](../CONTRIBUTING.md).

---

## 8. Useful commands

Run these from the root `mono/` folder.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the website locally with hot reload. |
| `pnpm build` | Build the production version (what CI does). Good for catching build errors. |
| `pnpm lint` | Check the code style. CI runs this — run it before pushing. |
| `pnpm typecheck` | Check that all the TypeScript types line up. |
| `pnpm format` | Auto-format your code so it matches the project style. |

If you set up with mise, you can also run `mise tasks` to see the project's local check
commands (they mirror exactly what CI runs, so you can catch problems before opening a PR).

---

## 9. When something breaks

Breaking things is part of learning. Here's how to get unstuck.

- **A command "isn't found" (e.g. `pnpm: command not found`).** Your tools aren't active.
  In a devcontainer, make sure you reopened *in the container*. With mise, make sure you ran
  `eval "$(mise activate bash)"` and reopened your terminal.
- **`pnpm dev` errors about missing packages.** Run `pnpm install` first.
- **Your commit got rejected with a message about format.** Your commit message doesn't match
  Conventional Commits. Redo it: `git commit -m "fix: ..."`.
- **CI is red on your PR.** Click "Details" next to the failing check on GitHub — it tells you
  exactly which step failed. Often it's lint or types. Fix it locally (`pnpm lint`,
  `pnpm typecheck`), commit, and push again.
- **Totally lost / scared you broke something.** You almost certainly didn't — `main` is
  protected. Worst case, you can throw your branch away and start over from a clean `main`.
  When in doubt, **ask the team.** Everyone here was new once.

---

## 10. Where to go next

You now know enough to contribute. When you're ready for more depth:

- [**Glossary**](./glossary.md) — plain-English definitions of every term and tool.
- [**CONTRIBUTING.md**](../CONTRIBUTING.md) — full setup, devcontainer customization, branch &
  commit rules.
- [**project-structure.md**](./project-structure.md) — the complete map of every folder.
- [**cicd-pipeline.md**](./cicd-pipeline.md) — how code automatically gets tested and deployed
  (read this once you're curious about the "robots").

Welcome aboard. Make something, open a PR, and don't be afraid to ask questions. 🚀
