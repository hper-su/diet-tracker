@echo off
cd /d "%~dp0"
if not exist "%~dp0out" (
  echo Static build not found.
  echo Please run rebuild-diet-tracker.bat first.
  pause
  exit /b 1
)
rem out/ を静的配信するだけのローカル確認用。タブレットのオフラインPWAとしての
rem インストールにはこのURLではなくGitHub Pages等のhttps URLが必要(README参照)。
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000/clients"
call npm run serve
pause
