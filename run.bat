@echo off
echo ===================================================
echo             Starting DharmaGPT Services
echo ===================================================
echo.

echo Starting FastAPI Backend on http://localhost:8000 ...
start "DharmaGPT Backend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Starting Vite Frontend on http://localhost:5173 ...
start "DharmaGPT Frontend" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo.
echo Both services are starting in new windows.
echo Frontend URL: http://localhost:5173
echo Backend URL:  http://localhost:8000
echo.

