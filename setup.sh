#!/bin/bash

# Language Learn Platform - Setup Script (macOS/Linux)

echo ""
echo "=========================================="
echo "Language Learn Platform - Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Then run this script again."
    exit 1
fi

echo "[OK] Node.js found:"
node --version
npm --version
echo ""

# Setup Backend
echo "[Step 1] Setting up Backend..."
cd backend

if [ -d "node_modules" ]; then
    echo "[SKIP] Backend dependencies already installed"
else
    echo "[INSTALL] Installing backend dependencies from package-lock.json..."
    npm ci
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install backend dependencies"
        exit 1
    fi
fi

if [ ! -f ".env" ]; then
    echo "[CREATE] Creating .env file from template..."
    cp .env.example .env
    echo "[INFO] Please edit backend/.env with your settings"
fi

cd ..
echo "[OK] Backend setup complete!"
echo ""

# Setup Frontend
echo "[Step 2] Setting up Frontend..."
cd frontend

if [ -d "node_modules" ]; then
    echo "[SKIP] Frontend dependencies already installed"
else
    echo "[INSTALL] Installing frontend dependencies from package-lock.json..."
    npm ci
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install frontend dependencies"
        exit 1
    fi
fi

if [ ! -f ".env.local" ]; then
    echo "[CREATE] Creating .env.local file from template..."
    cp .env.example .env.local
    echo "[INFO] Please edit frontend/.env.local with your settings"
fi

cd ..
echo "[OK] Frontend setup complete!"
echo ""

# Summary
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Make sure MongoDB is running:"
echo "   - Using Homebrew: brew services start mongodb-community"
echo "   - Or use MongoDB Atlas: https://www.mongodb.com/cloud/atlas"
echo ""
echo "2. Update configuration files:"
echo "   - Edit backend/.env with your MongoDB URI"
echo "   - Edit frontend/.env.local if needed"
echo ""
echo "3. Start the backend (in one terminal):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "4. Start the frontend (in another terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "5. Open your browser:"
echo "   http://localhost:5173"
echo ""
echo "=========================================="
echo ""
