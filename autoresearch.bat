@echo off
title BBMB Autoresearch Loop
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

echo.
echo ============================================
echo   BBMB Autoresearch - Karpathy-style Loop
echo ============================================
echo.
echo This will launch Claude Code to run the
echo autonomous Lighthouse improvement loop
echo defined in program.md.
echo.
echo Press Ctrl+C to stop at any time.
echo.

claude -p "Read program.md. You are on branch autoresearch/mar8. Read results.tsv to see past experiments. Run the evaluation pipeline to establish a fresh baseline, then begin the experiment loop. NEVER STOP. Run indefinitely until manually stopped."
