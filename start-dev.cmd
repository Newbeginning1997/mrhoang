@echo off
setlocal

cd /d "%~dp0"

if not exist "package.json" (
  echo Khong tim thay package.json trong thu muc du an.
  pause
  exit /b 1
)

echo Dang chay Mr Hoang English Class tai:
echo http://127.0.0.1:3000/login
echo.

npm.cmd run dev:local

endlocal
