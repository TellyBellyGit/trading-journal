@echo off
REM Start Docker Desktop (safe even if already running)
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

REM Run the root PowerShell startup script
powershell.exe -ExecutionPolicy Bypass -File .\start-all.ps1