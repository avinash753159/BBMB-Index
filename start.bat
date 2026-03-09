@echo off
title BBMB Dashboard
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo npm install failed.
        pause
        exit /b 1
    )
)

if not exist dist\dashboard-data.json (
    echo Building data...
    call npm run build:data
)

echo Starting BBMB Dashboard...
node launch.mjs
