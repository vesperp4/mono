# Devcontainer tooling — choices, with sources

Teaching companion to [`mise.toml`](../mise.toml) and [`devcontainer.json`](./devcontainer.json). Explains *why* each Azure / Kubernetes tool is in the devcontainer, why the version is what it is, and how to bump it during the quarterly rotation.

The mise approach (single source of truth via `mise.toml`, no `RUN` lines in the Dockerfile) was set up before this work and is unchanged. New tools are simply added to the existing `[tools]` table.

---

## What got added and why

| Tool | Pinned version | Purpose | Source for "what's current?" |
|---|---|---|---|
| `python` | 3.12 | Runtime that `pipx` needs to run Azure CLI. Comes from mise's `core:python` backend — standalone CPython build, no system Python required. | <https://www.python.org/downloads/> |
| `pipx` | 1.12.0 | Backend that installs Azure CLI in its own isolated venv. Comes from mise's aqua backend (`aqua:pypa/pipx`) — single binary install. | <https://github.com/pypa/pipx/releases> |
| `azure` (Azure CLI, `az`) | 2.86.0 | Drive Azure-side IaC (`az deployment sub create`, `az aks get-credentials`, `az staticwebapp secrets list`). Installed via mise's `pipx:` backend. | <https://github.com/Azure/azure-cli/releases> |
| `azure-kubelogin` (`kubelogin`) | 0.2.17 | Exec plugin that lets `kubectl` authenticate to AKS clusters using Entra ID tokens. Required when we move from local admin kubeconfig to per-user Entra ID auth. | <https://github.com/Azure/kubelogin/releases> |
| `kubectl` | 1.36.1 | Standard Kubernetes CLI. Client must be within ±1 minor of the cluster's API server (skew policy). | <https://kubernetes.io/releases/> |
| `helm` | 4.2.0 | Templating + chart management. Used both by humans (lint, template, diff) and inside the cluster by Flux's helm-controller. **Caveat:** Helm 4 was released only weeks before this pin; some older charts may still use Helm 3 quirks. If you hit a chart that doesn't render, try `helm template` first to isolate the issue. | <https://github.com/helm/helm/releases> |
| `flux2` (FluxCD CLI) | 2.8.8 | Used once for `flux bootstrap github`, then occasionally for `flux check`, `flux get`, `flux reconcile`. The in-cluster controllers reconcile automatically without it. | <https://github.com/fluxcd/flux2/releases> |
| `cilium-cli` (`cilium`) | 0.19.4 | Installs Cilium on the BYOCNI cluster ([`gitops/bootstrap/cilium.md`](../gitops/bootstrap/cilium.md)) and runs cluster health checks (`cilium status`, `cilium connectivity test`). | <https://github.com/cilium/cilium-cli/releases> |

---

## Why python + pipx (not uv, not system apt)

Azure CLI is a Python application. Several install paths exist; we picked the one that keeps everything **inside mise** with no system-level prerequisites:

- **`uv` was tempting but blocked.** mise's `uv:` backend requires an experimental flag *and* the underlying `vfox-uv` plugin currently ships without its `metadata.lua` (verified May 2026). It would have been the most modern path; revisit when those land.
- **System apt install** (`curl -sL aka.ms/InstallAzureCLIDeb | sudo bash`) is Microsoft's documented path, but it's outside mise's reach — no version pin, no parity between contributors' machines, and a non-trivial scripts/setup mutation.
- **python + pipx via mise** works today. `python` comes from mise's `core:python` backend (no system Python needed). `pipx` comes from aqua (single binary). Then mise's `pipx:` backend installs Azure CLI in its own isolated venv. Everything is pinned, everything reproduces from `mise install` alone.

Total cost: ~70 MB extra to download `python` once (cached afterwards). Fine for a teaching devcontainer.

---

## Why pinned versions (not `latest`)

Two reasons:

1. **Quarterly Tech Lead handoff.** A new contributor opens the devcontainer and gets the same toolchain the previous Tech Lead had. If `latest` pulls a breaking release the day they onboard, the first hour is debugging tools instead of learning. The pre-existing `turbo = "latest"` predates this convention; new entries are pinned.
2. **Reproducible runbooks.** When [`iac/azure/README.md`](../iac/azure/README.md) or [`gitops/bootstrap/cilium.md`](../gitops/bootstrap/cilium.md) says "run `cilium install ...`," the exact CLI behavior should match what's documented.

Mise rule of thumb in this repo: anything used to operate live infrastructure (cluster, IaC) is pinned; the build-tool versions can be looser.

---

## Bumping versions

Each quarter (per [CONTRIBUTING.md](../CONTRIBUTING.md)'s handoff protocol), the outgoing Tech Lead:

1. **Checks the upstream release pages** (linked in the table above). Note any breaking changes called out in release notes.
2. **Bumps the pin in [`mise.toml`](../mise.toml)** and runs `mise install` locally.
3. **Smoke-tests** by running `az version`, `kubectl version --client`, `helm version`, `flux --version`, `cilium version --client`.
4. **For `kubectl`:** confirm the new client version is within ±1 minor of the AKS cluster's k8s version (see `aksKubernetesVersion` in [`iac/azure/bicep/main.bicepparam`](../iac/azure/bicep/main.bicepparam)). Bump in lock-step if needed.
5. **PR the change** as `chore(devcontainer): bump <tool> to <version>` so the diff is clean and reviewable.

---

## Mise registry names

The names on the left of `=` in `[tools]` are the canonical mise registry names. A few are non-obvious:

- `azure` (not `azure-cli`) — backed by `pipx:azure-cli`
- `azure-kubelogin` (not `kubelogin`) — backed by `aqua:Azure/kubelogin`
- `flux2` (not `flux`) — backed by `aqua:fluxcd/flux2`
- `cilium-cli` (with the `-cli` suffix) — backed by `aqua:cilium/cilium-cli`. The bare `cilium` would refer to the operator, not the user-facing CLI.

If a version fails to install (`mise install` errors out), the most common cause is a typo in the tool name. Run `mise registry <name>` to see what backends a name maps to.

Mise registry docs: <https://mise.jdx.dev/registry.html>

---

## VS Code extensions

Two additions on top of the existing four:

- `ms-kubernetes-tools.vscode-kubernetes-tools` — tree view of cluster resources, kubectl integration, YAML lint against k8s schemas
- `redhat.vscode-yaml` — YAML schema support; pairs with the Kubernetes extension to validate manifests as you type

These are recommendations, not requirements — the devcontainer works without them. They're listed in [`devcontainer.json`](./devcontainer.json) so anyone opening the project in VS Code gets prompted.
