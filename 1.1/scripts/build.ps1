param(
  [Parameter(Mandatory = $true)] [string] $Image
)

. "$PSScriptRoot\..\..\scripts\lib.ps1"

$context = (Resolve-Path "$PSScriptRoot\..\").Path
Build-Image -ContextPath $context -Image $Image


