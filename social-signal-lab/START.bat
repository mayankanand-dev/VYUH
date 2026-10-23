@echo off
setlocal enabledelayedexpansion

:: Ensure Windows System32 and Node.js directories are present in PATH
set "PATH=%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\Wbem;C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%LOCALAPPDATA%\Programs\nodejs;%APPDATA%\npm;%PATH%"

title Social Signal Lab - X Simulator and Disinformation Testbed
cd /d "%~dp0"

echo ============================================================
echo    SOCIAL SIGNAL LAB - X SIMULATOR AND DISINFO TESTBED
echo ============================================================
echo.

:: 1. Verify Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not detected.
    echo Please ensure Node.js is installed from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Verify npm
call npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not detected.
    echo.
    pause
    exit /b 1
)

:: 3. Check dependencies
if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Running npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
)

:: 4. Launch browser
echo [INFO] Launching browser at http://localhost:3000...
start "" "http://localhost:3000"

:: 5. Start Next.js development server
echo [INFO] Starting Next.js development server...
echo.
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [INFO] Server process ended.
    pause
)
