const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseService {
    constructor() {
        this.schema = process.env.DB_SCHEMA || 'krs';
        this.tableName = process.env.DB_TABLE || 'nonprod_all_data_all_v1';
        
        console.log('DatabaseService initialized with:');
        console.log('  Schema:', this.schema);
        console.log('  Table:', this.tableName);
        
        this.pool = new Pool({
            user: process.env.DB_USER || 'krs_app_rw',
            host: process.env.DB_HOST || 'krs-aurora-cluster-identifier.cluster-ro-chh1bxuyaidj.us-east-1.rds.amazonaws.com',
            database: process.env.DB_NAME || 'krs',
            password: process.env.DB_PASSWORD || 'password',
            port: process.env.DB_PORT || 5432,
            options: `-c search_path=public,${this.schema}`,
            // AWS RDS specific configurations - SSL is REQUIRED
            ssl: {
                rejectUnauthorized: false,
                require: true
            },
            connectionTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
            max: 20
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
            // Debug: Show actual environment variable values
            console.log('=== DATABASE CONNECTION DEBUG ===');
            console.log('Environment variables loaded:');
            console.log('DB_USER:', process.env.DB_USER);
            console.log('DB_HOST:', process.env.DB_HOST);
            console.log('DB_NAME:', process.env.DB_NAME);
            console.log('DB_PORT:', process.env.DB_PORT);
            console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined');
            console.log('DB_SCHEMA:', process.env.DB_SCHEMA);
            console.log('DB_TABLE:', process.env.DB_TABLE);
            console.log('================================');
            
            // First test basic connection
            console.log('Testing database connection...');
            console.log(`Connection details: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
            console.log(`User: ${process.env.DB_USER}, Schema: ${this.schema}, Table: ${this.tableName}`);
            
            // Test basic connection first - use simpler query for older PostgreSQL versions
            const testResult = await this.pool.query('SELECT current_database(), current_user, version()');
            console.log('Basic connection successful:', testResult.rows[0]);
            
            // Now try to access the specific table
            const result = await this.pool.query(`SELECT COUNT(*) FROM ${this.schema}.${this.tableName}`);
            console.log(`Connected to existing database successfully: ${this.schema}.${this.tableName}`);
            console.log(`Total rows in table: ${result.rows[0].count}`);
        } catch (error) {
            console.error('Database connection error:', error);
            console.error('Error details:', {
                code: error.code,
                detail: error.detail,
                hint: error.hint,
                position: error.position
            });
            
            // AWS RDS specific error handling
            if (error.code === '28000') {
                console.error('Authentication failed. Please check:');
                console.error('1. Username and password are correct');
                console.error('2. User has access to the database');
                console.error('3. Network/security group allows your connection');
                console.error('4. SSL configuration is correct');
                console.error('5. Your IP address (10.1.65.78) is allowed in RDS security group');
            } else if (error.code === '42883') {
                console.error('Function not found. This might be a PostgreSQL version compatibility issue.');
                console.error('Trying alternative connection test...');
                // Try a simpler test
                try {
                    const simpleTest = await this.pool.query('SELECT 1 as test');
                    console.log('Simple connection test successful:', simpleTest.rows[0]);
                    
                    // Now try to access the specific table
                    const result = await this.pool.query(`SELECT COUNT(*) FROM ${this.schema}.${this.tableName}`);
                    console.log(`Connected to existing database successfully: ${this.schema}.${this.tableName}`);
                    console.log(`Total rows in table: ${result.rows[0].count}`);
                    return; // Success!
                } catch (innerError) {
                    console.error('Alternative connection test also failed:', innerError.message);
                    throw innerError;
                }
            } else if (error.code === 'ENOTFOUND') {
                console.error('Host not found. Please check:');
                console.error('1. Hostname is correct');
                console.error('2. DNS resolution is working');
                console.error('3. VPC/subnet configuration');
            } else if (error.code === 'ECONNREFUSED') {
                console.error('Connection refused. Please check:');
                console.error('1. Port is correct (5432)');
                console.error('2. Security group allows inbound connections');
                console.error('3. Database is running and accessible');
            }
            
            throw error;
        }
    }

    // Resource utilization operations - Updated to use your actual table structure
    async getAllResourceUtilization() {
        try {
            const result = await this.pool.query(`
                SELECT 
                    app_uniq,
                    project,
                    pr_url,
                    pr_status,
                    branch_nm,
                    created_at
                FROM ${this.schema}.${this.tableName}
                ORDER BY created_at DESC
            `);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to fetch resource utilization: ${error.message}`);
        }
    }

    async getResourceUtilizationByEnv(env) {
        try {
            // Extract environment from app_uniq (e.g., 'uat', 'dit' from 'aaogateway-uat')
            const result = await this.pool.query(`
                SELECT 
                    app_uniq,
                    project,
                    pr_url,
                    pr_status,
                    branch_nm,
                    created_at
                FROM ${this.schema}.${this.tableName}
                WHERE app_uniq LIKE $1
                ORDER BY created_at DESC
            `, [`%${env}%`]);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to fetch resource utilization for env ${env}: ${error.message}`);
        }
    }

    async getResourceUtilizationByProject(project) {
        try {
            const result = await this.pool.query(`
                SELECT 
                    app_uniq,
                    project,
                    pr_url,
                    pr_status,
                    branch_nm,
                    created_at
                FROM ${this.schema}.${this.tableName}
                WHERE project = $1
                ORDER BY created_at DESC
            `, [project]);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to fetch resource utilization for project ${project}: ${error.message}`);
        }
    }

    async getOverprovisionedApps(threshold = 80) {
        try {
            // Since your table doesn't have CPU utilization data, 
            // we'll focus on PR status and project analysis
            const result = await this.pool.query(`
                SELECT 
                    app_uniq,
                    project,
                    pr_url,
                    pr_status,
                    branch_nm,
                    created_at
                FROM ${this.schema}.${this.tableName}
                WHERE pr_status = 'Open'
                ORDER BY created_at DESC
            `);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to fetch overprovisioned apps: ${error.message}`);
        }
    }

    async getOptimizationRecommendations() {
        try {
            // Focus on projects with open PRs that might need attention
            const result = await this.pool.query(`
                SELECT 
                    project,
                    COUNT(*) as open_prs,
                    COUNT(CASE WHEN pr_status = 'Open' THEN 1 END) as pending_prs,
                    COUNT(CASE WHEN pr_status = 'Merged' THEN 1 END) as merged_prs
                FROM ${this.schema}.${this.tableName}
                GROUP BY project
                ORDER BY open_prs DESC
            `);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to fetch optimization recommendations: ${error.message}`);
        }
    }

    // Get project statistics
    async getProjectStats() {
        try {
            const result = await this.pool.query(`
                SELECT 
                    project,
                    COUNT(*) as total_entries,
                    COUNT(CASE WHEN pr_status = 'Open' THEN 1 END) as open_prs,
                    COUNT(CASE WHEN pr_status = 'Merged' THEN 1 END) as merged_prs,
                    COUNT(DISTINCT app_uniq) as unique_apps
                FROM ${this.schema}.${this.tableName}
                GROUP BY project
                ORDER BY total_entries DESC
            `);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to fetch project stats: ${error.message}`);
        }
    }

    // Get environment statistics
    async getEnvironmentStats() {
        try {
            const result = await this.pool.query(`
                SELECT 
                    CASE 
                        WHEN app_uniq LIKE '%uat%' THEN 'UAT'
                        WHEN app_uniq LIKE '%dit%' THEN 'DIT'
                        WHEN app_uniq LIKE '%prod%' THEN 'Production'
                        ELSE 'Other'
                    END as environment,
                    COUNT(*) as total_entries,
                    COUNT(CASE WHEN pr_status = 'Open' THEN 1 END) as open_prs,
                    COUNT(CASE WHEN pr_status = 'Merged' THEN 1 END) as merged_prs
                FROM ${this.schema}.${this.tableName}
                GROUP BY 
                    CASE 
                        WHEN app_uniq LIKE '%uat%' THEN 'UAT'
                        WHEN app_uniq LIKE '%dit%' THEN 'DIT'
                        WHEN app_uniq LIKE '%prod%' THEN 'Production'
                        ELSE 'Other'
                    END
                ORDER BY total_entries DESC
            `);
            return result.rows;
        } catch (error) {
            throw new Error(`Failed to fetch environment stats: ${error.message}`);
        }
    }

    // Optimization history operations - Keep existing logic
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

    // Dump operations - Updated to use actual table
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
                    environments: [...new Set(utilizationData.map(app => app.app_uniq.split('-').pop()))],
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
            
            // Note: Restore functionality may need adjustment based on actual table structure
            console.log('Restore functionality requires table structure validation');
            return { message: 'Restore functionality needs table structure validation' };
        } catch (error) {
            throw new Error(`Failed to restore from dump: ${error.message}`);
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

module.exports = DatabaseService;
