const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'resource_utilization',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function createDatabase() {
    try {
        // Connect to default postgres database to create our database
        const defaultPool = new Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            port: process.env.DB_PORT || 5432,
        });

        const dbName = process.env.DB_NAME || 'resource_utilization';
        
        // Check if database exists
        const dbExists = await defaultPool.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [dbName]
        );

        if (dbExists.rows.length === 0) {
            console.log(`Creating database: ${dbName}`);
            await defaultPool.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Database ${dbName} created successfully`);
        } else {
            console.log(`Database ${dbName} already exists`);
        }

        await defaultPool.end();
    } catch (error) {
        console.error('Error creating database:', error);
        throw error;
    }
}

async function createTables() {
    try {
        console.log('Creating tables...');

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

        await pool.query(createResourceUtilizationTable);
        await pool.query(createOptimizationHistoryTable);

        console.log('Tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}

async function insertSampleData() {
    try {
        console.log('Inserting sample data...');

        // Check if data already exists
        const result = await pool.query('SELECT COUNT(*) FROM resource_utilization');
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
            await pool.query(insertQuery, data);
        }

        console.log('Sample data inserted successfully');
    } catch (error) {
        console.error('Error inserting sample data:', error);
        throw error;
    }
}

async function runMigrations() {
    try {
        console.log('🚀 Starting database migrations...');
        
        await createDatabase();
        await createTables();
        await insertSampleData();
        
        console.log('✅ All migrations completed successfully!');
        
        // Test the connection
        const result = await pool.query('SELECT COUNT(*) FROM resource_utilization');
        console.log(`📊 Database contains ${result.rows[0].count} resource utilization records`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations();
}

module.exports = { createDatabase, createTables, insertSampleData };
