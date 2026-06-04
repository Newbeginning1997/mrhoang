@echo off
setlocal

cd /d "%~dp0"

if not exist "package.json" (
  echo Khong tim thay package.json trong thu muc du an.
  pause
  exit /b 1
)

echo Port 3000 dang ban thi dung file nay.
echo Dang chay Mr Hoang English Class tai:
echo http://127.0.0.1:3001/login
echo.

npm.cmd run dev:local:3001

endlocal
