Param(
  [int]$Port = 3003
)

Write-Output "Checking port $Port..."
$conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($conns) {
  $procIds = $conns | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
  foreach ($procId in $procIds) {
    if ($procId -ne 0) {
      try {
        Write-Output "Stopping PID $procId on port $Port"
        Stop-Process -Id $procId -Force
      } catch {
        Write-Output ("Failed to stop PID {0}" -f $procId)
      }
    } else {
      Write-Output "Skipping system PID 0"
    }
  }
  Start-Sleep -Milliseconds 400
  Write-Output "Port $Port cleanup completed."
} else {
  Write-Output "Port $Port is free."
}

Write-Output "Starting backend dev server on port $Port..."
npm run dev