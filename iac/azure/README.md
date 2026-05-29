# `iac/azure/` — Azure deploy runbook

Bicep templates that provision the chapter's Azure resources, starting with the Static Web App that serves the website.

## Structure

```
iac/azure/
└── bicep/
    ├── main.bicep              Subscription-level entry point (RG + SWA)
    ├── main.bicepparam         Pinned parameter values
    └── modules/
        └── swa.bicep           Azure Static Web App
```

## Prerequisites

The devcontainer already has these installed via `mise.toml`. If you're working outside the devcontainer:

- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) — `az` (logged in: `az login`)
- Bicep CLI — `az bicep install`

## Deploy

The entry point is `main.bicep` at subscription scope (it creates the RG plus everything inside it):

```bash
az deployment sub create \
  --name vesperp4-deploy \
  --location eastus2 \
  --template-file iac/azure/bicep/main.bicep \
  --parameters iac/azure/bicep/main.bicepparam
```

This is idempotent — re-running it converges any drift back to what's declared in the bicep. Safe to run after editing any parameter.

## After deploying — SWA

These are one-time steps the first time the SWA is created.

1. **Retrieve the deployment token** for GitHub Actions:
   ```bash
   az staticwebapp secrets list \
     --name vesperp4-web \
     --resource-group vesperp4-rg \
     --query "properties.apiKey" \
     --output tsv
   ```

2. **Store as GitHub secret** at `Settings → Secrets → Actions → AZURE_STATIC_WEB_APPS_API_TOKEN`.

3. **DNS** — point `vesperp4.com` to the SWA hostname:
   - Get the SWA hostname from the deployment output (`swaDefaultHostname`) or Azure Portal.
   - Add a `CNAME` record: `vesperp4.com → <swa-hostname>.azurestaticapps.net`.
   - Azure provisions a TLS cert once DNS propagates.

## Teardown

To destroy everything (irreversible):

```bash
az group delete --name vesperp4-rg --yes
```

This deletes the SWA and the resource group itself. The DNS record at the registrar is unaffected and must be removed separately.

## Refs

- Bicep deployment commands: <https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/deploy-cli>

