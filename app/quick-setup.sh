#!/bin/bash

echo "⚡ Quick Setup for Resource Optimization Service"

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Start PostgreSQL
echo "🐳 Setting up PostgreSQL..."
./setup-docker.sh

echo ""
echo "🎉 Setup completed! You can now run:"
echo "   ./start-project.sh"
echo ""
echo "Or start services manually:"
echo "   cd backend && npm install && npm start"
echo "   cd frontend && npm install && npm start"
