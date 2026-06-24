[CmdletBinding()]
param(
    [switch]$Install
)

$ErrorActionPreference = 'Stop'

$projectRoot = $PSScriptRoot
$backendPath = Join-Path $projectRoot 'backendBallqish'
$frontendPath = Join-Path $projectRoot 'frontendBallqish'

function Write-Step {
    param([string]$Message)

    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-Command {
    param(
        [string]$Name,
        [string]$InstallHint
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "'$Name' tidak ditemukan. $InstallHint"
    }
}

function Invoke-Checked {
    param(
        [string]$Command,
        [string[]]$Arguments
    )

    & $Command @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw "Perintah gagal: $Command $($Arguments -join ' ')"
    }
}

function Invoke-ComposerChecked {
    param([string[]]$Arguments)

    $composer = Get-Command composer -ErrorAction SilentlyContinue
    if (-not $composer) {
        throw "'composer' tidak ditemukan. Pasang Composer dan tambahkan ke PATH."
    }

    $composerPath = $composer.Source
    $composerExtension = [System.IO.Path]::GetExtension($composerPath)

    if ($composerExtension -eq '' -or $composerExtension -eq '.phar') {
        Invoke-Checked -Command 'php' -Arguments (@($composerPath) + $Arguments)
        return
    }

    Invoke-Checked -Command 'composer' -Arguments $Arguments
}

if (-not (Test-Path (Join-Path $backendPath 'artisan'))) {
    throw "Folder backend tidak ditemukan: $backendPath"
}

if (-not (Test-Path (Join-Path $frontendPath 'package.json'))) {
    throw "Folder frontend tidak ditemukan: $frontendPath"
}

Assert-Command -Name 'php' -InstallHint 'Pasang PHP 8.2 atau lebih baru dan tambahkan ke PATH.'
Assert-Command -Name 'composer' -InstallHint 'Pasang Composer dan tambahkan ke PATH.'
Assert-Command -Name 'node' -InstallHint 'Pasang Node.js dan tambahkan ke PATH.'
Assert-Command -Name 'npm' -InstallHint 'Pasang npm dan tambahkan ke PATH.'

$cachePath = Join-Path $backendPath 'bootstrap\cache'
if (-not (Test-Path $cachePath)) {
    Write-Step 'Membuat direktori runtime Laravel'
    New-Item -ItemType Directory -Path $cachePath -Force | Out-Null
}

$autoloadPath = Join-Path $backendPath 'vendor\autoload.php'
if ($Install -or -not (Test-Path $autoloadPath)) {
    Write-Step 'Memasang dependency backend'
    Push-Location $backendPath
    try {
        Invoke-ComposerChecked -Arguments @('install', '--no-interaction')
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host 'Dependency backend sudah tersedia.'
}

$envPath = Join-Path $backendPath '.env'
$envExamplePath = Join-Path $backendPath '.env.example'
if (-not (Test-Path $envPath)) {
    Write-Step 'Membuat konfigurasi backend dari .env.example'
    Copy-Item -LiteralPath $envExamplePath -Destination $envPath
}

$appKey = Get-Content -LiteralPath $envPath |
    Where-Object { $_ -match '^APP_KEY=' } |
    Select-Object -First 1

if (-not $appKey -or $appKey -eq 'APP_KEY=') {
    Write-Step 'Membuat Laravel application key'
    Push-Location $backendPath
    try {
        Invoke-Checked -Command 'php' -Arguments @('artisan', 'key:generate', '--force')
    }
    finally {
        Pop-Location
    }
}

$nextBinary = Join-Path $frontendPath 'node_modules\.bin\next.cmd'
if ($Install -or -not (Test-Path $nextBinary)) {
    Write-Step 'Memasang dependency frontend'
    Push-Location $frontendPath
    try {
        if (Test-Path (Join-Path $frontendPath 'package-lock.json')) {
            Invoke-Checked -Command 'npm' -Arguments @('ci')
        }
        else {
            Invoke-Checked -Command 'npm' -Arguments @('install')
        }
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host 'Dependency frontend sudah tersedia.'
}

Write-Step 'Menjalankan backend pada http://localhost:8080'
$escapedBackendPath = $backendPath.Replace("'", "''")
$backendCommand = "Set-Location -LiteralPath '$escapedBackendPath'; php artisan serve --host=0.0.0.0 --port=8080"
$backendProcess = Start-Process `
    -FilePath 'powershell.exe' `
    -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $backendCommand) `
    -WorkingDirectory $backendPath `
    -PassThru

Write-Step 'Menjalankan frontend pada http://localhost:3000'
$escapedFrontendPath = $frontendPath.Replace("'", "''")
$frontendCommand = "Set-Location -LiteralPath '$escapedFrontendPath'; npm run dev"
$frontendProcess = Start-Process `
    -FilePath 'powershell.exe' `
    -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $frontendCommand) `
    -WorkingDirectory $frontendPath `
    -PassThru

Write-Host ''
Write-Host 'Project sedang dijalankan:' -ForegroundColor Green
Write-Host '  Frontend: http://localhost:3000'
Write-Host '  Backend : http://localhost:8080/api'
Write-Host '  Mobile emulator API: http://10.0.2.2:8080/api'
Write-Host ''
Write-Host "Backend PID: $($backendProcess.Id), Frontend PID: $($frontendProcess.Id)"
Write-Host 'Tutup kedua jendela server untuk menghentikan project.'
