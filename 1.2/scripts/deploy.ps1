param(
  [Parameter(Mandatory = $true)] [string] $Image,
  [string] $Namespace = 'default'
)

. "$PSScriptRoot\..\..\scripts\lib.ps1"

$manifest = (Resolve-Path "$PSScriptRoot\..\k8s\deployment.yaml").Path
Deploy-App -K8sManifestPath $manifest -Image $Image -DeploymentName 'todo-server' -ContainerName 'todo-server' -Namespace $Namespace


