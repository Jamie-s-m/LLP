@echo off
setlocal enabledelayedexpansion

echo ================================
echo LinguaNest Production Deployment
echo ================================
echo.

REM Check if in project root
if not exist "package.json" (
    echo [ERROR] Not in project root directory
    exit /b 1
)

echo [1/6] Running backend tests...
cd backend
call npm test
if errorlevel 1 (
    echo [ERROR] Backend tests failed. Fix tests before deploying.
    cd ..
    exit /b 1
)
cd ..
echo [OK] Backend tests passed
echo.

echo [2/6] Building frontend...
cd frontend
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    cd ..
    exit /b 1
)
cd ..
echo [OK] Frontend built successfully
echo.

echo [3/6] Checking git status...
git status --short
echo.

echo [4/6] Pre-deployment checklist:
echo   - Backend tests: PASSED
echo   - Frontend build: SUCCESS
echo   - Ready for deployment
echo.

set /p DEPLOY_FRONTEND="Deploy frontend to GitHub Pages? (y/n): "
if /i "%DEPLOY_FRONTEND%"=="y" (
    echo [5/6] Deploying frontend to GitHub Pages...
    cd frontend
    call npm run deploy
    if errorlevel 1 (
        echo [ERROR] Frontend deployment failed
        cd ..
        exit /b 1
    )
    cd ..
    echo [OK] Frontend deployed successfully
    echo.
) else (
    echo [SKIP] Frontend deployment skipped
    echo.
)

echo [6/6] Preparing backend deployment...
echo.
echo Backend Deployment Instructions:
echo ================================
echo 1. Commit your changes: git add . ^&^& git commit -m "Production ready"
echo 2. Push to main: git push origin main
echo 3. Render will automatically deploy
echo 4. Configure environment variables on Render dashboard
echo.
echo Render Environment Variables Required:
echo - NODE_ENV=production
echo - MONGODB_URI=(your MongoDB Atlas connection)
echo - JWT_SECRET=(generate with: openssl rand -base64 64)
echo - FRONTEND_URL=(your GitHub Pages URL)
echo - FRONTEND_APP_URL=(your GitHub Pages URL + /LLP)
echo.

set /p COMMIT_PUSH="Commit and push changes now? (y/n): "
if /i "%COMMIT_PUSH%"=="y" (
    git add .
    git commit -m "Production deployment - All tasks complete"
    git push origin main
    echo [OK] Changes pushed to repository
    echo [INFO] Check Render dashboard for deployment status
) else (
    echo [SKIP] Git operations skipped
)

echo.
echo ========================================
echo Deployment process complete!
echo ========================================
echo.
echo Frontend: Check https://your-username.github.io/LLP
echo Backend: Check https://dashboard.render.com
echo.
pause
