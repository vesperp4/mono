using './main.bicep'

// ---------- Shared ----------

param resourceGroupName = 'vesperp4-rg'
param location = 'eastus2'

// ---------- Static Web App ----------

param swaName = 'vesperp4-web'
param repositoryUrl = 'https://github.com/vesperp4/mono'
param branch = 'main'
