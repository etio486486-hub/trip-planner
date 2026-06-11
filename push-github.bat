@echo off
cd /d "%~dp0"

echo ========================================
echo  Push trip-planner to GitHub
echo ========================================
echo.

git add -A
git commit -m "trip planner deploy" 2>nul

git remote remove origin 2>nul
git remote add origin https://github.com/etio486486-hub/trip-planner.git

echo Uploading...
git push -u origin master:main --force

if %ERRORLEVEL% NEQ 0 goto fail

echo.
echo SUCCESS!
echo Now open Vercel and click Redeploy.
echo.
pause
exit /b 0

:fail
echo.
echo FAILED - GitHub login window may open in browser.
echo Try again after login.
echo.
pause
exit /b 1
