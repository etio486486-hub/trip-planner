@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo ========================================
echo  Push trip-planner to GitHub
echo ========================================
echo.

git add -A
git commit -m "trip planner deploy" 2>nul

git remote remove origin 2>nul
git remote add origin https://github.com/etio486486-hub/trip-planner.git

for /f %%h in ('git rev-parse --short HEAD') do set COMMIT=%%h

echo Uploading commit %COMMIT% ...
git push -u origin master:main --force

if errorlevel 1 goto fail

echo.
echo SUCCESS! GitHub main = %COMMIT%
echo.
echo Next: open vercel.com and wait for new deployment from main.
echo Do NOT use Redeploy on old deployments.
echo Production: https://trip-planner-taupe-eta.vercel.app
echo.
pause
exit /b 0

:fail
echo.
echo FAILED - GitHub login may open in browser. Try again after login.
echo.
pause
exit /b 1
