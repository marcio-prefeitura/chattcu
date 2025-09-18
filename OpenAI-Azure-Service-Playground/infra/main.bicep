param location string

param stgSku string

param stgName string

param deleteRetentionPolicy object
param containerDeleteRetentionPolicy object
param isVersioningEnabled bool

param stgServicePrincipal object
param stgRoleDefinition object

// Azure Storage that hosts your static web site
resource stg 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  kind: 'StorageV2'
  location: location
  name: stgName
  properties: {
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: true
  }
  sku: {
    name: stgSku
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: stg
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: deleteRetentionPolicy.enabled
      days: deleteRetentionPolicy.days
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: containerDeleteRetentionPolicy.days
    }
    isVersioningEnabled: isVersioningEnabled
  }
}

resource lock 'Microsoft.Authorization/locks@2020-05-01' = {
  scope: stg
  name: '${stgName}-lock'
  properties: {
    level: 'CanNotDelete'
  }
}

resource resourceGroup_roleAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(stgName, stgServicePrincipal.id, stgRoleDefinition.id)
  scope: stg
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      stgRoleDefinition.id
    )
    principalId: stgServicePrincipal.id
    principalType: 'ServicePrincipal'
  }
}

var siteDomain = replace(replace(stg.properties.primaryEndpoints.web, 'https://', ''), '/', '')

// The output will be persisted in .env.{envName}. Visit https://aka.ms/teamsfx-actions/arm-deploy for more details.
output TAB_AZURE_STORAGE_RESOURCE_ID string = stg.id
output TAB_DOMAIN string = siteDomain
output TAB_ENDPOINT string = 'https://${siteDomain}'
