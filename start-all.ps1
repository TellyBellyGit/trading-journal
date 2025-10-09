<#
What I Added 
 
 - start-all.ps1 in the repo root. It brings up Postgres via Docker Compose, 
 waits for readiness, runs Prisma generate and schema push, 
 frees backend port 3003 if needed, then starts both backend and frontend using 
 the root npm run dev . 
 Run It 
 
 - From repo root: powershell -ExecutionPolicy Bypass -File .\start-all.ps1 
 What It Does 
 
 - Starts Postgres ( services.postgres in docker-compose.yml ) and waits for health. 
 - Runs npx --prefix backend prisma generate and npx --prefix backend prisma db push --schema backend/prisma/schema.prisma . 
 - Frees 3003 if a process is listening (so the backend can bind cleanly). 
 - Launches both apps via the existing root script: npm run dev . 
 Prerequisites 
 
 - Docker Desktop installed and running. 
 - backend/.env configured (e.g., DATABASE_URL , OPENAI_API_KEY , etc.). 
 - Node dependencies installed: run npm install , npm --prefix backend install , and npm --prefix frontend install once if not already. 
 Notes 
 
 - If Docker isn’t running, the script stops with an error. 
 - If Prisma fails due to DB initialization timing, just re-run the script after Docker finishes starting. 
 - To change ports, run: powershell -ExecutionPolicy Bypass -File .\start-all.ps1 -BackendPort 3004 -DbPort 5432 .
#>
Param(
  [int]$BackendPort = 3003,
  [int]$DbPort = 5432
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Write-Info($msg) { Write-Host ("[INFO] {0}" -f $msg) -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host ("[WARN] {0}" -f $msg) -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host ("[ERROR] {0}" -f $msg) -ForegroundColor Red }

function Test-DockerReady {
  cmd /c "docker info >nul 2>&1"
  return ($LASTEXITCODE -eq 0)
}

function Start-DockerDesktopIfNeeded {
  Write-Info "Ensuring Docker Desktop is running"
  $dockerCliAvailable = (Get-Command docker -ErrorAction SilentlyContinue) -ne $null
  $defaultPath = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"

  if ($dockerCliAvailable -and (Test-DockerReady)) {
    Write-Info "Docker engine is ready"
    return
  }
  Write-Warn "Docker not ready; attempting to start service/Desktop"

  # Try starting Windows service if present
  $svc = Get-Service -Name 'com.docker.service' -ErrorAction SilentlyContinue
  if ($null -ne $svc -and $svc.Status -ne 'Running') {
    try {
      Start-Service -Name 'com.docker.service'
      Write-Info "Started 'com.docker.service'"
    } catch {
      Write-Warn "Could not start 'com.docker.service' (may require admin)."
    }
  }

  if (Test-Path $defaultPath) {
    try {
      Start-Process -FilePath $defaultPath | Out-Null
      Write-Info "Docker Desktop launch initiated"
    } catch {
      Write-Err "Failed to start Docker Desktop at '$defaultPath'"
      throw "Docker Desktop start failed"
    }
  } else {
    Write-Err "Docker Desktop executable not found at '$defaultPath'"
    throw "Docker Desktop not installed in default location"
  }

  # Wait for engine readiness
  $maxWaitSeconds = 180
  $start = Get-Date
  while ((New-TimeSpan -Start $start -End (Get-Date)).TotalSeconds -lt $maxWaitSeconds) {
    if (Test-DockerReady) {
      Write-Info "Docker engine is ready"
      return
    }
    Start-Sleep -Seconds 3
  }
  Write-Err "Docker engine did not become ready within $maxWaitSeconds seconds"
  throw "Docker engine not ready"
}

function Ensure-DockerComposeUp {
  Write-Info "Starting local Postgres via Docker Compose (service: postgres)"
  $composeSucceeded = $false
  if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
      docker compose up -d | Out-Null
      $composeSucceeded = ($LASTEXITCODE -eq 0)
      if (-not $composeSucceeded) {
        Write-Warn ("'docker compose up' returned non-zero exit code ({0})" -f $LASTEXITCODE)
      }
    } catch {
      Write-Warn "'docker compose' threw an exception, trying legacy 'docker-compose'"
      if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        docker-compose up -d | Out-Null
        $composeSucceeded = ($LASTEXITCODE -eq 0)
        if (-not $composeSucceeded) {
          Write-Warn ("'docker-compose up' returned non-zero exit code ({0})" -f $LASTEXITCODE)
        }
      }
    }
  } else {
    Write-Err "Docker CLI not found. Please install Docker Desktop and ensure it is running."
    throw "Docker not installed"
  }
  if (-not $composeSucceeded) {
    Write-Err "Docker compose failed. Ensure Docker Desktop is running, then re-run the script."
    throw "Docker compose up failed"
  }
}

function Wait-PostgresHealthy {
  Write-Info "Waiting for Postgres container health (container: trading_journal_db)"
  $maxWaitSeconds = 60
  $start = Get-Date
  while ((New-TimeSpan -Start $start -End (Get-Date)).TotalSeconds -lt $maxWaitSeconds) {
    try {
      $status = docker inspect --format "{{.State.Health.Status}}" trading_journal_db 2>$null
      if ($status -eq "healthy") {
        Write-Info "Postgres reported healthy"
        return $true
      }
    } catch {
      # Fallback to port check if health is unavailable
      $tcp = (Get-NetTCPConnection -LocalPort $DbPort -ErrorAction SilentlyContinue)
      if ($tcp) {
        Write-Info "Port $DbPort is listening; proceeding"
        return $true
      }
    }
    Start-Sleep -Seconds 3
  }
  Write-Warn "Postgres health not 'healthy' within timeout; continuing anyway"
  return $false
}

function Ensure-PrismaReady {
  Write-Info "Generating Prisma client"
  cmd /c "npx --prefix backend prisma generate" | Write-Host
  Write-Info "Pushing schema to database"
  cmd /c "npx --prefix backend prisma db push --schema backend/prisma/schema.prisma" | Write-Host
}

function Free-Port($port) {
  Write-Info "Checking port $port occupancy"
  try {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
      $procIds = $conns | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
      foreach ($pid in $procIds) {
        if ($pid -ne 0) {
          Write-Warn ("Stopping PID {0} on port {1}" -f $pid, $port)
          Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
      }
      Start-Sleep -Milliseconds 400
      Write-Info "Port $port cleanup completed"
    } else {
      Write-Info "Port $port is free"
    }
  } catch {
    Write-Warn "Unable to inspect/stop processes on port $port ($_). Continuing."
  }
}

function Start-Apps {
  Write-Info "Starting frontend + backend via root script: npm run dev"
  # This runs both: "npm --prefix backend run dev" and "npm --prefix frontend run dev"
  cmd /c "npm run dev"
}

# Script flow
Write-Info "Repo root: $PSScriptRoot"
Start-DockerDesktopIfNeeded
Ensure-DockerComposeUp
Wait-PostgresHealthy | Out-Null
Ensure-PrismaReady
Free-Port -port $BackendPort
Start-Apps