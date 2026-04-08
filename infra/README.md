# Infrastructure

IaC for the Vesper P4 website using Azure Bicep.

---

## Structure

```
infra/
└── bicep/
    ├── main.bicep              Subscription-level entry point (creates RG + SWA)
    ├── main.bicepparam         Parameters (region, names)
    └── modules/
        └── swa.bicep           Azure Static Web App resource
```

---

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- Logged in: `az login`
- Bicep CLI: `az bicep install`

---

## Deploy

```bash
az deployment sub create \
  --name vesperp4-deploy \
  --location eastus2 \
  --template-file infra/bicep/main.bicep \
  --parameters infra/bicep/main.bicepparam
```

---

## After Deploying

1. **Get the deployment token** — needed for GitHub Actions CI/CD:
```bash
az staticwebapp secrets list \
  --name vesperp4-web \
  --resource-group vesperp4-rg \
  --query "properties.apiKey" \
  --output tsv
```

2. **Add to GitHub secrets** — `Settings → Secrets → Actions → AZURE_STATIC_WEB_APPS_API_TOKEN`

3. **Configure DNS** — point `vesperp4.com` to the SWA hostname:
   - Get the SWA hostname from the deployment output or Azure Portal
   - Add a `CNAME` record: `vesperp4.com → <swa-hostname>.azurestaticapps.net`
   - Azure will automatically provision a TLS certificate once DNS propagates

---

## Teardown

```bash
az group delete --name vesperp4-rg --yes
```
