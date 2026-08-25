@echo off
echo ====================================
echo LinguaNest Content Seed Script
echo ====================================
echo.

REM Check if .env exists
if not exist "..\\.env" (
    echo [ERROR] .env file not found in project root
    echo.
    echo Please create .env file with:
    echo   MONGODB_URI=your_mongodb_atlas_connection_string
    echo.
    pause
    exit /b 1
)

echo [1/3] Loading environment variables...
echo.

echo [2/3] Running seed script...
echo.

call npm run seed -- --mode=development --confirm

if errorlevel 1 (
    echo.
    echo [ERROR] Seed failed!
    echo.
    echo Common issues:
    echo   1. MONGODB_URI not set in .env file
    echo   2. MongoDB Atlas not accessible (check network)
    echo   3. Database user permissions incorrect
    echo.
    echo Check your .env file and try again.
    pause
    exit /b 1
)

echo.
echo [3/3] Seed completed successfully!
echo.
echo ====================================
echo Next steps:
echo   1. Start backend: npm run dev
echo   2. Check courses in database
echo ====================================
echo.
pause
