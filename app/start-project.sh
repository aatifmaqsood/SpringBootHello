#!/bin/bash

echo "🚀 Starting Resource Optimization Service..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Start PostgreSQL
echo "🐳 Starting PostgreSQL container..."
./setup-docker.sh

# Wait for user to continue
echo ""
echo "⏳ PostgreSQL is starting. Please wait a moment, then press Enter to continue..."
read -r

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Start backend
echo "🔧 Starting backend server..."
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Start frontend
echo "🎨 Starting frontend..."
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 Resource Optimization Service is starting!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "🗄️ Database: localhost:5432"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
