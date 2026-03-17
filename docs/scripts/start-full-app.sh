#!/bin/bash

# ORACLE-LEDGER Full Application Setup Script
echo "🚀 Setting up ORACLE-LEDGER Full Application"

# Navigate to the project directory
cd /workspace/ORACLE-LEDGER

# Clean any existing dependencies
echo "🧹 Cleaning existing dependencies..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies with proper permissions
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# If that fails, try with force
if [ $? -ne 0 ]; then
    echo "⚠️  Standard install failed, trying with force..."
    npm install --force
fi

# Build the application
echo "🏗️  Building application..."
npm run build

# Start both frontend and backend
echo "🚀 Starting full application..."
echo "Frontend: http://localhost:5000"
echo "Backend API: http://localhost:3000"
echo ""
echo "Starting servers..."
npm run dev:full