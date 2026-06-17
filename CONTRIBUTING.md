# Contributing to Vesper P4 Website

This guide covers everything you need to contribute to the Vesper P4 website — from first-time setup to quarterly handoff.

---

## Prerequisites

- [Git](https://git-scm.com/)
- [Docker](https://docs.docker.com/get-docker/) (for devcontainer setup)
- [VS Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers), or [DevPod](https://devpod.sh/)

---

## Setup

### Option A: Devcontainer (recommended)

The devcontainer provides a fully configured environment with Node.js, pnpm, and Turbo — no local setup needed.

**VS Code:**

1. Clone the repo and open it in VS Code
2. When prompted, click "Reopen in Container" (or run `Dev Containers: Reopen in Container` from the command palette)
3. Wait for the container to build and `scripts/setup` to finish
4. Run `mise run setup` then `mise run dev`

**DevPod:**

```bash
devpod up /path/to/mono
ssh mono.devpod
mise run setup
mise run dev
```

### Option B: Local setup with mise

If you prefer working outside a container, use [mise](https://mise.jdx.dev) to install the correct tool versions.

```bash
# Install mise
curl https://mise.run | sh

# Activate mise in your shell (add to .bashrc or .zshrc)
eval "$(mise activate bash)"  # or zsh

# Clone and setup
git clone https://github.com/vesperp4/mono.git
cd mono
mise trust && mise install   # install the pinned toolchain
mise run setup               # install dependencies + git hooks
mise run dev                 # start the dev server
```

→ App: [http://localhost:3000](http://localhost:3000)

**`mise` is the front door for every task.** Run `mise tasks` to list them all; the common
ones are `mise run setup`, `mise run dev`, `mise run build`, `mise run format`, and
`mise run check` (runs all CI gates locally). Each task just wraps the underlying tool
(`pnpm`, `cargo`, …), so you can call those directly too.

`mise run setup` also installs the Git hooks. (Devpod users get them wired automatically — the
mise `enter` hook runs `scripts/setup_project` the first time you `cd` into the project.)

> **Note:** Mise downloads tools from GitHub releases, which are rate-limited. If you rebuild containers frequently and hit rate limits, set a `GITHUB_TOKEN` environment variable with a personal access token (no permissions needed).

---

## Personalizing the Devcontainer

You can bring your own dotfiles, shell config, and personal tools into the devcontainer without affecting the project.

**VS Code** — set your dotfiles repo in user settings:

```json
{
  "dotfiles.repository": "github.com/your-username/dotfiles",
  "dotfiles.installCommand": "install.sh"
}
```

**DevPod** — pass your dotfiles repo as a flag:

```bash
devpod up /path/to/mono --dotfiles https://github.com/your-username/dotfiles --dotfiles-script install.sh
```

For personal tools (e.g. neovim, ripgrep), add them to a global mise config in your dotfiles at `~/.config/mise/config.toml`:

```toml
[tools]
neovim = "latest"
ripgrep = "latest"
```

Mise installs these from prebuilt binaries — no package manager needed, works on any base image.

### Creating a Dotfiles Repo

If you don't have a dotfiles repo yet, here's how to set one up.

**1. Create the repo:**

```bash
mkdir ~/dotfiles && cd ~/dotfiles
git init
```

**2. Add a global mise config for your personal tools:**

```bash
mkdir -p .config/mise
```

Create `.config/mise/config.toml`:

```toml
[tools]
neovim = "latest"
# Add any other tools you want: ripgrep, fzf, lazygit, etc.
```

**3. Add an install script:**

Create `install.sh`:

```bash
#!/bin/bash
set -e

# Copy mise config to home
mkdir -p ~/.config/mise
cp .config/mise/config.toml ~/.config/mise/config.toml

# Install personal tools
mise install
```

Make it executable:

```bash
chmod +x install.sh
```

**4. Push it to GitHub:**

```bash
git add -A
git commit -m "initial dotfiles"
git remote add origin https://github.com/your-username/dotfiles.git
git push -u origin main
```

**5. (Optional) Use chezmoi for managing dotfiles:**

As your dotfiles grow, [chezmoi](https://www.chezmoi.io/) helps manage them across machines and containers. It handles templating, secrets, and keeps your home directory in sync with your repo.

To get started with chezmoi:

```bash
# Install chezmoi
sh -c "$(curl -fsLS get.chezmoi.io)"

# Initialize from your dotfiles repo
chezmoi init https://github.com/your-username/dotfiles.git

# Add files to chezmoi's management
chezmoi add ~/.config/mise/config.toml

# Apply your dotfiles
chezmoi apply
```

Your `install.sh` then becomes:

```bash
#!/bin/bash
set -e

mkdir -p ~/.local/bin
curl -fsLS get.chezmoi.io -o /tmp/chezmoi-install.sh
sh /tmp/chezmoi-install.sh -b ~/.local/bin init --apply your-username
mise install
```

---

## Branch Workflow

```
feat/* or fix/*  →  PR to main  →  production
```

- Trunk-based: branch off `main`, open a PR back to `main`
- Use conventional commit prefixes for branch names: `feat/`, `fix/`, `chore/`, `docs/`
- 1 approval required before merging any PR

### Creating a branch

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

### Merge strategy

| Target branch | Merge method     | Why                                              |
| ------------- | ---------------- | ------------------------------------------------ |
| `main`        | Squash and merge | Keeps history clean — one commit per feature/fix |

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
- **ESLint** — run `mise run check` before pushing; CI will catch violations
- **No direct pushes** to `dev` or `main` — always use a PR

---

## CI Checks

Every PR must pass before merging. **Run `mise run check` locally first** — it runs all of
these (plus the Rust gate and workflow/script linting) exactly as CI does, so you catch
failures before pushing.

| Check         | Underlying command                          |
| ------------- | ------------------------------------------- |
| Lint          | `pnpm turbo lint`                           |
| Typecheck     | `pnpm turbo typecheck`                      |
| Format Check  | `pnpm turbo format-check`                   |
| Build         | `pnpm turbo build`                          |
| Dependency audit | `pnpm audit --prod`                      |
| Commit messages | `cz check` validates all commit messages in the PR |

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
