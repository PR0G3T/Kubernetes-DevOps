Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Build-Image {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)] [string] $ContextPath,
        [Parameter(Mandatory = $true)] [string] $Image
    )

    Write-Host "Building Docker image '$Image' from '$ContextPath'..." -ForegroundColor Cyan
    $dockerfile = Join-Path $ContextPath 'Dockerfile'
    docker build -t $Image -f $dockerfile $ContextPath
    if ($LASTEXITCODE -ne 0) {
        throw "docker build failed"
    }
}

function Deploy-App {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)] [string] $K8sManifestPath,
        [Parameter(Mandatory = $true)] [string] $Image,
        [Parameter(Mandatory = $true)] [string] $DeploymentName,
        [string] $ContainerName = $DeploymentName,
        [string] $Namespace = 'default'
    )

    $resolvedManifest = (Resolve-Path $K8sManifestPath).Path
    $content = Get-Content -Raw -Path $resolvedManifest
    $tempFile = [System.IO.Path]::GetTempFileName()
    # Replace plain text token (avoid regex pitfalls)
    $content = $content.Replace('IMAGE_PLACEHOLDER', $Image)
    Set-Content -Path $tempFile -Value $content -NoNewline

    kubectl apply -n $Namespace -f $tempFile
    if ($LASTEXITCODE -ne 0) {
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
        throw "kubectl apply failed"
    }

    kubectl rollout status deployment/$DeploymentName -n $Namespace --timeout=120s
    if ($LASTEXITCODE -ne 0) {
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
        throw "kubectl rollout status failed"
    }

    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
}

function Logs-App {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)] [string] $DeploymentName,
        [string] $Namespace = 'default'
    )
    kubectl logs -n $Namespace deploy/$DeploymentName -f
}


