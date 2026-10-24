@echo off
setlocal enabledelayedexpansion

title VYUH + X-Clone Dual Launcher
cd /d "%~dp0"

set "PATH=%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\Wbem;C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%LOCALAPPDATA%\Programs\nodejs;%APPDATA%\npm;%PATH%"

echo =====================================================================
echo          VYUH OSINT PLATFORM ^& X-CLONE DUAL LAUNCHER
echo =====================================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not detected in PATH.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm was not detected in PATH.
    pause
    exit /b 1
)

set "VYUH_DIR=%~dp0"
set "XCLONE_DIR=%~dp0x-clone"

if not exist "%VYUH_DIR%\package.json" (
    if exist "%~dp0alpha\VYUH\package.json" (
        set "VYUH_DIR=%~dp0alpha\VYUH"
        set "XCLONE_DIR=%~dp0alpha\VYUH\x-clone"
    )
)

echo [1/4] Checking project directories...
echo       VYUH Dashboard: %VYUH_DIR%
echo       X Clone:        %XCLONE_DIR%
echo.

echo [2/4] Verifying dependencies...
if not exist "%VYUH_DIR%\node_modules\" (
    echo [INFO] Installing VYUH Dashboard dependencies...
    cd /d "%VYUH_DIR%"
    call npm install
)
if not exist "%XCLONE_DIR%\node_modules\" (
    echo [INFO] Installing X-Clone dependencies...
    cd /d "%XCLONE_DIR%"
    call npm install
)

echo [3/4] Launching services in dedicated terminals...
start "VYUH OSINT Dashboard [Port 3001]" cmd /k "cd /d "%VYUH_DIR%" && title VYUH OSINT Dashboard [Port 3001] && echo Starting VYUH Dashboard on http://localhost:3001... && npm run dev"
start "X-Clone Simulator [Port 3000]" cmd /k "cd /d "%XCLONE_DIR%" && title X-Clone Simulator [Port 3000] && echo Starting X-Clone on http://localhost:3000... && npm run dev"

echo [4/4] Opening browser tabs...
timeout /t 3 /nobreak >nul 2>&1
start "" "http://localhost:3001"
start "" "http://localhost:3000"

echo.
echo =====================================================================
echo  SERVICES RUNNING:
echo    * VYUH OSINT Dashboard: http://localhost:3001
echo    * X-Clone Simulator:     http://localhost:3000
echo =====================================================================
echo.
echo Press any key to exit this launcher window...
pause >nul
