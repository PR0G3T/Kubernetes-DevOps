param(
  [string] $Namespace = 'default'
)

. "$PSScriptRoot\..\..\scripts\lib.ps1"

Logs-App -DeploymentName 'todo-server' -Namespace $Namespace


