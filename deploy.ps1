<#
.SYNOPSIS
    EPI-DevorApp local deployment script — mirrors the GitLab CI pipeline.

.DESCRIPTION
    Runs lint, tests, frontend build, and starts the application.
    Requires Docker Desktop (recommended) or Python 3.12 + Node.js 22 installed.

.PARAMETER SkipTests
    Skip backend pytest and frontend vitest (lint still runs).

.PARAMETER Mode
    "docker"  — build and start with docker compose (default)
    "native"  — run backend and frontend directly without Docker

.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -SkipTests
    .\deploy.ps1 -Mode native
    .\deploy.ps1 -Mode native -SkipTests
#>

param(
    [switch]$SkipTests,
    [ValidateSet("docker", "native")]
    [string]$Mode = "docker"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = $PSScriptRoot

function Write-Step { param([string]$Msg) Write-Host "`n==> $Msg" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Msg) Write-Host "    OK: $Msg" -ForegroundColor Green }
function Write-Fail { param([string]$Msg) Write-Host "    FAIL: $Msg" -ForegroundColor Red; exit 1 }

# ─── PREREQUISITES ────────────────────────────────────────────────────────────

Write-Step "Checking prerequisites"

if ($Mode -eq "docker") {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Write-Fail "Docker not found. Install Docker Desktop." }
    $dockerRunning = docker info 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Fail "Docker daemon is not running. Start Docker Desktop." }
    Write-Ok "Docker is available"
} else {
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) { Write-Fail "Python not found. Install Python 3.12+." }
    if (-not (Get-Command poetry -ErrorAction SilentlyContinue)) { Write-Fail "Poetry not found. Run: pip install poetry" }
    if (-not (Get-Command node -ErrorAction SilentlyContinue))   { Write-Fail "Node.js not found. Install Node.js 22+." }
    Write-Ok "Python, Poetry and Node.js found"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Fail "Node.js not found. Install Node.js 22+." }
if (-not (Get-Command npm  -ErrorAction SilentlyContinue)) { Write-Fail "npm not found." }
Write-Ok "Node.js $(node --version), npm $(npm --version)"

# ─── FRONTEND DEPENDENCIES ────────────────────────────────────────────────────

Write-Step "Installing frontend dependencies"
Push-Location "$Root\frontend"
npm ci --prefer-offline
if ($LASTEXITCODE -ne 0) { Write-Fail "npm ci failed" }
Write-Ok "node_modules installed"

# ─── FRONTEND LINT ────────────────────────────────────────────────────────────

Write-Step "Linting frontend (eslint)"
npm run lint
if ($LASTEXITCODE -ne 0) { Write-Fail "Lint failed — fix errors above before deploying" }
Write-Ok "Lint passed"

# ─── FRONTEND TESTS ───────────────────────────────────────────────────────────

if (-not $SkipTests) {
    Write-Step "Running frontend tests (vitest)"
    npm run test
    if ($LASTEXITCODE -ne 0) { Write-Fail "Frontend tests failed" }
    Write-Ok "Frontend tests passed"
}

# ─── FRONTEND BUILD ───────────────────────────────────────────────────────────

Write-Step "Building frontend (Vite)"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Fail "Vite build failed" }
Write-Ok "dist/ generated"
Pop-Location

# ─── BACKEND ──────────────────────────────────────────────────────────────────

if ($Mode -eq "native") {
    Write-Step "Installing backend dependencies (Poetry)"
    Push-Location "$Root\backend"
    poetry install --with dev
    if ($LASTEXITCODE -ne 0) { Write-Fail "poetry install failed" }
    Write-Ok "Backend dependencies installed"

    if (-not $SkipTests) {
        Write-Step "Running backend tests (pytest)"
        poetry run pytest tests/ -v
        if ($LASTEXITCODE -ne 0) { Write-Fail "Backend tests failed" }
        Write-Ok "Backend tests passed"
    }
    Pop-Location
}

# ─── START APPLICATION ────────────────────────────────────────────────────────

if ($Mode -eq "docker") {
    Write-Step "Building and starting with Docker Compose"
    Push-Location $Root
    docker compose up --build
    Pop-Location
} else {
    Write-Step "Starting backend (FastAPI on :8000)"
    Push-Location "$Root\backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "poetry run uvicorn app.main:app --reload --port 8000"
    Pop-Location

    Write-Step "Starting frontend (Vite dev server on :5173)"
    Push-Location "$Root\frontend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Pop-Location

    Write-Host "`nApplication started:" -ForegroundColor Green
    Write-Host "  Frontend : https://localhost:5173" -ForegroundColor White
    Write-Host "  Backend  : http://localhost:8000"  -ForegroundColor White
    Write-Host "  API docs : http://localhost:8000/docs" -ForegroundColor White
}
