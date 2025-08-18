const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const DatabaseService = require('./services/DatabaseService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database service
const dbService = new DatabaseService();

// Debug: Show environment variables on startup
console.log('=== SERVER STARTUP DEBUG ===');
console.log('Environment variables loaded:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined');
console.log('DB_SCHEMA:', process.env.DB_SCHEMA);
console.log('DB_TABLE:', process.env.DB_TABLE);
console.log('================================');

// Initialize database connection on startup
dbService.initDatabase().catch(console.error);

// Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: {
            schema: process.env.DB_SCHEMA || 'krs',
            table: process.env.DB_TABLE || 'nonprod_all_data_all_v1'
        }
    });
});

// Resource utilization endpoints - Updated to use actual table
app.get('/api/resource-utilization', async (req, res) => {
    try {
        const data = await dbService.getAllResourceUtilization();
        res.json(data);
    } catch (error) {
        console.error('Resource utilization fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/resource-utilization/env/:env', async (req, res) => {
    try {
        const data = await dbService.getResourceUtilizationByEnv(req.params.env);
        res.json(data);
    } catch (error) {
        console.error('Environment-specific fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/resource-utilization/project/:project', async (req, res) => {
    try {
        const data = await dbService.getResourceUtilizationByProject(req.params.project);
        res.json(data);
    } catch (error) {
        console.error('Project-specific fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/overprovisioned-apps', async (req, res) => {
    try {
        const threshold = req.query.threshold || 80;
        const data = await dbService.getOverprovisionedApps(parseInt(threshold));
        res.json(data);
    } catch (error) {
        console.error('Overprovisioned apps fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/optimization-recommendations', async (req, res) => {
    try {
        const data = await dbService.getOptimizationRecommendations();
        res.json(data);
    } catch (error) {
        console.error('Optimization recommendations fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// New endpoints for project and environment statistics
app.get('/api/projects/stats', async (req, res) => {
    try {
        const data = await dbService.getProjectStats();
        res.json(data);
    } catch (error) {
        console.error('Project stats fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/environments/stats', async (req, res) => {
    try {
        const data = await dbService.getEnvironmentStats();
        res.json(data);
    } catch (error) {
        console.error('Environment stats fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/projects/:projectName', async (req, res) => {
    try {
        const data = await dbService.getResourceUtilizationByProject(req.params.projectName);
        res.json(data);
    } catch (error) {
        console.error('Project data fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/projects/:projectName/stats', async (req, res) => {
    try {
        const projectStats = await dbService.getProjectStats();
        const projectData = projectStats.find(p => p.project === req.params.projectName);
        if (projectData) {
            res.json(projectData);
        } else {
            res.status(404).json({ error: 'Project not found' });
        }
    } catch (error) {
        console.error('Project stats fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Optimization history endpoints - Commented out since optimization_history table doesn't exist
// app.get('/api/optimization-history', async (req, res) => {
//     try {
//         const data = await dbService.getAllOptimizationHistory();
//         res.json(data);
//     } catch (error) {
//         console.error('Optimization history fetch error:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// app.post('/api/optimization-history', async (req, res) => {
//     try {
//         const data = await dbService.addOptimizationRecord(req.body);
//         res.status(201).json(data);
//     } catch (error) {
//         console.error('Optimization record creation error:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// app.put('/api/optimization-history/:id', async (req, res) => {
//     try {
//         const { status, pr_url } = req.body;
//         const data = await dbService.updateOptimizationStatus(req.params.id, status, pr_url);
//         res.json(data);
//     } catch (error) {
//         console.error('Optimization status update error:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// Database dump endpoints
app.post('/api/dump', async (req, res) => {
    try {
        const dumpFile = await dbService.createDump();
        res.json({ message: 'Database dump created successfully', file: dumpFile });
    } catch (error) {
        console.error('Dump creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/dumps', async (req, res) => {
    try {
        const dumps = await dbService.listDumps();
        res.json(dumps);
    } catch (error) {
        console.error('Dumps listing error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/restore/:dumpFile', async (req, res) => {
    try {
        const result = await dbService.restoreFromDump(req.params.dumpFile);
        res.json(result);
    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Statistics endpoints - Updated to use your actual table structure
app.get('/api/stats/summary', async (req, res) => {
    try {
        const [utilizationData, projectStats, envStats] = await Promise.all([
            dbService.getAllResourceUtilization(),
            dbService.getProjectStats(),
            dbService.getEnvironmentStats()
        ]);

        const summary = {
            total_apps: utilizationData.length,
            total_projects: projectStats.length,
            environments: envStats.map(env => env.environment),
            projects: projectStats.map(proj => proj.project),
            overprovisioned_count: utilizationData.filter(app => (app.max_cpu_utilz_percent / 100.0) * app.req_cpu < (app.req_cpu * 0.5)).length,
            avg_cpu_utilization: utilizationData.reduce((sum, app) => sum + (app.max_cpu_utilz_percent || 0), 0) / utilizationData.length,
            total_cpu_savings: utilizationData.reduce((sum, app) => {
                if ((app.max_cpu_utilz_percent / 100.0) * app.req_cpu < (app.req_cpu * 0.5)) {
                    return sum + (app.req_cpu - app.new_req_cpu);
                }
                return sum;
            }, 0),
            project_breakdown: projectStats
        };

        res.json(summary);
    } catch (error) {
        console.error('Summary statistics error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await dbService.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await dbService.close();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database: ${process.env.DB_SCHEMA || 'krs'}.${process.env.DB_TABLE || 'nonprod_all_data_all_v1'}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Resource utilization: http://localhost:${PORT}/api/resource-utilization`);
    console.log(`Project stats: http://localhost:${PORT}/api/projects/stats`);
    console.log(`Environment stats: http://localhost:${PORT}/api/environments/stats`);
});

module.exports = app;
