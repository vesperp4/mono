targetScope = 'subscription'

@description('Name of the resource group')
param resourceGroupName string

@description('Azure region for all resources')
param location string

@description('Name of the Static Web App')
param swaName string

@description('GitHub repository URL')
param repositoryUrl string = 'https://github.com/vesperp4/mono'

@description('Production branch')
param branch string = 'main'

// Resource Group
resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
}

// Static Web App
module swa 'modules/swa.bicep' = {
  name: 'swa'
  scope: rg
  params: {
    name: swaName
    location: location
    repositoryUrl: repositoryUrl
    branch: branch
  }
}

output swaDefaultHostname string = swa.outputs.defaultHostname
output swaResourceId string = swa.outputs.resourceId
