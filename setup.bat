@echo off
REM Language Learn Platform - Windows Setup Script

echo.
echo ==========================================
echo Language Learn Platform - Setup
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node --version
npm --version
echo.

REM Setup Backend
echo [Step 1] Setting up Backend...
cd backend

if exist node_modules (
    echo [SKIP] Backend dependencies already installed
) else (
    echo [INSTALL] Installing backend dependencies from package-lock.json...
    call npm ci
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
)

if not exist .env (
    echo [CREATE] Creating .env file from template...
    copy .env.example .env
    echo [INFO] Please edit backend\.env with your settings
)

cd ..
echo [OK] Backend setup complete!
echo.

REM Setup Frontend
echo [Step 2] Setting up Frontend...
cd frontend

if exist node_modules (
    echo [SKIP] Frontend dependencies already installed
) else (
    echo [INSTALL] Installing frontend dependencies from package-lock.json...
    call npm ci
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

if not exist .env.local (
    echo [CREATE] Creating .env.local file from template...
    copy .env.example .env.local
    echo [INFO] Please edit frontend\.env.local with your settings
)

cd ..
echo [OK] Frontend setup complete!
echo.

REM Summary
echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo.
echo 1. Make sure MongoDB is running:
echo    - Using local MongoDB: mongod.exe
echo    - Or use MongoDB Atlas: https://www.mongodb.com/cloud/atlas
echo.
echo 2. Update configuration files:
echo    - Edit backend\.env with your MongoDB URI
echo    - Edit frontend\.env.local if needed
echo.
echo 3. Start the backend (in one terminal):
echo    cd backend
echo    npm run dev
echo.
echo 4. Start the frontend (in another terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 5. Open your browser:
echo    http://localhost:5173
echo.
echo ==========================================
echo.
pause
