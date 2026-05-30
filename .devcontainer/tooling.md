# Devcontainer tooling — choices, with sources

Teaching companion to [`mise.toml`](../mise.toml) and [`devcontainer.json`](./devcontainer.json). Explains *why* each non-trivial tool is in the devcontainer, why the version is what it is, and how to bump it during the quarterly rotation.

The mise approach (single source of truth via `mise.toml`, no `RUN` lines in the Dockerfile) was set up before this work and is unchanged. New tools are simply added to the existing `[tools]` table.

---

## What got added and why

| Tool | Pinned version | Purpose | Source for "what's current?" |
|---|---|---|---|
| `python` | 3.12 | Runtime that `pipx` needs to run Azure CLI and `commitizen`, and that `pre-commit` (a Python zipapp) runs on. Comes from mise's `core:python` backend — standalone CPython build, no system Python required. | <https://www.python.org/downloads/> |
| `pipx` | 1.12.0 | Backend that installs Azure CLI and `commitizen` in their own isolated venvs. Comes from mise's aqua backend (`aqua:pypa/pipx`) — single binary install. | <https://github.com/pypa/pipx/releases> |
| `azure` (Azure CLI, `az`) | 2.86.0 | Drive Azure-side IaC (`az deployment sub create`, `az staticwebapp secrets list`). Installed via mise's `pipx:` backend. | <https://github.com/Azure/azure-cli/releases> |
| `pre-commit` | latest | Git hook runner. Drives [`.pre-commit-config.yaml`](../.pre-commit-config.yaml). Installed via mise's `aqua:pre-commit/pre-commit` backend — ships as a Python zipapp (`.pyz`), so it relies on the mise-pinned `python`. | <https://github.com/pre-commit/pre-commit/releases> |
| `commitizen` | latest | Authors conventional commits (`cz commit`) and validates messages via its pre-commit hook (replaces commitlint). Installed via mise's `pipx:` backend. | <https://github.com/commitizen-tools/commitizen/releases> |

---

## Why python + pipx (not uv, not system apt)

Azure CLI is a Python application. Several install paths exist; we picked the one that keeps everything **inside mise** with no system-level prerequisites:

- **`uv` was tempting but blocked.** mise's `uv:` backend requires an experimental flag *and* the underlying `vfox-uv` plugin currently ships without its `metadata.lua` (verified May 2026). It would have been the most modern path; revisit when those land.
- **System apt install** (`curl -sL aka.ms/InstallAzureCLIDeb | sudo bash`) is Microsoft's documented path, but it's outside mise's reach — no version pin, no parity between contributors' machines, and a non-trivial scripts/setup mutation.
- **python + pipx via mise** works today. `python` comes from mise's `core:python` backend (no system Python needed). `pipx` comes from aqua (single binary). Then mise's `pipx:` backend installs Azure CLI in its own isolated venv. Everything is pinned, everything reproduces from `mise install` alone.

The same `python` is reused by `pre-commit` (Python zipapp) and `commitizen` (pipx-installed) — so the ~70 MB python download supports the whole commit-time toolchain, not just Azure CLI.

---

## Why pinned versions (not `latest`)

Two reasons:

1. **Quarterly Tech Lead handoff.** A new contributor opens the devcontainer and gets the same toolchain the previous Tech Lead had. If `latest` pulls a breaking release the day they onboard, the first hour is debugging tools instead of learning.
2. **Reproducible runbooks.** When [`iac/azure/README.md`](../iac/azure/README.md) says "run `az ...`," the exact CLI behavior should match what's documented.

Three outliers use `latest`:

- `turbo = "latest"` — predates this convention.
- `pre-commit = "latest"` — chosen deliberately; the hook framework is low-risk to bump and changes don't affect deploy or runtime behavior.
- `pipx:commitizen = "latest"` — same reasoning as pre-commit; bumps are isolated to commit-authoring/validation flow.

Mise rule of thumb in this repo: anything used to operate live infrastructure (IaC) is pinned; commit-time and dev-loop tooling can be looser.

---

## Bumping versions

Each quarter (per [CONTRIBUTING.md](../CONTRIBUTING.md)'s handoff protocol), the outgoing Tech Lead:

1. **Checks the upstream release pages** (linked in the table above). Note any breaking changes called out in release notes.
2. **Bumps the pin in [`mise.toml`](../mise.toml)** and runs `mise install` locally.
3. **Smoke-tests** by running `az version`, `pre-commit --version`, and `cz version`.
4. **PR the change** as `chore(devcontainer): bump <tool> to <version>` so the diff is clean and reviewable.

For pre-commit's own hook revs (in [`.pre-commit-config.yaml`](../.pre-commit-config.yaml)), run `pre-commit autoupdate` to bump them; commit the result alongside the mise.toml bump.

---

## Mise registry names

The names on the left of `=` in `[tools]` are the canonical mise registry names. A few are non-obvious:

- `azure` (not `azure-cli`) — backed by `pipx:azure-cli`
- `pre-commit` — backed by `aqua:pre-commit/pre-commit` (mise's default). A `pipx:pre-commit` backend is also available but unnecessary, since aqua delivers the official `.pyz` directly.
- `pipx:commitizen` — explicit backend prefix; commitizen has no registry alias, so the `pipx:` prefix tells mise which backend to use.

If a version fails to install (`mise install` errors out), the most common cause is a typo in the tool name. Run `mise registry <name>` to see what backends a name maps to.

Mise registry docs: <https://mise.jdx.dev/registry.html>
