-- Initialize Resource Optimization Database
-- This script runs automatically when the PostgreSQL container starts

-- Create tables
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
);

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
);

-- Insert sample data from your spreadsheet
INSERT INTO resource_utilization 
(app_uniq, project, pr_url, pr_status, app_name, app_id, env, max_cpu, avg_cpu, req_cpu, new_req_cpu, max_cpu_uti)
VALUES 
('aaoesigcloud-dit', 'filiannaccop-api', 'https://github.com/Fidelity-R', 'Merged', 'aaoesigclouc', 'AP153454', 'dit', 481.24, 10.55, 512, 100, '93.99 API'),
('acctbenasset-uat', 'nextgensp-api', 'https://github.com/Fidelity-R', 'Open', 'aaogateway', 'AP155472', 'uat', 281.44, 11.07, 250, 100, '54.97 API'),
('acctbenasset-uat', 'faa-retail-api', 'https://github.com/Fidelity-R', 'Merged', 'acctbenasse', 'AP158019', 'uat', 536.47, 11.22, 500, 100, '104.78 API'),
('aaoesigcloud-dit', 'filiannaccop-api', 'https://github.com/Fidelity-R', 'Open', 'aaoesigclouc', 'AP153455', 'dit', 245.67, 8.92, 300, 100, '81.89 API'),
('acctbenasset-uat', 'nextgensp-api', 'https://github.com/Fidelity-R', 'Merged', 'aaogateway', 'AP155473', 'uat', 189.34, 7.45, 200, 100, '94.67 API')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resource_utilization_app_id ON resource_utilization(app_id);
CREATE INDEX IF NOT EXISTS idx_resource_utilization_env ON resource_utilization(env);
CREATE INDEX IF NOT EXISTS idx_resource_utilization_project ON resource_utilization(project);
CREATE INDEX IF NOT EXISTS idx_optimization_history_app_id ON optimization_history(app_id);
CREATE INDEX IF NOT EXISTS idx_optimization_history_status ON optimization_history(status);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
