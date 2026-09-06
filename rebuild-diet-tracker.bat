@echo off
cd /d "%~dp0"
call npm run build
echo.
echo Build finished. You can close this window.
pause
