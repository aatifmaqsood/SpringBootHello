# Resource Optimization Service

A full-stack application for managing resource utilization, identifying overprovisioned applications, and providing self-service optimization capabilities for production environments.

## Features

- **Resource Utilization Analysis**: Monitor CPU usage vs. allocated resources
- **Overprovisioning Detection**: Identify applications with excessive resource allocation
- **Optimization Recommendations**: Get suggestions for optimal CPU requests
- **Self-Service Optimization**: Execute resource optimizations with approval workflow
- **Optimization History**: Track all optimization actions and their status
- **Database Dump Management**: Create, list, and restore database dumps
- **RESTful API**: Backend service with comprehensive endpoints
- **Modern UI**: React frontend with Material-UI components and charts

## Project Structure

```
├── backend/                 # Express.js backend service
│   ├── services/           # PostgreSQL database service layer
│   ├── scripts/            # Database migration and setup scripts
│   ├── package.json        # Backend dependencies
│   └── server.js           # Main server file
├── frontend/               # React frontend application
│   ├── src/                # Source code
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── docker-compose.yml      # Docker Compose configuration
├── init-scripts/           # PostgreSQL initialization scripts
├── setup-docker.sh         # Docker setup script
├── docker-run.sh           # Alternative Docker run script
├── database-dump.js        # Database dump utility
└── README.md               # This file
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Docker and Docker Compose

## Quick Start with Docker

### Option 1: Docker Compose (Recommended)

```bash
# Make setup script executable
chmod +x setup-docker.sh

# Run the setup script
./setup-docker.sh
```

### Option 2: Docker Run Command

```bash
# Make setup script executable
chmod +x docker-run.sh

# Run the setup script
./docker-run.sh
```

### Option 3: Manual Docker Commands

```bash
# Start PostgreSQL container
docker run -d \
    --name resource-optimization-db \
    -e POSTGRES_DB=resource_utilization \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres123 \
    -e POSTGRES_HOST_AUTH_METHOD=trust \
    -p 5432:5432 \
    -v $(pwd)/init-scripts:/docker-entrypoint-initdb.d \
    postgres:15

# Wait for container to be ready
docker exec resource-optimization-db pg_isready -U postgres -d resource_utilization

# Initialize database
docker exec resource-optimization-db psql -U postgres -d resource_utilization -f /docker-entrypoint-initdb.d/01-init.sql
```

## Installation & Setup

### 1. PostgreSQL Setup (Docker)

The Docker setup automatically:
- Creates a PostgreSQL 15 container
- Initializes the `resource_utilization` database
- Creates tables with proper schema
- Inserts sample data from your spreadsheet
- Sets up indexes for performance

**Connection Details:**
- Host: `localhost`
- Port: `5432`
- Database: `resource_utilization`
- Username: `postgres`
- Password: `postgres123`

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Copy environment configuration
cp env.example .env

# The .env file is already configured for Docker PostgreSQL
# No changes needed unless you want to use a different database

# Install dependencies
npm install

# Start the server
npm start

# For development with auto-reload
npm run dev
```

The backend will start on `http://localhost:3001`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will start on `http://localhost:3000`

### 4. Database Dump Utility

```bash
# Run the database dump utility
node database-dump.js
```

## Docker Management

### Start/Stop Services

```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# View logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Alternative Docker Commands

```bash
# Start container
docker start resource-optimization-db

# Stop container
docker stop resource-optimization-db

# View logs
docker logs resource-optimization-db

# Access PostgreSQL shell
docker exec -it resource-optimization-db psql -U postgres -d resource_utilization
```

### Reset Database

```bash
# Remove container and data
docker-compose down -v

# Or with docker run
docker stop resource-optimization-db
docker rm resource-optimization-db

# Restart setup
./setup-docker.sh
```

## Database Schema

### Resource Utilization Table
- `id` (SERIAL, PRIMARY KEY)
- `app_uniq` (VARCHAR(255), NOT NULL) - Unique application identifier
- `project` (VARCHAR(255), NOT NULL) - Project/API name
- `pr_url` (TEXT) - Pull request URL
- `pr_status` (VARCHAR(50), DEFAULT 'Open') - PR status
- `app_name` (VARCHAR(255), NOT NULL) - Application name
- `app_id` (VARCHAR(50), NOT NULL) - Application ID
- `env` (VARCHAR(50), NOT NULL) - Environment (dit, uat, prod)
- `max_cpu` (DECIMAL(10,2), NOT NULL) - Maximum CPU usage
- `avg_cpu` (DECIMAL(10,2), NOT NULL) - Average CPU usage
- `req_cpu` (DECIMAL(10,2), NOT NULL) - Current CPU request
- `new_req_cpu` (DECIMAL(10,2), NOT NULL) - Recommended CPU request
- `max_cpu_uti` (VARCHAR(50), NOT NULL) - Maximum CPU utilization percentage
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### Optimization History Table
- `id` (SERIAL, PRIMARY KEY)
- `app_uniq` (VARCHAR(255), NOT NULL) - Application unique identifier
- `app_id` (VARCHAR(50), NOT NULL) - Application ID
- `env` (VARCHAR(50), NOT NULL) - Environment
- `old_req_cpu` (DECIMAL(10,2), NOT NULL) - Previous CPU request
- `new_req_cpu` (DECIMAL(10,2), NOT NULL) - New CPU request
- `optimization_date` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `status` (VARCHAR(50), DEFAULT 'pending') - Optimization status
- `pr_url` (TEXT) - Pull request URL for the optimization
- `notes` (TEXT) - Additional notes

## API Endpoints

### Health Check
- `GET /api/health` - Service health status

### Resource Utilization
- `GET /api/resource-utilization` - Get all resource utilization data
- `GET /api/resource-utilization/env/:env` - Get data by environment
- `GET /api/resource-utilization/app/:appId` - Get data by application ID
- `GET /api/overprovisioned-apps` - Get overprovisioned applications
- `GET /api/optimization-recommendations` - Get optimization recommendations

### Optimization History
- `GET /api/optimization-history` - Get all optimization records
- `POST /api/optimization-history` - Create new optimization record
- `PUT /api/optimization-history/:id` - Update optimization status

### Database Management
- `POST /api/dump` - Create a new database dump
- `GET /api/dumps` - List all available dumps
- `POST /api/restore/:dumpFile` - Restore database from dump

### Statistics
- `GET /api/stats/summary` - Get summary statistics

## Usage

### Identifying Overprovisioned Applications

1. Navigate to the Dashboard to see overview statistics
2. Check the "Overprovisioned Apps" count
3. View detailed data in the Resource Utilization page
4. Use filters to analyze specific environments or projects

### Executing Optimizations

1. Go to Optimization Recommendations page
2. Review applications with optimization opportunities
3. Click "Optimize" on any application
4. Review the proposed changes and add notes
5. Execute the optimization
6. Track progress in Optimization History

### Creating Database Dumps

1. Navigate to Database Management page
2. Click "Create Dump" button
3. The system will create a timestamped JSON dump file
4. Dumps are stored in the `backend/dumps/` directory

### Restoring from Dumps

1. Go to Database Management page
2. Click "Restore" on any available dump
3. Confirm the restoration (this will overwrite current data)
4. The database will be restored from the selected dump

## Development

### Backend Development

```bash
cd backend
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development

```bash
cd frontend
npm start    # Starts development server with hot reload
```

### Database Development

```bash
# Access PostgreSQL shell
docker exec -it resource-optimization-db psql -U postgres -d resource_utilization

# Run custom SQL
docker exec -i resource-optimization-db psql -U postgres -d resource_utilization < your-script.sql

# Backup database
docker exec resource-optimization-db pg_dump -U postgres resource_utilization > backup.sql
```

## Customization

### Adding New Resource Types

1. Modify the database schema in `init-scripts/01-init.sql`
2. Add corresponding API endpoints in `server.js`
3. Update the frontend components to display new data
4. Modify the optimization logic as needed

### Modifying Optimization Algorithms

1. Update the `getOptimizationRecommendations()` method in `DatabaseService.js`
2. Modify the CPU calculation logic
3. Update the frontend to reflect new optimization criteria

## Troubleshooting

### Common Issues

1. **Docker not running**: Ensure Docker Desktop is started
2. **Port 5432 already in use**: Stop existing PostgreSQL services or change port in docker-compose.yml
3. **Database connection errors**: Check if container is running with `docker ps`
4. **Migration failures**: Ensure container is healthy with `docker-compose ps`
5. **Frontend build errors**: Clear `node_modules` and reinstall dependencies

### Docker Troubleshooting

```bash
# Check container status
docker ps -a

# View container logs
docker logs resource-optimization-db

# Restart container
docker restart resource-optimization-db

# Remove and recreate container
docker-compose down -v
./setup-docker.sh
```

### Logs

- Backend logs are displayed in the console
- Check browser console for frontend errors
- Database operations are logged with timestamps
- Docker logs: `docker logs resource-optimization-db`

## Security Considerations

- The current implementation is for development/demo purposes
- For production, implement:
  - Authentication and authorization
  - Input validation and sanitization
  - Rate limiting
  - HTTPS
  - Environment variable management for secrets
  - Database connection pooling
  - Audit logging
  - Secure Docker configurations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check the console logs for errors
4. Check Docker container status
5. Create an issue in the repository
