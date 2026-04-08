@description('Name of the Static Web App')
param name string

@description('Azure region')
param location string

@description('GitHub repository URL')
param repositoryUrl string

@description('Production branch')
param branch string

resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: name
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: branch
    buildProperties: {
      appLocation: 'apps/web'
      outputLocation: '.next'
      skipGithubActionWorkflowGeneration: true
    }
  }
}

resource customDomain 'Microsoft.Web/staticSites/customDomains@2023-12-01' = {
  parent: swa
  name: 'vesperp4.com'
  properties: {
    validationMethod: 'dns-txt-token'
  }
}

output defaultHostname string = swa.properties.defaultHostname
output resourceId string = swa.id
