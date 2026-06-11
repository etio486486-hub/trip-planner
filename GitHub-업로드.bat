@echo off
chcp 65001 >nul
title GitHub 업로드
cd /d "%~dp0"

echo.
echo  ==========================================
echo   GitHub에 코드 업로드 (Vercel 배포용)
echo  ==========================================
echo.
echo  GitHub에서 만든 저장소 주소를 입력하세요.
echo  예: https://github.com/내아이디/trip-planner
echo.
set /p REPO_URL="저장소 URL: "

if "%REPO_URL%"=="" (
    echo URL이 비어 있습니다.
    pause
    exit /b 1
)

git add .
git commit -m "여행 플래너 웹앱 초기 배포" 2>nul
if errorlevel 1 (
    echo 변경사항이 없거나 이미 커밋되었습니다.
)

git branch -M main 2>nul

git remote remove origin 2>nul
git remote add origin %REPO_URL%.git 2>nul
if errorlevel 1 git remote set-url origin %REPO_URL%.git

echo.
echo  GitHub에 업로드 중...
git push -u origin main

if errorlevel 1 (
    echo.
    echo  [실패] GitHub 로그인이 필요할 수 있습니다.
    echo  Cursor 왼쪽 Source Control에서 Publish Branch를 사용해 보세요.
) else (
    echo.
    echo  [성공] GitHub 업로드 완료!
    echo  이제 Vercel에서 Deploy를 다시 누르세요.
)

echo.
pause
