@echo off
title Upload Campus Bus Tracker to GitHub
color 0B
echo =======================================================================
echo     UPLOADING CAMPUS BUS TRACKER TO GITHUB
echo     Target: https://github.com/devanshukondalkar17/campus-bus-tracker
echo =======================================================================
echo.

cd /d "%~dp0"

echo [1/5] Checking Git installation...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in your PATH. Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo [2/5] Initializing Git repository...
if not exist ".git" (
    git init
)

echo [3/5] Staging files...
git add .

echo [4/5] Committing changes...
git commit -m "Initial commit: Navrachana University Real-Time AI Transit & Fleet Operations Engine"

echo [5/5] Configuring remote and pushing to main branch...
git branch -M main

:: Check if origin remote already exists
git remote get-url origin >nul 2>nul
if %errorlevel% equ 0 (
    echo Updating origin remote URL...
    git remote set-url origin https://github.com/devanshukondalkar17/campus-bus-tracker.git
) else (
    echo Adding origin remote URL...
    git remote add origin https://github.com/devanshukondalkar17/campus-bus-tracker.git
)

echo.
echo Pushing code to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo =======================================================================
    echo [SUCCESS] Code successfully uploaded to:
    echo https://github.com/devanshukondalkar17/campus-bus-tracker
    echo =======================================================================
) else (
    echo.
    echo If GitHub rejected because of existing remote commits or README, syncing:
    git pull origin main --rebase --allow-unrelated-histories
    git push -u origin main
)

echo.
pause
