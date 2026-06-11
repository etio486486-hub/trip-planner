@echo off
chcp 65001 >nul
title 여행 플래너 - Vercel 배포
cd /d "%~dp0"

where npx >nul 2>&1
if errorlevel 1 (
    echo Node.js가 필요합니다.
    pause
    exit /b 1
)

echo.
echo  Vercel 배포를 시작합니다.
echo  브라우저에서 Vercel 로그인 창이 열릴 수 있습니다.
echo.
echo  환경 변수는 배포 후 Vercel 대시보드에서도 설정할 수 있습니다:
echo    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
echo    NEXT_PUBLIC_SUPABASE_URL
echo    NEXT_PUBLIC_SUPABASE_ANON_KEY
echo.

npx vercel --prod

echo.
pause
