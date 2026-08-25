#!/bin/bash

echo "🚀 LinguaNest Production Deployment Script"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Not in project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Running tests...${NC}"
cd backend && npm test
if [ $? -ne 0 ]; then
    echo -e "${RED}Backend tests failed. Fix tests before deploying.${NC}"
    exit 1
fi
cd ..

echo -e "${GREEN}✓ Backend tests passed${NC}"

echo -e "${YELLOW}Step 2: Building frontend...${NC}"
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Frontend build failed${NC}"
    exit 1
fi
cd ..

echo -e "${GREEN}✓ Frontend built successfully${NC}"

echo -e "${YELLOW}Step 3: Checking environment variables...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}Warning: backend/.env not found. Make sure to configure it on Render.${NC}"
fi

echo -e "${GREEN}✓ Pre-deployment checks complete${NC}"

echo ""
echo -e "${YELLOW}Deployment Steps:${NC}"
echo "1. Frontend: Run 'npm run deploy' in frontend directory"
echo "2. Backend: Push to main branch - Render will auto-deploy"
echo "3. Configure environment variables on Render dashboard"
echo ""

read -p "Deploy frontend to GitHub Pages now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deploying frontend...${NC}"
    cd frontend
    npm run deploy
    echo -e "${GREEN}✓ Frontend deployed to GitHub Pages${NC}"
    cd ..
fi

echo ""
echo -e "${GREEN}🎉 Deployment process complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Commit and push changes to trigger Render deployment"
echo "2. Configure environment variables on Render"
echo "3. Monitor deployment at https://dashboard.render.com"
