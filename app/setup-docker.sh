#!/bin/bash

echo "🐳 Setting up PostgreSQL with Docker for Resource Optimization Service..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose down -v 2>/dev/null || true

# Start PostgreSQL container
echo "🚀 Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec -T postgres pg_isready -U postgres -d resource_utilization; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Check if tables exist and have data
echo "🔍 Checking database status..."
TABLE_COUNT=$(docker-compose exec -T postgres psql -U postgres -d resource_utilization -t -c "SELECT COUNT(*) FROM resource_utilization;" | tr -d ' \n')

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✅ Database is already initialized with $TABLE_COUNT records"
else
    echo "📊 Database initialized but no data found. Running initialization..."
    docker-compose exec -T postgres psql -U postgres -d resource_utilization -f /docker-entrypoint-initdb.d/01-init.sql
fi

# Display database status
echo ""
echo "📊 Database Status:"
echo "=================="
docker-compose exec -T postgres psql -U postgres -d resource_utilization -c "
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
echo "🛑 To stop PostgreSQL: docker-compose down"
echo "🔄 To restart: docker-compose restart"
