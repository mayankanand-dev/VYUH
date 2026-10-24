@echo off
title Stop VYUH and X-Clone Services
echo =====================================================================
echo          STOPPING VYUH AND X-CLONE SERVERS (PORTS 3000 & 3001)
echo =====================================================================
echo.

for %%P in (3000 3001) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%P ^| findstr LISTENING') do (
        echo [INFO] Stopping process on port %%P (PID: %%a)...
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo [DONE] All services on ports 3000 and 3001 have been stopped.
timeout /t 2 >nul 2>&1
