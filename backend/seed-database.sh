#!/bin/bash

echo "===================================="
echo "LinguaNest Content Seed Script"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f "../.env" ]; then
    echo "❌ ERROR: .env file not found in project root"
    echo ""
    echo "Please create .env file with:"
    echo "  MONGODB_URI=your_mongodb_atlas_connection_string"
    echo ""
    exit 1
fi

echo "✅ [1/3] Loading environment variables..."
echo ""

echo "🌱 [2/3] Running seed script..."
echo ""

npm run seed -- --mode=development --confirm

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ [ERROR] Seed failed!"
    echo ""
    echo "Common issues:"
    echo "  1. MONGODB_URI not set in .env file"
    echo "  2. MongoDB Atlas not accessible (check network)"
    echo "  3. Database user permissions incorrect"
    echo ""
    echo "Check your .env file and try again."
    exit 1
fi

echo ""
echo "✅ [3/3] Seed completed successfully!"
echo ""
echo "===================================="
echo "Next steps:"
echo "  1. Start backend: npm run dev"
echo "  2. Check courses in database"
echo "===================================="
echo ""
