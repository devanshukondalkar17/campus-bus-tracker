@echo off
title Navrachana University (NUV) Transit AI - Operations Engine
color 0B
echo =======================================================================
echo          NAVRACHANA UNIVERSITY (NUV) TRANSIT AI
echo     Real-Time AI Dispatch & Fleet Operations Engine (Vadodara)
echo =======================================================================
echo.
echo [1/3] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [2/3] Starting Backend Server (Port 5000) & Vite Frontend (Port 5173)...
echo.
echo Backend API URL:    http://localhost:5000/api/fleet/overview
echo Frontend Client:    http://localhost:5173
echo.
echo Press Ctrl+C at any time to stop the servers.
echo =======================================================================
echo.

cd /d "%~dp0"

start "NUV Backend Server (Port 5000)" "%~dp0start-server.bat"
timeout /t 2 /nobreak >nul

start "NUV Frontend Client (Port 5173)" "%~dp0start-client.bat"
timeout /t 3 /nobreak >nul

echo [3/3] Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo Both servers are now running in separate terminal windows!
pause
