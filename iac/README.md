# `iac/` — provider-organized Infrastructure-as-Code

This directory holds everything the chapter provisions in infrastructure — cloud accounts, resource groups, networking, on-prem hosts (eventually), etc.

## Layout

```
iac/
├── azure/        # Azure resources
│   ├── README.md
│   └── bicep/
└── (future: on-prem/, etc.)
```

Each provider directory is self-contained. To stand up a new provider — e.g. on-prem for a Talos/Proxmox lab — add a sibling directory with whatever tool fits that environment (Terraform, Talm, Ansible). The convention is **provider-by-directory**, not **tool-by-directory**, so contributors find Azure things by looking under `azure/` regardless of whether Azure is provisioned via bicep, Terraform, or `az` scripts.

## Deploys are run manually for now

There is no GitHub Actions workflow that deploys `iac/`. The Tech Lead runs the deploy from their devcontainer using the per-provider runbook. This is deliberate while the infrastructure is still small — CI for infra is a planned follow-up. See [`docs/cicd-pipeline.md`](../docs/cicd-pipeline.md) for the eventual story.

## Related

- [`docs/cicd-pipeline.md`](../docs/cicd-pipeline.md) — full pipeline reference
