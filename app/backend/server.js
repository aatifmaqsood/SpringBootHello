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

// Initialize database on startup
dbService.initDatabase().catch(console.error);

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Resource utilization endpoints
app.get('/api/resource-utilization', async (req, res) => {
    try {
        const data = await dbService.getAllResourceUtilization();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/resource-utilization/env/:env', async (req, res) => {
    try {
        const data = await dbService.getResourceUtilizationByEnv(req.params.env);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/resource-utilization/app/:appId', async (req, res) => {
    try {
        const data = await dbService.getResourceUtilizationByAppId(req.params.appId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/overprovisioned-apps', async (req, res) => {
    try {
        const threshold = req.query.threshold || 80;
        const data = await dbService.getOverprovisionedApps(parseInt(threshold));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/optimization-recommendations', async (req, res) => {
    try {
        const data = await dbService.getOptimizationRecommendations();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Optimization history endpoints
app.get('/api/optimization-history', async (req, res) => {
    try {
        const data = await dbService.getAllOptimizationHistory();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/optimization-history', async (req, res) => {
    try {
        const data = await dbService.addOptimizationRecord(req.body);
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/optimization-history/:id', async (req, res) => {
    try {
        const { status, pr_url } = req.body;
        const data = await dbService.updateOptimizationStatus(req.params.id, status, pr_url);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Database dump endpoints
app.post('/api/dump', async (req, res) => {
    try {
        const dumpFile = await dbService.createDump();
        res.json({ message: 'Database dump created successfully', file: dumpFile });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/dumps', async (req, res) => {
    try {
        const dumps = await dbService.listDumps();
        res.json(dumps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/restore/:dumpFile', async (req, res) => {
    try {
        await dbService.restoreFromDump(req.params.dumpFile);
        res.json({ message: 'Database restored successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Statistics endpoints
app.get('/api/stats/summary', async (req, res) => {
    try {
        const [utilizationData, historyData] = await Promise.all([
            dbService.getAllResourceUtilization(),
            dbService.getAllOptimizationHistory()
        ]);

        const summary = {
            total_apps: utilizationData.length,
            total_optimizations: historyData.length,
            environments: [...new Set(utilizationData.map(app => app.env))],
            projects: [...new Set(utilizationData.map(app => app.project))],
            overprovisioned_count: utilizationData.filter(app => {
                const utilization = parseFloat(app.max_cpu_uti.replace(' API', ''));
                return utilization > 80;
            }).length,
            total_cpu_savings: utilizationData.reduce((sum, app) => {
                return sum + (app.req_cpu - app.new_req_cpu);
            }, 0),
            avg_cpu_utilization: utilizationData.reduce((sum, app) => {
                return sum + parseFloat(app.max_cpu_uti.replace(' API', ''));
            }, 0) / utilizationData.length
        };

        res.json(summary);
    } catch (error) {
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
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Resource utilization: http://localhost:${PORT}/api/resource-utilization`);
    console.log(`Overprovisioned apps: http://localhost:${PORT}/api/overprovisioned-apps`);
});

module.exports = app;
