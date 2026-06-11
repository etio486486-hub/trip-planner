@echo off
chcp 65001 >nul
title 여행 플래너
cd /d "%~dp0"

where npm >nul 2>&1
if errorlevel 1 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo https://nodejs.org 에서 설치 후 다시 실행해 주세요.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo 처음 실행이라 패키지를 설치합니다. 1~2분 걸릴 수 있습니다...
    call npm install
    if errorlevel 1 (
        echo 패키지 설치에 실패했습니다.
        pause
        exit /b 1
    )
)

echo.
echo  ========================================
echo   여행 플래너 서버 시작
echo   브라우저: http://localhost:3000
echo   종료: 이 창을 닫으세요
echo  ========================================
echo.

start "" cmd /c "ping -n 5 127.0.0.1 >nul && start http://localhost:3000"

npm run dev

pause
