#!/bin/bash

echo "🐳 PostgreSQL Docker Run Setup for Resource Optimization Service..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Stop any existing container
echo "🛑 Stopping any existing PostgreSQL container..."
docker stop resource-optimization-db 2>/dev/null || true
docker rm resource-optimization-db 2>/dev/null || true

# Create network if it doesn't exist
docker network create resource-optimization-network 2>/dev/null || true

# Run PostgreSQL container
echo "🚀 Starting PostgreSQL container..."
docker run -d \
    --name resource-optimization-db \
    --network resource-optimization-network \
    -e POSTGRES_DB=resource_utilization \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres123 \
    -e POSTGRES_HOST_AUTH_METHOD=trust \
    -p 5432:5432 \
    -v $(pwd)/init-scripts:/docker-entrypoint-initdb.d \
    postgres:15

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec resource-optimization-db pg_isready -U postgres -d resource_utilization; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Initialize database with schema and data
echo "📊 Initializing database..."
docker exec resource-optimization-db psql -U postgres -d resource_utilization -f /docker-entrypoint-initdb.d/01-init.sql

# Display database status
echo ""
echo "📊 Database Status:"
echo "=================="
docker exec resource-optimization-db psql -U postgres -d resource_utilization -c "
SELECT 
    'resource_utilization' as table_name,
    COUNT(*) as record_count
FROM resource_utilization
UNION ALL
SELECT 
    'optimization_history' as table_name,
    COUNT(*) as record_count
FROM optimization_history;
"

echo ""
echo "🔗 Connection Details:"
echo "====================="
echo "Host: localhost"
echo "Port: 5432"
echo "Database: resource_utilization"
echo "Username: postgres"
echo "Password: postgres123"
echo ""

echo "🎉 PostgreSQL setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy environment configuration:"
echo "   cp backend/env.example backend/.env"
echo ""
echo "2. Install backend dependencies:"
echo "   cd backend && npm install"
echo ""
echo "3. Start the backend server:"
echo "   npm start"
echo ""
echo "4. In a new terminal, start the frontend:"
echo "   cd frontend && npm install && npm start"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Database: localhost:5432"
echo ""
echo "🛑 To stop PostgreSQL: docker stop resource-optimization-db"
echo "🔄 To restart: docker start resource-optimization-db"
echo "🗑️  To remove: docker rm resource-optimization-db"
