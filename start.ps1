# DharmaGPT Service Launcher
$root = $PSScriptRoot

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "            Starting DharmaGPT Services            " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; & '.\.venv\Scripts\python.exe' -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

Write-Host "Starting Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm.cmd run dev"

Write-Host ""
Write-Host "Both services launched in separate windows!" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan

