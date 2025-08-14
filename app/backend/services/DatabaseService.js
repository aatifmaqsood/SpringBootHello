const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseService {
    constructor() {
        this.pool = new Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'resource_utilization',
            password: process.env.DB_PASSWORD || 'password',
            port: process.env.DB_PORT || 5432,
        });
        
        this.dumpDir = path.join(__dirname, '../dumps');
        this.ensureDumpDirectory();
    }

    ensureDumpDirectory() {
        if (!fs.existsSync(this.dumpDir)) {
            fs.mkdirSync(this.dumpDir, { recursive: true });
        }
    }

    async initDatabase() {
        try {
            await this.createTables();
            await this.insertSampleData();
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    async createTables() {
        const createResourceUtilizationTable = `
            CREATE TABLE IF NOT EXISTS resource_utilization (
                id SERIAL PRIMARY KEY,
                app_uniq VARCHAR(255) NOT NULL,
                project VARCHAR(255) NOT NULL,
                pr_url TEXT,
                pr_status VARCHAR(50) DEFAULT 'Open',
                app_name VARCHAR(255) NOT NULL,
                app_id VARCHAR(50) NOT NULL,
                env VARCHAR(50) NOT NULL,
                max_cpu DECIMAL(10,2) NOT NULL,
                avg_cpu DECIMAL(10,2) NOT NULL,
                req_cpu DECIMAL(10,2) NOT NULL,
                new_req_cpu DECIMAL(10,2) NOT NULL,
                max_cpu_uti VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createOptimizationHistoryTable = `
            CREATE TABLE IF NOT EXISTS optimization_history (
                id SERIAL PRIMARY KEY,
                app_uniq VARCHAR(255) NOT NULL,
                app_id VARCHAR(50) NOT NULL,
                env VARCHAR(50) NOT NULL,
                old_req_cpu DECIMAL(10,2) NOT NULL,
                new_req_cpu DECIMAL(10,2) NOT NULL,
                optimization_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'pending',
                pr_url TEXT,
                notes TEXT
            )
        `;

        try {
            await this.pool.query(createResourceUtilizationTable);
            await this.pool.query(createOptimizationHistoryTable);
            console.log('Tables created successfully');
        } catch (error) {
            console.error('Error creating tables:', error);
            throw error;
        }
    }

    async insertSampleData() {
        try {
            // Check if data already exists
            const result = await this.pool.query('SELECT COUNT(*) FROM resource_utilization');
            if (parseInt(result.rows[0].count) > 0) {
                console.log('Sample data already exists, skipping...');
                return;
            }

            const sampleData = [
                ['aaoesigcloud-dit', 'filiannaccop-api', 'https://github.com/Fidelity-R', 'Merged', 'aaoesigclouc', 'AP153454', 'dit', 481.24, 10.55, 512, 100, '93.99 API'],
                ['acctbenasset-uat', 'nextgensp-api', 'https://github.com/Fidelity-R', 'Open', 'aaogateway', 'AP155472', 'uat', 281.44, 11.07, 250, 100, '54.97 API'],
                ['acctbenasset-uat', 'faa-retail-api', 'https://github.com/Fidelity-R', 'Merged', 'acctbenasse', 'AP158019', 'uat', 536.47, 11.22, 500, 100, '104.78 API'],
                ['aaoesigcloud-dit', 'filiannaccop-api', 'https://github.com/Fidelity-R', 'Open', 'aaoesigclouc', 'AP153455', 'dit', 245.67, 8.92, 300, 100, '81.89 API'],
                ['acctbenasset-uat', 'nextgensp-api', 'https://github.com/Fidelity-R', 'Merged', 'aaogateway', 'AP155473', 'uat', 189.34, 7.45, 200, 100, '94.67 API']
            ];

            const insertQuery = `
                INSERT INTO resource_utilization 
                (app_uniq, project, pr_url, pr_status, app_name, app_id, env, max_cpu, avg_cpu, req_cpu, new_req_cpu, max_cpu_uti)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `;

            for (const data of sampleData) {
                await this.pool.query(insertQuery, data);
            }

            console.log('Sample data inserted successfully');
        } catch (error) {
            console.error('Error inserting sample data:', error);
            throw error;
        }
    }

    // Resource utilization operations
    async getAllResourceUtilization() {
        try {
            const result = await this.pool.query(`
                SELECT * FROM resource_utilization 
                ORDER BY created_at DESC
            `);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to fetch resource utilization: ${error.message}`);
        }
    }

    async getResourceUtilizationByEnv(env) {
        try {
            const result = await this.pool.query(`
                SELECT * FROM resource_utilization 
                WHERE env = $1 
                ORDER BY created_at DESC
            `, [env]);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to fetch resource utilization for env ${env}: ${error.message}`);
        }
    }

    async getResourceUtilizationByAppId(appId) {
        try {
            const result = await this.pool.query(`
                SELECT * FROM resource_utilization 
                WHERE app_id = $1 
                ORDER BY created_at DESC
            `, [appId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to fetch resource utilization for app ${appId}: ${error.message}`);
        }
    }

    async getOverprovisionedApps(threshold = 80) {
        try {
            const result = await this.pool.query(`
                SELECT * FROM resource_utilization 
                WHERE CAST(REPLACE(max_cpu_uti, ' API', '') AS DECIMAL) > $1
                ORDER BY CAST(REPLACE(max_cpu_uti, ' API', '') AS DECIMAL) DESC
            `, [threshold]);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to fetch overprovisioned apps: ${error.message}`);
        }
    }

    async getOptimizationRecommendations() {
        try {
            const result = await this.pool.query(`
                SELECT 
                    app_uniq,
                    app_name,
                    app_id,
                    env,
                    max_cpu,
                    avg_cpu,
                    req_cpu,
                    new_req_cpu,
                    max_cpu_uti,
                    ROUND((req_cpu - new_req_cpu) / req_cpu * 100, 2) as cpu_savings_percent
                FROM resource_utilization 
                WHERE req_cpu > new_req_cpu
                ORDER BY cpu_savings_percent DESC
            `);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to fetch optimization recommendations: ${error.message}`);
        }
    }

    // Optimization history operations
    async getAllOptimizationHistory() {
        try {
            const result = await this.pool.query(`
                SELECT * FROM optimization_history 
                ORDER BY optimization_date DESC
            `);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to fetch optimization history: ${error.message}`);
        }
    }

    async addOptimizationRecord(optimizationData) {
        try {
            const query = `
                INSERT INTO optimization_history 
                (app_uniq, app_id, env, old_req_cpu, new_req_cpu, status, pr_url, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;
            
            const values = [
                optimizationData.app_uniq,
                optimizationData.app_id,
                optimizationData.env,
                optimizationData.old_req_cpu,
                optimizationData.new_req_cpu,
                optimizationData.status || 'pending',
                optimizationData.pr_url,
                optimizationData.notes
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Failed to add optimization record: ${error.message}`);
        }
    }

    async updateOptimizationStatus(id, status, prUrl = null) {
        try {
            const query = `
                UPDATE optimization_history 
                SET status = $1, pr_url = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `;
            
            const result = await this.pool.query(query, [status, prUrl, id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Failed to update optimization status: ${error.message}`);
        }
    }

    // Dump operations
    async createDump() {
        try {
            const [utilizationData, historyData] = await Promise.all([
                this.getAllResourceUtilization(),
                this.getAllOptimizationHistory()
            ]);

            const dumpData = {
                resource_utilization: utilizationData,
                optimization_history: historyData,
                timestamp: new Date().toISOString(),
                metadata: {
                    total_apps: utilizationData.length,
                    total_optimizations: historyData.length,
                    environments: [...new Set(utilizationData.map(app => app.env))],
                    projects: [...new Set(utilizationData.map(app => app.project))]
                }
            };

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const dumpFile = path.join(this.dumpDir, `resource-dump-${timestamp}.json`);
            
            fs.writeFileSync(dumpFile, JSON.stringify(dumpData, null, 2));
            return path.basename(dumpFile);
        } catch (error) {
            throw new Error(`Failed to create dump: ${error.message}`);
        }
    }

    listDumps() {
        try {
            const files = fs.readdirSync(this.dumpDir);
            return files.filter(file => file.endsWith('.json'))
                       .map(file => ({
                           filename: file,
                           path: path.join(this.dumpDir, file),
                           size: fs.statSync(path.join(this.dumpDir, file)).size,
                           created: fs.statSync(path.join(this.dumpDir, file)).mtime
                       }));
        } catch (error) {
            throw new Error(`Failed to list dumps: ${error.message}`);
        }
    }

    async restoreFromDump(dumpFile) {
        try {
            const dumpPath = path.join(this.dumpDir, dumpFile);
            if (!fs.existsSync(dumpPath)) {
                throw new Error('Dump file not found');
            }

            const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
            
            // Clear existing data
            await this.clearTables();
            
            // Restore resource utilization data
            if (data.resource_utilization) {
                for (const record of data.resource_utilization) {
                    await this.insertResourceUtilization(record);
                }
            }
            
            // Restore optimization history data
            if (data.optimization_history) {
                for (const record of data.optimization_history) {
                    await this.addOptimizationRecord(record);
                }
            }

            return true;
        } catch (error) {
            throw new Error(`Failed to restore from dump: ${error.message}`);
        }
    }

    async clearTables() {
        try {
            await this.pool.query('DELETE FROM optimization_history');
            await this.pool.query('DELETE FROM resource_utilization');
            await this.pool.query('ALTER SEQUENCE resource_utilization_id_seq RESTART WITH 1');
            await this.pool.query('ALTER SEQUENCE optimization_history_id_seq RESTART WITH 1');
        } catch (error) {
            throw new Error(`Failed to clear tables: ${error.message}`);
        }
    }

    async insertResourceUtilization(data) {
        try {
            const query = `
                INSERT INTO resource_utilization 
                (app_uniq, project, pr_url, pr_status, app_name, app_id, env, max_cpu, avg_cpu, req_cpu, new_req_cpu, max_cpu_uti)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `;
            
            const values = [
                data.app_uniq,
                data.project,
                data.pr_url,
                data.pr_status,
                data.app_name,
                data.app_id,
                data.env,
                data.max_cpu,
                data.avg_cpu,
                data.req_cpu,
                data.new_req_cpu,
                data.max_cpu_uti
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Failed to insert resource utilization: ${error.message}`);
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

module.exports = DatabaseService;
